import { z } from "zod";

const thingNameSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9:_-]+$/);

const deviceErrorSchema = z
  .object({
    code: z.string().min(1).max(120),
    message: z.string().min(1).max(1_000),
    retryable: z.boolean(),
  })
  .strict();

export const heartbeatPayloadSchema = z
  .object({
    uptimeSeconds: z.number().int().nonnegative(),
    appVersion: z.string().min(1).max(80),
    appVersionCode: z.number().int().positive(),
    configVersion: z.number().int().nonnegative().optional(),
    activeManifestId: z.uuid().nullable().optional(),
    activeManifestVersion: z.number().int().positive().nullable().optional(),
    readyManifestId: z.uuid().nullable().optional(),
    playbackState: z.enum([
      "STARTING",
      "PLAYING",
      "FALLBACK",
      "DEGRADED",
      "STOPPED",
    ]),
    freeStorageBytes: z.number().int().nonnegative(),
    totalStorageBytes: z.number().int().nonnegative(),
    networkType: z.string().max(32).nullable().optional(),
    signalStrength: z.number().nullable().optional(),
    temperatureCelsius: z.number().nullable().optional(),
    clockOffsetMs: z.number().int().nullable().optional(),
    lastRestartReason: z.string().max(120).nullable().optional(),
    lastError: deviceErrorSchema.nullable().optional(),
  })
  .strict();

export const heartbeatMessageSchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    messageId: z.uuid(),
    thingName: thingNameSchema,
    sentAt: z.iso.datetime({ offset: true }),
    sequence: z.number().int().nonnegative().optional(),
    correlationId: z.string().min(1).max(128),
    payload: heartbeatPayloadSchema,
  })
  .strict();

export type HeartbeatMessage = z.infer<typeof heartbeatMessageSchema>;
