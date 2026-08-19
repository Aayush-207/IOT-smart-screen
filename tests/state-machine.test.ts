import { describe, it, expect, beforeEach } from "vitest";
import { transitionContentState } from "../src/lib/state-machine";
import { Role, Status } from "../src/lib/enums";

// Mock dbClient matching Prisma methods used in state machine
function createMockDbClient() {
  const clubs = new Map<string, any>();
  const users = new Map<string, any>();
  const events = new Map<string, any>();
  const contentItems = new Map<string, any>();
  const versions: any[] = [];
  const steps: any[] = [];

  return {
    clubs,
    users,
    events,
    contentItems,
    versions,
    steps,
    db: {
      contentItem: {
        findUnique: async ({ where }: any) => {
          const item = contentItems.get(where.id);
          if (!item) return null;
          const event = events.get(item.eventId);
          const club = event ? clubs.get(event.clubId) : null;
          return {
            ...item,
            event: {
              ...event,
              club,
            },
          };
        },
        update: async ({ where, data }: any) => {
          const item = contentItems.get(where.id);
          const updated = { ...item, ...data, updatedAt: new Date() };
          contentItems.set(where.id, updated);
          return updated;
        },
      },
      contentVersion: {
        create: async ({ data }: any) => {
          const version = { id: `ver_${Date.now()}_${versions.length}`, ...data, createdAt: new Date() };
          versions.push(version);
          return version;
        },
      },
      approvalStep: {
        create: async ({ data }: any) => {
          const step = { id: `step_${Date.now()}_${steps.length}`, ...data, createdAt: new Date() };
          steps.push(step);
          return step;
        },
      },
      user: {
        findUnique: async ({ where }: any) => {
          return users.get(where.id) || null;
        },
      },
    },
  };
}

