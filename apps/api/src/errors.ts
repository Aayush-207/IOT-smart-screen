import type { ErrorRequestHandler } from "express";
import { Prisma } from "@campuscast/database";
import { ZodError } from "zod";

import type { ProblemDetails } from "@campuscast/contracts";

export class ProblemError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly retryable = false,
    readonly errors?: ProblemDetails["errors"],
  ) {
    super(message);
  }
}

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  const correlationId = request.correlationId;

  if (error instanceof ZodError) {
    const problem: ProblemDetails = {
      type: "https://errors.campuscast.example/validation",
      title: "Request validation failed",
      status: 422,
      code: "VALIDATION_FAILED",
      correlationId,
      retryable: false,
      errors: error.issues.map((issue) => ({
        path: issue.path.join("."),
        code: issue.code,
        message: issue.message,
      })),
    };
    response.status(422).type("application/problem+json").send(problem);
    return;
  }

  if (error instanceof ProblemError) {
    const problem: ProblemDetails = {
      type: `https://errors.campuscast.example/${error.code.toLowerCase()}`,
      title: error.message,
      status: error.status,
      code: error.code,
      correlationId,
      retryable: error.retryable,
      ...(error.errors ? { errors: error.errors } : {}),
    };
    response.status(error.status).type("application/problem+json").send(problem);
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    const problem: ProblemDetails = {
      type: "https://errors.campuscast.example/conflict",
      title: "The resource already exists",
      status: 409,
      code: "UNIQUE_CONSTRAINT_VIOLATION",
      correlationId,
      retryable: false,
    };
    response.status(409).type("application/problem+json").send(problem);
    return;
  }

  request.log.error({ err: error }, "request failed");
  const problem: ProblemDetails = {
    type: "https://errors.campuscast.example/internal",
    title: "An unexpected error occurred",
    status: 500,
    code: "INTERNAL_ERROR",
    correlationId,
    retryable: false,
  };
  response.status(500).type("application/problem+json").send(problem);
};
