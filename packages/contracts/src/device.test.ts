import assert from "node:assert/strict";
import test from "node:test";

import { heartbeatMessageSchema } from "./device.js";

const heartbeat = {
  schemaVersion: "1.0",
  messageId: "59a56f73-fcac-4319-8ee8-13c53bf80dd5",
  thingName: "campuscast-screen-01",
  sentAt: "2026-07-30T12:00:00.000Z",
  sequence: 42,
  correlationId: "heartbeat-42",
  payload: {
    uptimeSeconds: 600,
    appVersion: "1.0.0",
    appVersionCode: 1,
    playbackState: "PLAYING",
    freeStorageBytes: 2_000_000_000,
    totalStorageBytes: 4_000_000_000,
  },
} as const;

test("heartbeat accepts a bounded versioned device envelope", () => {
  assert.equal(heartbeatMessageSchema.parse(heartbeat).sequence, 42);
});

test("heartbeat rejects unknown payload fields", () => {
  assert.equal(
    heartbeatMessageSchema.safeParse({
      ...heartbeat,
      payload: { ...heartbeat.payload, secret: "must-not-pass" },
    }).success,
    false,
  );
});
