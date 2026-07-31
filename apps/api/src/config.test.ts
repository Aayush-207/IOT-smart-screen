import assert from "node:assert/strict";
import test from "node:test";

import { loadConfig } from "./config.js";

test("configuration fails closed when security dependencies are absent", () => {
  assert.throws(() => loadConfig({}));
});

test("configuration normalizes trusted origins and Cognito issuer", () => {
  const config = loadConfig({
    DATABASE_URL: "postgresql://user:pass@localhost:5432/campuscast",
    REDIS_URL: "redis://localhost:6379",
    S3_QUARANTINE_BUCKET: "campuscast-quarantine",
    COGNITO_ISSUER: "https://cognito-idp.ap-south-1.amazonaws.com/pool/",
    COGNITO_CLIENT_ID: "client",
    CORS_ORIGINS: "https://admin.example, http://localhost:3000 ",
  });

  assert.equal(
    config.cognitoIssuer,
    "https://cognito-idp.ap-south-1.amazonaws.com/pool",
  );
  assert.equal(config.corsOrigins.has("https://admin.example"), true);
});
