import type { RequestHandler } from "express";
import {
  createRemoteJWKSet,
  jwtVerify,
  type JWTPayload,
} from "jose";

import type { Config } from "./config.js";
import type { Database } from "@campuscast/database";
import { ProblemError } from "./errors.js";
import { asyncRoute } from "./middleware.js";

export function isCognitoAccessToken(
  payload: JWTPayload,
  clientId: string,
): payload is JWTPayload & {
  sub: string;
  token_use: "access";
  client_id: string;
} {
  return (
    payload.token_use === "access" &&
    typeof payload.sub === "string" &&
    payload.client_id === clientId
  );
}

export function authenticate(config: Config): RequestHandler {
  const jwks = createRemoteJWKSet(
    new URL(`${config.cognitoIssuer}/.well-known/jwks.json`),
  );

  return asyncRoute(async (request, _response, next) => {
    const authorization = request.header("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      throw new ProblemError(401, "AUTHENTICATION_REQUIRED", "Authentication required");
    }

    try {
      const { payload } = await jwtVerify(authorization.slice(7), jwks, {
        issuer: config.cognitoIssuer,
        algorithms: ["RS256"],
      });
      if (!isCognitoAccessToken(payload, config.cognitoClientId)) {
        throw new Error("Not a Cognito access token");
      }
      request.identity = { subject: payload.sub };
      next();
    } catch {
      throw new ProblemError(401, "INVALID_ACCESS_TOKEN", "Invalid access token");
    }
  });
}

export function resolvePrincipal(database: Database): RequestHandler {
  return asyncRoute(async (request, _response, next) => {
    const subject = request.identity?.subject;
    if (!subject) {
      throw new ProblemError(401, "AUTHENTICATION_REQUIRED", "Authentication required");
    }

    const membership = await database.membership.findFirst({
      where: {
        status: "ACTIVE",
        deletedAt: null,
        organization: { status: "ACTIVE", deletedAt: null },
        user: { cognitoSubject: subject, status: "ACTIVE", deletedAt: null },
      },
      select: {
        id: true,
        organizationId: true,
        userId: true,
        roleAssignments: {
          select: {
            role: {
              select: {
                permissions: {
                  select: { permission: { select: { key: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!membership) {
      throw new ProblemError(403, "NO_ACTIVE_MEMBERSHIP", "No active organization membership");
    }

    request.principal = {
      userId: membership.userId,
      membershipId: membership.id,
      organizationId: membership.organizationId,
      permissions: new Set(
        membership.roleAssignments.flatMap((assignment) =>
          assignment.role.permissions.map(({ permission }) => permission.key),
        ),
      ),
    };
    next();
  });
}

export function requirePermission(permission: string): RequestHandler {
  return (request, _response, next) => {
    if (!request.principal?.permissions.has(permission)) {
      next(new ProblemError(403, "FORBIDDEN", "Permission denied"));
      return;
    }
    next();
  };
}
