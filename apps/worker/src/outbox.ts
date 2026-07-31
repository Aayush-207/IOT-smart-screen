import type { Queue } from "bullmq";
import type { Database, OutboxEvent } from "@campuscast/database";
import type { Logger } from "pino";

const maximumAttempts = 12;

export function retryDelay(attempt: number): number {
  return Math.min(60_000, 500 * 2 ** Math.max(0, attempt - 1));
}

function safeError(error: unknown): string {
  return (error instanceof Error ? error.message : "unknown dispatcher error").slice(
    0,
    2_000,
  );
}

export async function dispatchOutboxBatch(
  database: Database,
  queue: Queue,
  batchSize: number,
  logger: Logger,
): Promise<number> {
  const now = new Date();
  const abandonedBefore = new Date(now.getTime() - 5 * 60_000);
  const candidates = await database.outboxEvent.findMany({
    where: {
      OR: [
        { status: "PENDING", availableAt: { lte: now } },
        { status: "PROCESSING", updatedAt: { lte: abandonedBefore } },
      ],
    },
    orderBy: [{ availableAt: "asc" }, { createdAt: "asc" }],
    take: batchSize,
  });

  let published = 0;
  for (const event of candidates) {
    if (!(await claimEvent(database, event))) continue;
    const attempt = event.attemptCount + 1;

    try {
      await queue.add(
        event.eventType,
        {
          eventId: event.id,
          eventVersion: event.eventVersion,
          organizationId: event.organizationId,
          aggregateType: event.aggregateType,
          aggregateId: event.aggregateId,
          payload: event.payload,
        },
        {
          jobId: event.id,
          attempts: 8,
          backoff: { type: "exponential", delay: 1_000 },
          removeOnComplete: { age: 86_400, count: 10_000 },
          removeOnFail: { age: 604_800, count: 50_000 },
        },
      );
      await database.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
          lastError: null,
        },
      });
      published += 1;
    } catch (error) {
      const failedPermanently = attempt >= maximumAttempts;
      await database.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: failedPermanently ? "FAILED" : "PENDING",
          availableAt: new Date(Date.now() + retryDelay(attempt)),
          lastError: safeError(error),
        },
      });
      logger.error(
        { err: error, eventId: event.id, attempt, failedPermanently },
        "outbox publication failed",
      );
    }
  }

  return published;
}

async function claimEvent(
  database: Database,
  event: OutboxEvent,
): Promise<boolean> {
  const claimed = await database.outboxEvent.updateMany({
    where: {
      id: event.id,
      status: event.status,
      attemptCount: event.attemptCount,
    },
    data: {
      status: "PROCESSING",
      attemptCount: { increment: 1 },
    },
  });
  return claimed.count === 1;
}
