import { z } from "zod";

const nullableUuid = z.uuid().nullable().optional();
const nullableTimestamp = z.iso.datetime({ offset: true }).nullable().optional();

export const createContentSchema = z
  .object({
    title: z.string().trim().min(1).max(180),
    description: z.string().trim().max(2_000).nullable().optional(),
    mediaType: z.enum(["IMAGE", "VIDEO"]),
    ownerUnitId: nullableUuid,
    categoryId: nullableUuid,
    eventType: z.string().trim().max(80).nullable().optional(),
    eventStartsAt: nullableTimestamp,
    eventEndsAt: nullableTimestamp,
    hardExpiresAt: nullableTimestamp,
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.eventStartsAt &&
      value.eventEndsAt &&
      Date.parse(value.eventEndsAt) <= Date.parse(value.eventStartsAt)
    ) {
      context.addIssue({
        code: "custom",
        path: ["eventEndsAt"],
        message: "eventEndsAt must be later than eventStartsAt",
      });
    }
  });

export const createUploadSchema = z
  .object({
    contentVersionId: z.uuid(),
    fileName: z.string().trim().min(1).max(255),
    byteLength: z.number().int().positive().max(25 * 1024 * 1024),
    mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
    sha256: z.string().regex(/^[0-9a-f]{64}$/),
  })
  .strict();

export const completeUploadSchema = z
  .object({
    sha256: z.string().regex(/^[0-9a-f]{64}$/),
  })
  .strict();

export type CreateContentInput = z.infer<typeof createContentSchema>;
export type CreateUploadInput = z.infer<typeof createUploadSchema>;
export type CompleteUploadInput = z.infer<typeof completeUploadSchema>;
