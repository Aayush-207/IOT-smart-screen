import { createHash } from "node:crypto";

import type { Prisma } from "@campuscast/database";
import { idempotencyKeySchema } from "@campuscast/contracts";

import { ProblemError } from "./errors.js";

function normalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, normalize(nested)]),
    );
  }
  return value;
}

export function hashRequest(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(normalize(value)))
    .digest("hex");
}

export async function withIdempotency<T extends object>(
  transaction: Prisma.TransactionClient,
  input: {
    organizationId: string;
    operation: string;
    key: string | undefined;
    request: unknown;
  },
  create: () => Promise<T>,
): Promise<T> {
  const key = idempotencyKeySchema.parse(input.key);
  const requestHash = hashRequest(input.request);
  const existing = await transaction.idempotencyKey.upsert({
    where: {
      organizationId_operation_key: {
        organizationId: input.organizationId,
        operation: input.operation,
        key,
      },
    },
    create: {
      organizationId: input.organizationId,
      operation: input.operation,
      key,
      requestHash,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1_000),
    },
    update: {},
  });

  await transaction.$queryRaw`
    SELECT "id" FROM "IdempotencyKey"
    WHERE "id" = ${existing.id}::uuid
    FOR UPDATE
  `;
  const locked = await transaction.idempotencyKey.findUniqueOrThrow({
    where: { id: existing.id },
  });

  if (locked.requestHash !== requestHash) {
    throw new ProblemError(
      409,
      "IDEMPOTENCY_KEY_REUSED",
      "Idempotency key was already used with a different request",
    );
  }
  if (locked.responseBody) return locked.responseBody as T;

  const result = await create();
  await transaction.idempotencyKey.update({
    where: { id: locked.id },
    data: {
      responseStatus: 201,
      responseBody: result as Prisma.InputJsonValue,
      completedAt: new Date(),
    },
  });
  return result;
}
