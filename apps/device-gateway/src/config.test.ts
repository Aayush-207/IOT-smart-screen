import assert from "node:assert/strict";
import test from "node:test";

import { loadConfig } from "./config.js";

test("gateway configuration requires the durable SQS ingress", () => {
  assert.throws(() => loadConfig({}), /DATABASE_URL|AWS_REGION|TELEMETRY_QUEUE_URL/);
});

test("gateway SQS concurrency remains within service bounds", () => {
  assert.throws(() =>
    loadConfig({
      DATABASE_URL: "postgresql://user:pass@localhost:5432/campuscast",
      AWS_REGION: "ap-south-1",
      TELEMETRY_QUEUE_URL: "https://sqs.ap-south-1.amazonaws.com/123/telemetry",
      SQS_BATCH_SIZE: "11",
    }),
  );
});
