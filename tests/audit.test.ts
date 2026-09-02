import { describe, it, expect, vi } from "vitest";
import { logAudit } from "../src/lib/audit";

describe("logAudit", () => {
  it("inserts an audit row with correct fields", async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
    const mockSupabase = { from: mockFrom } as any;

    await logAudit(mockSupabase, {
      actorId: "user-123",
      action: "approved",
      targetType: "announcement",
      targetId: "ann-456",
      targetLabel: "Campus Hackathon Notice",
      metadata: { priority: "critical" },
    });

    expect(mockFrom).toHaveBeenCalledWith("audit_log");
    expect(mockInsert).toHaveBeenCalledWith({
      actor_id: "user-123",
      action: "approved",
      target_type: "announcement",
      target_id: "ann-456",
      target_label: "Campus Hackathon Notice",
      metadata: { priority: "critical" },
    });
  });

  it("handles empty metadata safely", async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
    const mockSupabase = { from: mockFrom } as any;

    await logAudit(mockSupabase, {
      actorId: "admin-999",
      action: "rebooted_device",
      targetType: "screen",
      targetId: "screen-01",
    });

    expect(mockInsert).toHaveBeenCalledWith({
      actor_id: "admin-999",
      action: "rebooted_device",
      target_type: "screen",
      target_id: "screen-01",
      target_label: null,
      metadata: null,
    });
  });
});
