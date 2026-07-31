import { z } from "zod";

const configSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().min(1).max(65_535).default(8080),
    DATABASE_URL: z.string().startsWith("postgresql://"),
    REDIS_URL: z.string().startsWith("redis"),
    AWS_REGION: z.string().min(1).default("ap-south-1"),
    S3_QUARANTINE_BUCKET: z.string().min(3),
    COGNITO_ISSUER: z.url().transform((value) => value.replace(/\/$/, "")),
    COGNITO_CLIENT_ID: z.string().min(1),
    CORS_ORIGINS: z.string().default("http://localhost:3000"),
    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .default("info"),
  })
  .transform((value) => ({
    nodeEnv: value.NODE_ENV,
    port: value.PORT,
    databaseUrl: value.DATABASE_URL,
    redisUrl: value.REDIS_URL,
    awsRegion: value.AWS_REGION,
    quarantineBucket: value.S3_QUARANTINE_BUCKET,
    cognitoIssuer: value.COGNITO_ISSUER,
    cognitoClientId: value.COGNITO_CLIENT_ID,
    corsOrigins: new Set(
      value.CORS_ORIGINS.split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
    logLevel: value.LOG_LEVEL,
  }));

export type Config = z.infer<typeof configSchema>;

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): Config {
  return configSchema.parse(environment);
}
