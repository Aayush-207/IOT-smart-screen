import { randomUUID } from "node:crypto";

import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  completeUploadSchema,
  createUploadSchema,
} from "@campuscast/contracts";
import type { Database } from "@campuscast/database";
import { Router } from "express";
import { z } from "zod";

import type { Config } from "../config.js";
import { ProblemError } from "../errors.js";
import { withIdempotency } from "../idempotency.js";
import { asyncRoute } from "../middleware.js";

function toBase64Sha256(hex: string): string {
  return Buffer.from(hex, "hex").toString("base64");
}

export function uploadRoutes(
  database: Database,
  s3: S3Client,
  config: Config,
): Router {
  const router = Router();

  router.post(
    "/",
    asyncRoute(async (request, response) => {
      const principal = request.principal;
      if (!principal) throw new ProblemError(401, "AUTHENTICATION_REQUIRED", "Authentication required");
      const input = createUploadSchema.parse(request.body);
      const uploadId = randomUUID();

      const upload = await database.$transaction(async (transaction) =>
        withIdempotency(
          transaction,
          {
            organizationId: principal.organizationId,
            operation: "upload.create",
            key: request.header("idempotency-key"),
            request: input,
          },
          async () => {
            const version = await transaction.contentVersion.findFirst({
              where: {
                id: input.contentVersionId,
                organizationId: principal.organizationId,
                contentItem: { deletedAt: null },
              },
              select: { id: true, status: true },
            });
            if (!version) throw new ProblemError(404, "CONTENT_VERSION_NOT_FOUND", "Content version not found");
            if (!["UPLOADING", "VALIDATION_FAILED"].includes(version.status)) {
              throw new ProblemError(409, "CONTENT_VERSION_NOT_UPLOADABLE", "Content version is not uploadable");
            }

            return transaction.upload.create({
              data: {
                id: uploadId,
                organizationId: principal.organizationId,
                contentVersionId: version.id,
                quarantineBucket: config.quarantineBucket,
                quarantineKey: `${principal.organizationId}/uploads/${uploadId}/source`,
                expectedMimeType: input.mimeType,
                expectedByteLength: input.byteLength,
                expectedSha256: input.sha256,
                uploadExpiresAt: new Date(Date.now() + 15 * 60 * 1_000),
              },
            });
          },
        ),
      );

      const checksum = toBase64Sha256(input.sha256);
      const command = new PutObjectCommand({
        Bucket: upload.quarantineBucket,
        Key: upload.quarantineKey,
        ContentLength: input.byteLength,
        ContentType: input.mimeType,
        ChecksumSHA256: checksum,
        Metadata: {
          "upload-id": upload.id,
          "organization-id": principal.organizationId,
        },
      });
      const url = await getSignedUrl(s3, command, { expiresIn: 15 * 60 });

      response.status(201).send({
        upload: {
          id: upload.id,
          contentVersionId: upload.contentVersionId,
          status: upload.status,
          expiresAt: upload.uploadExpiresAt,
          createdAt: upload.createdAt,
        },
        method: "PUT",
        url,
        requiredHeaders: {
          "content-type": input.mimeType,
          "x-amz-checksum-sha256": checksum,
        },
        expiresAt: upload.uploadExpiresAt,
      });
    }),
  );

  router.get(
    "/:uploadId",
    asyncRoute(async (request, response) => {
      const principal = request.principal;
      if (!principal) throw new ProblemError(401, "AUTHENTICATION_REQUIRED", "Authentication required");
      const uploadId = z.uuid().parse(request.params.uploadId);
      const upload = await database.upload.findFirst({
        where: {
          id: uploadId,
          organizationId: principal.organizationId,
          deletedAt: null,
        },
      });
      if (!upload) throw new ProblemError(404, "UPLOAD_NOT_FOUND", "Upload not found");
      response.send(upload);
    }),
  );

  router.post(
    "/:uploadId/complete",
    asyncRoute(async (request, response) => {
      const principal = request.principal;
      if (!principal) throw new ProblemError(401, "AUTHENTICATION_REQUIRED", "Authentication required");
      const input = completeUploadSchema.parse(request.body);
      const uploadId = z.uuid().parse(request.params.uploadId);
      const upload = await database.upload.findFirst({
        where: {
          id: uploadId,
          organizationId: principal.organizationId,
          deletedAt: null,
        },
      });
      if (!upload) throw new ProblemError(404, "UPLOAD_NOT_FOUND", "Upload not found");
      if (upload.expectedSha256 !== input.sha256) {
        throw new ProblemError(422, "UPLOAD_CHECKSUM_MISMATCH", "Upload checksum does not match authorization");
      }

      const head = await s3.send(
        new HeadObjectCommand({
          Bucket: upload.quarantineBucket,
          Key: upload.quarantineKey,
          ChecksumMode: "ENABLED",
        }),
      );
      const actualSha256 = head.ChecksumSHA256
        ? Buffer.from(head.ChecksumSHA256, "base64").toString("hex")
        : undefined;
      const actualByteLength = head.ContentLength;
      const actualMimeType = head.ContentType;
      if (
        actualByteLength === undefined ||
        actualMimeType === undefined ||
        actualSha256 === undefined ||
        actualByteLength !== Number(upload.expectedByteLength) ||
        actualMimeType !== upload.expectedMimeType ||
        actualSha256 !== upload.expectedSha256
      ) {
        throw new ProblemError(422, "UPLOADED_OBJECT_MISMATCH", "Uploaded object does not match authorization");
      }

      const updated = await database.$transaction(async (transaction) =>
        withIdempotency(
          transaction,
          {
            organizationId: principal.organizationId,
            operation: "upload.complete",
            key: request.header("idempotency-key"),
            request: { uploadId: upload.id, ...input },
          },
          async () => {
            const completed = await transaction.upload.update({
              where: { id: upload.id },
              data: {
                status: "UPLOADED",
                actualMimeType,
                actualByteLength,
                actualSha256,
                completedAt: new Date(),
              },
            });
            await transaction.outboxEvent.create({
              data: {
                organizationId: principal.organizationId,
                aggregateType: "Upload",
                aggregateId: upload.id,
                eventType: "upload.validation.requested",
                payload: {
                  uploadId: upload.id,
                  contentVersionId: upload.contentVersionId,
                  correlationId: request.correlationId,
                },
              },
            });
            return completed;
          },
        ),
      );

      response.status(202).send(updated);
    }),
  );

  return router;
}
