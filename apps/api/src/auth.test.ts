import assert from "node:assert/strict";
import test from "node:test";

import { isCognitoAccessToken } from "./auth.js";

test("Cognito access tokens validate client_id instead of ID-token audience", () => {
  assert.equal(
    isCognitoAccessToken(
      {
        sub: "user-1",
        token_use: "access",
        client_id: "client-1",
      },
      "client-1",
    ),
    true,
  );
  assert.equal(
    isCognitoAccessToken(
      {
        sub: "user-1",
        token_use: "access",
        client_id: "another-client",
      },
      "client-1",
    ),
    false,
  );
  assert.equal(
    isCognitoAccessToken(
      {
        sub: "user-1",
        token_use: "id",
        client_id: "client-1",
      },
      "client-1",
    ),
    false,
  );
});
