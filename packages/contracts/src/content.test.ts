import assert from "node:assert/strict";
import test from "node:test";

import { createContentSchema, createUploadSchema } from "./content.js";

test("content rejects an inverted event range", () => {
  const result = createContentSchema.safeParse({
    title: "Tech Fest",
    mediaType: "IMAGE",
    eventStartsAt: "2026-08-02T10:00:00+05:30",
    eventEndsAt: "2026-08-02T09:00:00+05:30",
  });

  assert.equal(result.success, false);
});

test("upload accepts only bounded poster media with a sha256 digest", () => {
  const result = createUploadSchema.safeParse({
    contentVersionId: "70bbff6a-9ac9-48dd-a660-33e9fa2aa160",
    fileName: "poster.png",
    byteLength: 1024,
    mimeType: "image/png",
    sha256: "a".repeat(64),
  });

  assert.equal(result.success, true);
});
