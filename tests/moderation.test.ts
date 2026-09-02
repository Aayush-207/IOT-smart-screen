import { describe, it, expect } from "vitest";
import { deterministicAdvisories } from "../src/lib/moderation";

const future = (h: number) => new Date(Date.now() + h * 3600_000).toISOString();
const past = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

describe("deterministicAdvisories", () => {
  it("flags a missing display window", () => {
    const out = deterministicAdvisories({
      title: "Guest Lecture on Tuesday",
      body: "Room 204, bring an ID card 12",
    });
    expect(out.some((s) => /display window/i.test(s))).toBe(true);
  });

  it("flags a display end in the past", () => {
    const out = deterministicAdvisories({
      title: "Old notice",
      body: "some reasonably long body text here",
      displayStart: past(48),
      displayEnd: past(1),
    });
    expect(out.some((s) => /past/i.test(s))).toBe(true);
  });

  it("flags inverted display window where end is before start", () => {
    const out = deterministicAdvisories({
      title: "Invalid range notice",
      body: "Valid long message body text goes here",
      displayStart: future(48),
      displayEnd: future(12),
    });
    expect(out.some((s) => /before/i.test(s))).toBe(true);
  });

  it("flags shouting (mostly uppercase)", () => {
    const out = deterministicAdvisories({
      title: "URGENT NOTICE FOR ALL STUDENTS NOW",
      body: "PLEASE READ THIS IMMEDIATELY EVERYONE",
      displayStart: future(1),
      displayEnd: future(48),
    });
    expect(out.some((s) => /uppercase/i.test(s))).toBe(true);
  });

  it("flags an event with no date/time mentioned", () => {
    const out = deterministicAdvisories({
      title: "Robotics workshop announcement",
      body: "Join us in the main hall for a hands on session",
      displayStart: future(1),
      displayEnd: future(48),
    });
    expect(out.some((s) => /no date or time/i.test(s))).toBe(true);
  });

  it("flags empty / almost no text content", () => {
    const out = deterministicAdvisories({
      title: "",
      body: "Short",
      displayStart: future(1),
      displayEnd: future(48),
    });
    expect(out.some((s) => /almost no text content/i.test(s))).toBe(true);
  });

  it("stays quiet on a clean announcement with proper parameters", () => {
    const out = deterministicAdvisories({
      title: "Library hours during finals week",
      body: "The library is open 8am to 2am from March 3 to March 14.",
      displayStart: future(1),
      displayEnd: future(72),
    });
    expect(out).toEqual([]);
  });
});
