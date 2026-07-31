import { z } from "zod";

const environmentSchema = z.object({
  DATABASE_URL: z.url().startsWith("postgresql://"),
  AWS_REGION: z.string().min(1),
  TELEMETRY_QUEUE_URL: z.url().startsWith("https://"),
  SQS_WAIT_SECONDS: z.coerce.number().int().min(1).max(20).default(20),
  SQS_BATCH_SIZE: z.coerce.number().int().min(1).max(10).default(10),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
});

export type GatewayConfig = ReturnType<typeof loadConfig>;

export function loadConfig(environment: NodeJS.ProcessEnv = process.env) {
  const value = environmentSchema.parse(environment);
  return {
    databaseUrl: value.DATABASE_URL,
    awsRegion: value.AWS_REGION,
    telemetryQueueUrl: value.TELEMETRY_QUEUE_URL,
    waitSeconds: value.SQS_WAIT_SECONDS,
    batchSize: value.SQS_BATCH_SIZE,
    logLevel: value.LOG_LEVEL,
  };
}
