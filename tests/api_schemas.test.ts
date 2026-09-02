import { describe, it, expect } from "vitest";
import { deterministicAdvisories } from "../src/lib/moderation";

describe("API Payloads & Moderation Endpoint validation", () => {
  it("rejects empty body payloads with an advisory warning", () => {
    const advisories = deterministicAdvisories({
      title: "",
      body: "",
      displayStart: null,
      displayEnd: null,
    });
    expect(advisories.length).toBeGreaterThan(0);
    expect(advisories.some((a) => /display window/i.test(a))).toBe(true);
  });

  it("handles valid multilingual and special character strings cleanly", () => {
    const advisories = deterministicAdvisories({
      title: "Annual Hackathon 2026 / 科技节",
      body: "Registration is open from 10:00 AM to 5:00 PM on October 25th in Main Hall.",
      displayStart: new Date(Date.now() + 3600000).toISOString(),
      displayEnd: new Date(Date.now() + 86400000).toISOString(),
    });
    expect(advisories).toEqual([]);
  });
});
