import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SQSClient,
} from "@aws-sdk/client-sqs";
import { createDatabase } from "@campuscast/database";
import pino from "pino";

import { loadConfig } from "./config.js";
import { ingestHeartbeat } from "./heartbeat.js";

const config = loadConfig();
const logger = pino({ level: config.logLevel });
const database = createDatabase(config.databaseUrl);
const sqs = new SQSClient({ region: config.awsRegion });
const abortController = new AbortController();
let stopping = false;

function requestShutdown(signal: string) {
  if (stopping) return;
  stopping = true;
  abortController.abort();
  logger.info({ signal }, "device gateway shutting down");
}

process.on("SIGTERM", () => requestShutdown("SIGTERM"));
process.on("SIGINT", () => requestShutdown("SIGINT"));

while (!stopping) {
  try {
    const batch = await sqs.send(
      new ReceiveMessageCommand({
        QueueUrl: config.telemetryQueueUrl,
        MaxNumberOfMessages: config.batchSize,
        WaitTimeSeconds: config.waitSeconds,
        VisibilityTimeout: 60,
        MessageSystemAttributeNames: ["ApproximateReceiveCount"],
      }),
      { abortSignal: abortController.signal },
    );

    for (const message of batch.Messages ?? []) {
      if (!message.Body || !message.ReceiptHandle) continue;
      try {
        const result = await ingestHeartbeat(database, JSON.parse(message.Body));
        await sqs.send(
          new DeleteMessageCommand({
            QueueUrl: config.telemetryQueueUrl,
            ReceiptHandle: message.ReceiptHandle,
          }),
        );
        logger.info(
          { sqsMessageId: message.MessageId, result },
          "heartbeat ingested",
        );
      } catch (error) {
        logger.warn(
          {
            err: error,
            sqsMessageId: message.MessageId,
            receiveCount:
              message.Attributes?.ApproximateReceiveCount,
          },
          "heartbeat rejected; SQS redrive policy will retry or dead-letter",
        );
      }
    }
  } catch (error) {
    if (!stopping) {
      logger.error({ err: error }, "SQS receive failed");
      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }
  }
}

sqs.destroy();
await database.$disconnect();
