import { Router } from "express";

import type { Database } from "@campuscast/database";
import { asyncRoute } from "../middleware.js";
import { ProblemError } from "../errors.js";

export function meRoutes(database: Database): Router {
  const router = Router();

  router.get(
    "/",
    asyncRoute(async (request, response) => {
      const principal = request.principal;
      if (!principal) {
        throw new ProblemError(401, "AUTHENTICATION_REQUIRED", "Authentication required");
      }
      const membership = await database.membership.findUniqueOrThrow({
        where: { id: principal.membershipId },
        select: {
          id: true,
          organizationId: true,
          user: {
            select: {
              id: true,
              email: true,
              displayName: true,
              phone: true,
              avatarUrl: true,
            },
          },
          roleAssignments: {
            select: {
              id: true,
              scopeType: true,
              campusId: true,
              buildingId: true,
              zoneId: true,
              organizationalUnitId: true,
              role: { select: { id: true, name: true } },
            },
          },
        },
      });

      response.send({
        id: membership.user.id,
        email: membership.user.email,
        displayName: membership.user.displayName,
        phone: membership.user.phone,
        avatarUrl: membership.user.avatarUrl,
        organizationId: membership.organizationId,
        membershipId: membership.id,
        permissions: [...principal.permissions].sort(),
        roleAssignments: membership.roleAssignments,
      });
    }),
  );

  return router;
}
