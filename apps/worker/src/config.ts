import { z } from "zod";

const environmentSchema = z.object({
  DATABASE_URL: z.url().startsWith("postgresql://"),
  REDIS_URL: z.url(),
  OUTBOX_QUEUE_NAME: z.string().min(1).default("campuscast-events"),
  OUTBOX_POLL_MS: z.coerce.number().int().min(100).max(60_000).default(1_000),
  OUTBOX_BATCH_SIZE: z.coerce.number().int().min(1).max(500).default(50),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
});

export type WorkerConfig = ReturnType<typeof loadConfig>;

export function loadConfig(environment: NodeJS.ProcessEnv = process.env) {
  const value = environmentSchema.parse(environment);
  return {
    databaseUrl: value.DATABASE_URL,
    redisUrl: value.REDIS_URL,
    queueName: value.OUTBOX_QUEUE_NAME,
    pollMs: value.OUTBOX_POLL_MS,
    batchSize: value.OUTBOX_BATCH_SIZE,
    logLevel: value.LOG_LEVEL,
  };
}
