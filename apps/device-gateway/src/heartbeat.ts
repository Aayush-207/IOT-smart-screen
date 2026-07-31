import {
  heartbeatMessageSchema,
  type HeartbeatMessage,
} from "@campuscast/contracts";
import {
  Prisma,
  type Database,
} from "@campuscast/database";

const consumerName = "device-gateway.heartbeat.v1";

export class UnknownDeviceError extends Error {}

export function shouldAdvanceHeartbeat(
  currentSequence: bigint | null,
  incomingSequence: number | undefined,
): boolean {
  return (
    incomingSequence === undefined ||
    currentSequence === null ||
    BigInt(incomingSequence) > currentSequence
  );
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function ingestHeartbeat(
  database: Database,
  input: unknown,
): Promise<"processed" | "duplicate"> {
  const message = heartbeatMessageSchema.parse(input);
  const device = await database.device.findUnique({
    where: { thingName: message.thingName },
    select: {
      id: true,
      organizationId: true,
      lifecycleStatus: true,
      deletedAt: true,
    },
  });
  if (
    !device ||
    device.deletedAt ||
    device.lifecycleStatus === "RETIRED"
  ) {
    throw new UnknownDeviceError(`Unknown or retired thing: ${message.thingName}`);
  }

  try {
    const processed = await database.$transaction(async (transaction) => {
      const duplicate = await transaction.inboxMessage.findUnique({
        where: {
          consumer_messageId: {
            consumer: consumerName,
            messageId: message.messageId,
          },
        },
        select: { id: true },
      });
      if (duplicate) return false;

      await transaction.inboxMessage.create({
        data: {
          organizationId: device.organizationId,
          consumer: consumerName,
          messageId: message.messageId,
          messageType: "device.heartbeat.v1",
        },
      });

      await transaction.deviceHeartbeat.create({
        data: {
          organizationId: device.organizationId,
          deviceId: device.id,
          messageId: message.messageId,
          sequence:
            message.sequence === undefined ? null : BigInt(message.sequence),
          occurredAt: new Date(message.sentAt),
          appVersion: message.payload.appVersion,
          activeManifestVersion: message.payload.activeManifestVersion ?? null,
          playbackState: message.payload.playbackState,
          freeStorageBytes: BigInt(message.payload.freeStorageBytes),
          networkType: message.payload.networkType ?? null,
          payload: toJson(message.payload),
        },
      });

      const current = await transaction.deviceRuntimeState.findUnique({
        where: { deviceId: device.id },
        select: { lastHeartbeatSequence: true },
      });
      if (
        current &&
        !shouldAdvanceHeartbeat(
          current.lastHeartbeatSequence,
          message.sequence,
        )
      ) {
        return true;
      }

      await upsertRuntimeState(transaction, device.id, message);
      return true;
    });
    return processed ? "processed" : "duplicate";
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const duplicate = await database.inboxMessage.findUnique({
        where: {
          consumer_messageId: {
            consumer: consumerName,
            messageId: message.messageId,
          },
        },
        select: { id: true },
      });
      if (duplicate) return "duplicate";
    }
    throw error;
  }
}

async function upsertRuntimeState(
  transaction: Prisma.TransactionClient,
  deviceId: string,
  message: HeartbeatMessage,
): Promise<void> {
  const state = {
    connectivityStatus: "ONLINE" as const,
    lastSeenAt: new Date(message.sentAt),
    lastHeartbeatSequence:
      message.sequence === undefined ? null : BigInt(message.sequence),
    appVersion: message.payload.appVersion,
    configVersion: message.payload.configVersion ?? 0,
    freeStorageBytes: BigInt(message.payload.freeStorageBytes),
    totalStorageBytes: BigInt(message.payload.totalStorageBytes),
    networkType: message.payload.networkType ?? null,
    clockOffsetMs: message.payload.clockOffsetMs ?? null,
    lastErrorCode: message.payload.lastError?.code ?? null,
    lastErrorAt: message.payload.lastError ? new Date(message.sentAt) : null,
  };
  await transaction.deviceRuntimeState.upsert({
    where: { deviceId },
    create: { deviceId, ...state },
    update: state,
  });
}
