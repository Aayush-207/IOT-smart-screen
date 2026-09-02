import { describe, it, expect } from "vitest";
import { comparePriority, priorityLabel, PRIORITY_RANK } from "../src/lib/priority";

describe("UI & Priority Helpers", () => {
  it("strictly enforces priority tier hierarchies", () => {
    expect(PRIORITY_RANK.routine).toBe(0);
    expect(PRIORITY_RANK.timesensitive).toBe(1);
    expect(PRIORITY_RANK.critical).toBe(2);
    expect(PRIORITY_RANK.emergency).toBe(3);
  });

  it("correctly sorts mixed announcement lists by priority", () => {
    const list = [
      { id: 1, priority: "routine" },
      { id: 2, priority: "emergency" },
      { id: 3, priority: "critical" },
      { id: 4, priority: "timesensitive" },
      { id: 5, priority: "routine" },
    ];

    const sorted = [...list].sort((a, b) => comparePriority(a.priority, b.priority));
    expect(sorted.map((i) => i.id)).toEqual([2, 3, 4, 1, 5]);
  });

  it("handles labels and edge cases gracefully", () => {
    expect(priorityLabel("emergency")).toBe("Emergency");
    expect(priorityLabel("critical")).toBe("Critical");
    expect(priorityLabel("timesensitive")).toBe("Time-sensitive");
    expect(priorityLabel("routine")).toBe("Routine");
    expect(priorityLabel(undefined)).toBe("Routine");
    expect(priorityLabel(null)).toBe("Routine");
    expect(priorityLabel("custom_code")).toBe("custom_code");
  });
});
