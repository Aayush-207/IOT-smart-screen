import { describe, it, expect } from "vitest";
import { announcementDisplayStatus } from "../src/lib/fleet";

describe("Cron and Expiration Lifecycle Rules", () => {
  it("determines active vs expired without requiring DB roundtrips", () => {
    const expiredItem = {
      status: "approved",
      display_start: "2024-01-01T00:00:00Z",
      display_end: "2024-01-02T00:00:00Z",
    };
    expect(announcementDisplayStatus(expiredItem)).toBe("archived");

    const futureItem = {
      status: "approved",
      display_start: new Date(Date.now() + 86400000).toISOString(),
      display_end: new Date(Date.now() + 172800000).toISOString(),
    };
    expect(announcementDisplayStatus(futureItem)).toBe("scheduled");

    const activeItem = {
      status: "approved",
      display_start: new Date(Date.now() - 3600000).toISOString(),
      display_end: new Date(Date.now() + 3600000).toISOString(),
    };
    expect(announcementDisplayStatus(activeItem)).toBe("live");
  });

  it("handles boundary exact timestamp cases", () => {
    const exactNow = new Date().toISOString();
    const immediateItem = {
      status: "approved",
      display_start: exactNow,
      display_end: null,
    };
    expect(announcementDisplayStatus(immediateItem)).toBe("live");
  });
});
