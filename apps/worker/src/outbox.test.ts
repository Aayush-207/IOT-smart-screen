import assert from "node:assert/strict";
import test from "node:test";

import { retryDelay } from "./outbox.js";

test("outbox retries back off and remain capped", () => {
  assert.equal(retryDelay(1), 500);
  assert.equal(retryDelay(5), 8_000);
  assert.equal(retryDelay(100), 60_000);
});
