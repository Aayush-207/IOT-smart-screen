import { S3Client } from "@aws-sdk/client-s3";
import type { Database } from "@campuscast/database";
import cors from "cors";
import express, { type Express } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import type { Redis } from "ioredis";
import { pinoHttp } from "pino-http";
import type { Logger } from "pino";
import { RedisStore, type RedisReply } from "rate-limit-redis";

import { authenticate, requirePermission, resolvePrincipal } from "./auth.js";
import type { Config } from "./config.js";
import { errorHandler, ProblemError } from "./errors.js";
import { correlation } from "./middleware.js";
import { contentRoutes } from "./routes/content.js";
import { healthRoutes } from "./routes/health.js";
import { meRoutes } from "./routes/me.js";
import { uploadRoutes } from "./routes/uploads.js";

export interface AppDependencies {
  database: Database;
  redis: Redis;
  s3: S3Client;
  config: Config;
  logger: Logger;
}

export function createApp(dependencies: AppDependencies): Express {
  const { database, redis, s3, config, logger } = dependencies;
  const app = express();

  app.disable("x-powered-by");
  app.use(correlation);
  app.use(pinoHttp({ logger }));
  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || config.corsOrigins.has(origin)) {
          callback(null, true);
          return;
        }
        callback(new ProblemError(403, "ORIGIN_NOT_ALLOWED", "Origin not allowed"));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowedHeaders: [
        "authorization",
        "content-type",
        "idempotency-key",
        "if-match",
        "x-correlation-id",
      ],
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 300,
      store: new RedisStore({
        prefix: "campuscast:rate-limit:",
        sendCommand: (...args: string[]) =>
          redis.call(args[0]!, ...args.slice(1)) as Promise<RedisReply>,
      }),
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
  );

  app.use("/health", healthRoutes(database, redis));
  app.use("/v1", authenticate(config), resolvePrincipal(database));
  app.use("/v1/me", meRoutes(database));
  app.use("/v1/content", contentRoutes(database));
  app.use(
    "/v1/uploads",
    requirePermission("content.create"),
    uploadRoutes(database, s3, config),
  );

  app.use((_request, _response, next) => {
    next(new ProblemError(404, "ENDPOINT_NOT_FOUND", "Endpoint not found"));
  });
  app.use(errorHandler);

  return app;
}
