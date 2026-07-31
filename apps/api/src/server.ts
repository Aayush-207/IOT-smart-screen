import { S3Client } from "@aws-sdk/client-s3";
import { createDatabase } from "@campuscast/database";
import { Redis } from "ioredis";
import pino from "pino";

import { createApp } from "./app.js";
import { loadConfig } from "./config.js";

const config = loadConfig();
const logger = pino({ level: config.logLevel });
const database = createDatabase(config.databaseUrl);
const redis = new Redis(config.redisUrl, {
  enableReadyCheck: true,
  maxRetriesPerRequest: 1,
  lazyConnect: true,
});
await redis.connect();
const s3 = new S3Client({ region: config.awsRegion });
const app = createApp({ database, redis, s3, config, logger });
const server = app.listen(config.port, () => {
  logger.info({ port: config.port }, "CampusCast API listening");
});

let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, "shutting down");
  server.close(async () => {
    await Promise.allSettled([database.$disconnect(), redis.quit()]);
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
