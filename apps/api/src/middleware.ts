import { randomUUID } from "node:crypto";

import type { NextFunction, Request, RequestHandler, Response } from "express";

const correlationPattern = /^[A-Za-z0-9._:-]{1,128}$/;

export const correlation: RequestHandler = (request, response, next) => {
  const supplied = request.header("x-correlation-id");
  request.correlationId =
    supplied && correlationPattern.test(supplied) ? supplied : randomUUID();
  response.setHeader("x-correlation-id", request.correlationId);
  next();
};

export function asyncRoute(
  handler: (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => Promise<void>,
): RequestHandler {
  return (request, response, next) => {
    void handler(request, response, next).catch(next);
  };
}