describe("Section 5.1 State Machine Unit Tests", () => {
  let mockEnv: ReturnType<typeof createMockDbClient>;

  beforeEach(() => {
    mockEnv = createMockDbClient();

    // Setup initial seed data in mock env
    mockEnv.clubs.set("club_hod_yes", { id: "club_hod_yes", name: "Robotics Club", hodUserId: "user_hod_1", departmentId: "dept_eng" });
    mockEnv.clubs.set("club_hod_no", { id: "club_hod_no", name: "Arts Club", hodUserId: null, departmentId: "dept_art" });

    mockEnv.users.set("user_pres_1", { id: "user_pres_1", role: Role.club_president, clubId: "club_hod_yes", departmentId: "dept_eng" });
    mockEnv.users.set("user_pres_2", { id: "user_pres_2", role: Role.club_president, clubId: "club_hod_no", departmentId: "dept_art" });
    mockEnv.users.set("user_hod_1", { id: "user_hod_1", role: Role.club_hod, departmentId: "dept_eng" });
    mockEnv.users.set("user_hod_other", { id: "user_hod_other", role: Role.club_hod, departmentId: "dept_other" });
    mockEnv.users.set("user_admin", { id: "user_admin", role: Role.admin });

    mockEnv.events.set("evt_1", { id: "evt_1", clubId: "club_hod_yes", title: "Drone Race" });
    mockEnv.events.set("evt_2", { id: "evt_2", clubId: "club_hod_no", title: "Gala Concert" });

    mockEnv.contentItems.set("item_1", {
      id: "item_1",
      eventId: "evt_1",
      mediaUrl: "",
      selfCertified: false,
      status: Status.awaiting_poster,
      submittedById: "user_pres_1",
    });

    mockEnv.contentItems.set("item_2", {
      id: "item_2",
      eventId: "evt_2",
      mediaUrl: "",
      selfCertified: false,
      status: Status.awaiting_poster,
      submittedById: "user_pres_2",
    });
  });

  it("routes to pending_hod_approval when club HAS an assigned HOD", async () => {
    const res = await transitionContentState(
      {
        contentItemId: "item_1",
        action: "upload_poster",
        actorUserId: "user_pres_1",
        actorRole: Role.club_president,
        mediaUrl: "https://cdn.example.com/poster1.png",
        selfCertified: true,
      },
      mockEnv.db as any
    );

    expect(res.newStatus).toBe(Status.pending_hod_approval);
    expect(mockEnv.steps).toHaveLength(1);
    expect(mockEnv.steps[0].decision).toBe("upload_poster");
  });

  it("skips HOD stage and routes to pending_admin_approval when club HAS NO assigned HOD", async () => {
    const res = await transitionContentState(
      {
        contentItemId: "item_2",
        action: "upload_poster",
        actorUserId: "user_pres_2",
        actorRole: Role.club_president,
        mediaUrl: "https://cdn.example.com/poster2.png",
        selfCertified: true,
      },
      mockEnv.db as any
    );

    expect(res.newStatus).toBe(Status.pending_admin_approval);
  });

  it("prevents self-approval when submitter attempts HOD approval on their own item", async () => {
    mockEnv.contentItems.get("item_1").status = Status.pending_hod_approval;

    await expect(
      transitionContentState(
        {
          contentItemId: "item_1",
          action: "hod_approve",
          actorUserId: "user_pres_1", // Same user as submittedById!
          actorRole: Role.club_hod,
        },
        mockEnv.db as any
      )
    ).rejects.toThrow("Users cannot approve or reject their own submission");
  });

  it("enforces department scoping for HOD review", async () => {
    mockEnv.contentItems.get("item_1").status = Status.pending_hod_approval;

    await expect(
      transitionContentState(
        {
          contentItemId: "item_1",
          action: "hod_approve",
          actorUserId: "user_hod_other", // Different department!
          actorRole: Role.club_hod,
        },
        mockEnv.db as any
      )
    ).rejects.toThrow("HOD is not authorized for content in a different department");
  });

  it("requires a non-empty comment for HOD rejection", async () => {
    mockEnv.contentItems.get("item_1").status = Status.pending_hod_approval;

    await expect(
      transitionContentState(
        {
          contentItemId: "item_1",
          action: "hod_reject",
          actorUserId: "user_hod_1",
          actorRole: Role.club_hod,
          comment: "   ", // empty comment!
        },
        mockEnv.db as any
      )
    ).rejects.toThrow("Rejection requires a non-empty comment");
  });

  it("transitions pending_hod_approval -> pending_admin_approval on HOD approval", async () => {
    mockEnv.contentItems.get("item_1").status = Status.pending_hod_approval;

    const res = await transitionContentState(
      {
        contentItemId: "item_1",
        action: "hod_approve",
        actorUserId: "user_hod_1",
        actorRole: Role.club_hod,
        comment: "Looks great",
      },
      mockEnv.db as any
    );

    expect(res.newStatus).toBe(Status.pending_admin_approval);
  });

  it("transitions pending_admin_approval -> approved on Admin approval", async () => {
    mockEnv.contentItems.get("item_1").status = Status.pending_admin_approval;

    const res = await transitionContentState(
      {
        contentItemId: "item_1",
        action: "admin_approve",
        actorUserId: "user_admin",
        actorRole: Role.admin,
      },
      mockEnv.db as any
    );

    expect(res.newStatus).toBe(Status.approved);
  });

  it("requires reason comment for Admin override of ineligible items", async () => {
    mockEnv.contentItems.get("item_1").status = Status.ineligible;

    await expect(
      transitionContentState(
        {
          contentItemId: "item_1",
          action: "admin_override",
          actorUserId: "user_admin",
          actorRole: Role.admin,
          comment: "",
        },
        mockEnv.db as any
      )
    ).rejects.toThrow("Override requires a non-empty reason comment");

    const res = await transitionContentState(
      {
        contentItemId: "item_1",
        action: "admin_override",
        actorUserId: "user_admin",
        actorRole: Role.admin,
        comment: "Special Vice-Chancellor exemption granted",
      },
      mockEnv.db as any
    );

    expect(res.newStatus).toBe(Status.pending_admin_approval);
  });
});
