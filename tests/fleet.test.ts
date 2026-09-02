import { describe, it, expect } from "vitest";
import {
  deviceStatus,
  deliveryState,
  relativeTime,
  announcementDisplayStatus,
} from "../src/lib/fleet";

describe("deviceStatus", () => {
  it("is offline when never seen (null or undefined)", () => {
    expect(deviceStatus(null)).toBe("offline");
    expect(deviceStatus(undefined)).toBe("offline");
  });

  it("is online within the last minute", () => {
    expect(deviceStatus(new Date(Date.now() - 5_000).toISOString())).toBe("online");
    expect(deviceStatus(new Date(Date.now() - 55_000).toISOString())).toBe("online");
  });

  it("is stale between 1 and 5 minutes", () => {
    expect(deviceStatus(new Date(Date.now() - 65_000).toISOString())).toBe("stale");
    expect(deviceStatus(new Date(Date.now() - 4 * 60_000).toISOString())).toBe("stale");
  });

  it("is offline beyond 5 minutes", () => {
    expect(deviceStatus(new Date(Date.now() - 6 * 60_000).toISOString())).toBe("offline");
    expect(deviceStatus(new Date(Date.now() - 24 * 3600_000).toISOString())).toBe("offline");
  });
});

describe("deliveryState", () => {
  it("is failed if the screen itself is offline", () => {
    expect(deliveryState(null, new Date().toISOString())).toBe("failed");
    expect(
      deliveryState(new Date(Date.now() - 10 * 60_000).toISOString(), new Date().toISOString())
    ).toBe("failed");
  });

  it("is delivered when recently confirmed and screen online", () => {
    const now = new Date().toISOString();
    expect(deliveryState(now, now)).toBe("delivered");
  });

  it("is pending when screen is online but never confirmed", () => {
    expect(deliveryState(new Date().toISOString(), null)).toBe("pending");
  });

  it("is pending when confirmation is stale even though screen is online", () => {
    const now = new Date().toISOString();
    const staleConfirm = new Date(Date.now() - 10 * 60_000).toISOString();
    expect(deliveryState(now, staleConfirm)).toBe("pending");
  });
});

describe("relativeTime", () => {
  it("returns 'never' for null or empty input", () => {
    expect(relativeTime(null)).toBe("never");
    expect(relativeTime(undefined)).toBe("never");
    expect(relativeTime("")).toBe("never");
  });

  it("formats seconds ago correctly", () => {
    const secondsAgo = new Date(Date.now() - 25_000).toISOString();
    expect(relativeTime(secondsAgo)).toBe("25s ago");
  });

  it("formats minutes ago correctly", () => {
    const minsAgo = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(relativeTime(minsAgo)).toBe("5m ago");
  });

  it("formats hours ago correctly", () => {
    const hoursAgo = new Date(Date.now() - 3 * 3600_000).toISOString();
    expect(relativeTime(hoursAgo)).toBe("3h ago");
  });

  it("formats days ago correctly", () => {
    const daysAgo = new Date(Date.now() - 2 * 24 * 3600_000).toISOString();
    expect(relativeTime(daysAgo)).toBe("2d ago");
  });
});

describe("announcementDisplayStatus", () => {
  const future = (h: number) => new Date(Date.now() + h * 3600_000).toISOString();
  const past = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

  it("passes through non-approved statuses unmodified", () => {
    expect(announcementDisplayStatus({ status: "draft", display_start: null, display_end: null })).toBe("draft");
    expect(announcementDisplayStatus({ status: "pending_approval", display_start: null, display_end: null })).toBe("pending_approval");
    expect(announcementDisplayStatus({ status: "rejected", display_start: null, display_end: null })).toBe("rejected");
    expect(announcementDisplayStatus({ status: "withdrawn", display_start: null, display_end: null })).toBe("withdrawn");
  });

  it("identifies live announcements within active window", () => {
    expect(
      announcementDisplayStatus({
        status: "approved",
        display_start: past(2),
        display_end: future(10),
      })
    ).toBe("live");
  });

  it("identifies live announcements with open-ended duration", () => {
    expect(
      announcementDisplayStatus({
        status: "approved",
        display_start: past(1),
        display_end: null,
      })
    ).toBe("live");
  });

  it("identifies scheduled announcements whose start date is in the future", () => {
    expect(
      announcementDisplayStatus({
        status: "approved",
        display_start: future(5),
        display_end: future(24),
      })
    ).toBe("scheduled");
  });

  it("identifies archived announcements whose end date is in the past", () => {
    expect(
      announcementDisplayStatus({
        status: "approved",
        display_start: past(48),
        display_end: past(2),
      })
    ).toBe("archived");
  });
});
