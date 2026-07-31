import assert from "node:assert/strict";
import test from "node:test";

import { shouldAdvanceHeartbeat } from "./heartbeat.js";

test("runtime projection rejects out-of-order heartbeat state", () => {
  assert.equal(shouldAdvanceHeartbeat(42n, 41), false);
  assert.equal(shouldAdvanceHeartbeat(42n, 42), false);
  assert.equal(shouldAdvanceHeartbeat(42n, 43), true);
});

test("unsequenced heartbeat remains compatible with v1 devices", () => {
  assert.equal(shouldAdvanceHeartbeat(42n, undefined), true);
});
