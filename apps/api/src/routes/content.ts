import { Router } from "express";

import { createContentSchema } from "@campuscast/contracts";
import type { Database } from "@campuscast/database";

import { ProblemError } from "../errors.js";
import { withIdempotency } from "../idempotency.js";
import { asyncRoute } from "../middleware.js";
import { requirePermission } from "../auth.js";

export function contentRoutes(database: Database): Router {
  const router = Router();

  router.get(
    "/",
    requirePermission("content.read"),
    asyncRoute(async (request, response) => {
      const principal = request.principal;
      if (!principal) throw new ProblemError(401, "AUTHENTICATION_REQUIRED", "Authentication required");

      const items = await database.contentItem.findMany({
        where: { organizationId: principal.organizationId, deletedAt: null },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 25,
        include: { currentVersion: { include: { assets: true } } },
      });
      response.send({
        items,
        page: { nextCursor: null, hasMore: false },
      });
    }),
  );

  router.post(
    "/",
    requirePermission("content.create"),
    asyncRoute(async (request, response) => {
      const principal = request.principal;
      if (!principal) throw new ProblemError(401, "AUTHENTICATION_REQUIRED", "Authentication required");
      const input = createContentSchema.parse(request.body);

      const result = await database.$transaction(async (transaction) =>
        withIdempotency(
          transaction,
          {
            organizationId: principal.organizationId,
            operation: "content.create",
            key: request.header("idempotency-key"),
            request: input,
          },
          async () => {
            if (input.ownerUnitId) {
              const ownerExists = await transaction.organizationalUnit.count({
                where: {
                  id: input.ownerUnitId,
                  organizationId: principal.organizationId,
                  deletedAt: null,
                },
              });
              if (!ownerExists) {
                throw new ProblemError(
                  422,
                  "OWNER_UNIT_INVALID",
                  "Owner unit is not valid for this organization",
                );
              }
            }
            if (input.categoryId) {
              const categoryExists = await transaction.category.count({
                where: {
                  id: input.categoryId,
                  organizationId: principal.organizationId,
                  deletedAt: null,
                },
              });
              if (!categoryExists) {
                throw new ProblemError(
                  422,
                  "CATEGORY_INVALID",
                  "Category is not valid for this organization",
                );
              }
            }

            const content = await transaction.contentItem.create({
              data: {
                organizationId: principal.organizationId,
                submittedById: principal.membershipId,
                title: input.title,
                description: input.description ?? null,
                ownerUnitId: input.ownerUnitId ?? null,
                categoryId: input.categoryId ?? null,
                eventType: input.eventType ?? null,
                eventStartsAt: input.eventStartsAt
                  ? new Date(input.eventStartsAt)
                  : null,
                eventEndsAt: input.eventEndsAt ? new Date(input.eventEndsAt) : null,
                hardExpiresAt: input.hardExpiresAt
                  ? new Date(input.hardExpiresAt)
                  : null,
                versions: {
                  create: {
                    organizationId: principal.organizationId,
                    createdById: principal.membershipId,
                    versionNumber: 1,
                    mediaType: input.mediaType,
                    titleSnapshot: input.title,
                    metadataSnapshot: input,
                  },
                },
              },
              include: { versions: true },
            });
            const currentVersion = content.versions[0];
            if (!currentVersion) throw new Error("Created content has no version");

            const updated = await transaction.contentItem.update({
              where: { id: content.id },
              data: { currentVersionId: currentVersion.id },
              include: { currentVersion: true },
            });
            await transaction.auditLog.create({
              data: {
                organizationId: principal.organizationId,
                actorUserId: principal.userId,
                actorType: "USER",
                action: "content.create",
                resourceType: "ContentItem",
                resourceId: updated.id,
                outcome: "SUCCESS",
                correlationId: request.correlationId,
                after: {
                  id: updated.id,
                  title: updated.title,
                  status: updated.status,
                  version: updated.version,
                  currentVersionId: updated.currentVersionId,
                },
              },
            });
            return updated;
          },
        ),
      );

      response.status(201).setHeader("etag", `"${result.version}"`).send(result);
    }),
  );

  return router;
}
