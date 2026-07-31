import assert from "node:assert/strict";
import test from "node:test";

import { loadConfig } from "./config.js";

test("worker configuration fails closed without durable dependencies", () => {
  assert.throws(() => loadConfig({}), /DATABASE_URL|REDIS_URL/);
});

test("worker configuration applies bounded dispatcher defaults", () => {
  const config = loadConfig({
    DATABASE_URL: "postgresql://user:pass@localhost:5432/campuscast",
    REDIS_URL: "redis://localhost:6379",
  });
  assert.equal(config.batchSize, 50);
  assert.equal(config.pollMs, 1_000);
});
