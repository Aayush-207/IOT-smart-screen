import { Router } from "express";

import type { Database } from "@campuscast/database";
import type { Redis } from "ioredis";
import { asyncRoute } from "../middleware.js";

export function healthRoutes(database: Database, redis: Redis): Router {
  const router = Router();

  router.get("/live", (_request, response) => {
    response.send({
      status: "ok",
      service: "campuscast-api",
      version: process.env.npm_package_version ?? "development",
      timestamp: new Date().toISOString(),
    });
  });

  router.get(
    "/ready",
    asyncRoute(async (_request, response) => {
      const checks: Record<string, string> = {};
      try {
        await database.$queryRaw`SELECT 1`;
        checks.database = "ok";
      } catch {
        checks.database = "unavailable";
      }
      try {
        checks.redis = (await redis.ping()) === "PONG" ? "ok" : "unavailable";
      } catch {
        checks.redis = "unavailable";
      }

      const ready = Object.values(checks).every((status) => status === "ok");
      response.status(ready ? 200 : 503).send({
        status: ready ? "ok" : "unavailable",
        service: "campuscast-api",
        version: process.env.npm_package_version ?? "development",
        timestamp: new Date().toISOString(),
        checks,
      });
    }),
  );

  return router;
}
