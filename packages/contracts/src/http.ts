import { z } from "zod";

export const idempotencyKeySchema = z.string().trim().min(8).max(128);

export interface ProblemDetails {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly code: string;
  readonly detail?: string;
  readonly correlationId: string;
  readonly retryable: boolean;
  readonly errors?: ReadonlyArray<{
    readonly path: string;
    readonly code: string;
    readonly message: string;
  }>;
}
