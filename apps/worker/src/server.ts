import { createDatabase } from "@campuscast/database";
import { Queue } from "bullmq";
import { Redis } from "ioredis";
import pino from "pino";

import { loadConfig } from "./config.js";
import { dispatchOutboxBatch } from "./outbox.js";

const config = loadConfig();
const logger = pino({ level: config.logLevel });
const database = createDatabase(config.databaseUrl);
const redis = new Redis(config.redisUrl, {
  enableReadyCheck: true,
  maxRetriesPerRequest: null,
  lazyConnect: true,
});
await redis.connect();
const queue = new Queue(config.queueName, { connection: redis });

let stopping = false;
function requestShutdown(signal: string) {
  if (stopping) return;
  stopping = true;
  logger.info({ signal }, "worker shutting down");
}

process.on("SIGTERM", () => requestShutdown("SIGTERM"));
process.on("SIGINT", () => requestShutdown("SIGINT"));

while (!stopping) {
  try {
    const published = await dispatchOutboxBatch(
      database,
      queue,
      config.batchSize,
      logger,
    );
    if (published > 0) logger.info({ published }, "outbox batch published");
  } catch (error) {
    logger.error({ err: error }, "outbox dispatcher tick failed");
  }
  await new Promise((resolve) => setTimeout(resolve, config.pollMs));
}

await Promise.allSettled([queue.close(), redis.quit(), database.$disconnect()]);
