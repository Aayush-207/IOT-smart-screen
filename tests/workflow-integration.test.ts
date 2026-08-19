import { describe, it, expect } from "vitest";
import { transitionContentState } from "../src/lib/state-machine";
import { Role, Status } from "../src/lib/enums";

function createIntegrationTestEnv() {
  const contentItems = new Map<string, any>();
  const versions: any[] = [];
  const steps: any[] = [];
  const mqttPublished: any[] = [];

  const club = { id: "club_robotics", name: "Robotics Society", hodUserId: "user_hod", departmentId: "dept_eng" };
  const event = { id: "evt_drone", clubId: "club_robotics", title: "Drone Racing 2026", club };

  const dbClient = {
    contentItem: {
      findUnique: async ({ where }: any) => {
        const item = contentItems.get(where.id);
        if (!item) return null;
        return {
          ...item,
          event,
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
        const ver = { id: `ver_${versions.length + 1}`, ...data, createdAt: new Date() };
        versions.push(ver);
        return ver;
      },
    },
    approvalStep: {
      create: async ({ data }: any) => {
        const stp = { id: `step_${steps.length + 1}`, ...data, createdAt: new Date() };
        steps.push(stp);
        return stp;
      },
    },
    user: {
      findUnique: async ({ where }: any) => {
        if (where.id === "user_hod") return { id: "user_hod", role: Role.club_hod, departmentId: "dept_eng" };
        if (where.id === "user_admin") return { id: "user_admin", role: Role.admin };
        return null;
      },
    },
  };

  return { contentItems, versions, steps, mqttPublished, dbClient };
}

describe("Section 10 Full Integration Workflows", () => {
  it("Full Approval & Device Broadcast Workflow (Event -> Upload -> HOD -> Admin -> Live)", async () => {
    const env = createIntegrationTestEnv();

    // 1. Event Created -> awaiting_poster
    env.contentItems.set("ci_100", {
      id: "ci_100",
      eventId: "evt_drone",
      mediaUrl: "",
      selfCertified: false,
      status: Status.awaiting_poster,
      submittedById: "user_pres",
    });

    // 2. Upload Poster
    const step1 = await transitionContentState(
      {
        contentItemId: "ci_100",
        action: "upload_poster",
        actorUserId: "user_pres",
        actorRole: Role.club_president,
        mediaUrl: "https://d111.cloudfront.net/posters/v1.jpg",
        selfCertified: true,
      },
      env.dbClient as any
    );
    expect(step1.newStatus).toBe(Status.pending_hod_approval);

    // 3. HOD Approval
    const step2 = await transitionContentState(
      {
        contentItemId: "ci_100",
        action: "hod_approve",
        actorUserId: "user_hod",
        actorRole: Role.club_hod,
        comment: "Technical specs verified",
      },
      env.dbClient as any
    );
    expect(step2.newStatus).toBe(Status.pending_admin_approval);

    // 4. Admin Approval
    const step3 = await transitionContentState(
      {
        contentItemId: "ci_100",
        action: "admin_approve",
        actorUserId: "user_admin",
        actorRole: Role.admin,
        comment: "Approved for campus screen fleet",
      },
      env.dbClient as any
    );
    expect(step3.newStatus).toBe(Status.approved);

    // 5. Broadcast Job runs -> Live
    const step4 = await transitionContentState(
      {
        contentItemId: "ci_100",
        action: "broadcast_live",
      },
      env.dbClient as any
    );
    expect(step4.newStatus).toBe(Status.live);

    // Confirm audit steps trail
    expect(env.steps.map((s) => s.decision)).toEqual([
      "upload_poster",
      "approve",
      "approve",
      "system_broadcast_live",
    ]);
  });

  it("Rejection & Resubmission Workflow preserving ContentVersion history", async () => {
    const env = createIntegrationTestEnv();

    env.contentItems.set("ci_200", {
      id: "ci_200",
      eventId: "evt_drone",
      mediaUrl: "https://d111.cloudfront.net/posters/original_v1.png",
      selfCertified: true,
      status: Status.pending_hod_approval,
      submittedById: "user_pres",
    });

    // 1. HOD Rejects with comment
    const rejectStep = await transitionContentState(
      {
        contentItemId: "ci_200",
        action: "hod_reject",
        actorUserId: "user_hod",
        actorRole: Role.club_hod,
        comment: "Logo size fails brand guidelines",
      },
      env.dbClient as any
    );
    expect(rejectStep.newStatus).toBe(Status.awaiting_poster);

    // 2. President Re-uploads revised poster
    const reuploadStep = await transitionContentState(
      {
        contentItemId: "ci_200",
        action: "upload_poster",
        actorUserId: "user_pres",
        actorRole: Role.club_president,
        mediaUrl: "https://d111.cloudfront.net/posters/revised_v2.png",
        selfCertified: true,
      },
      env.dbClient as any
    );
    expect(reuploadStep.newStatus).toBe(Status.pending_hod_approval);

    // Verify ContentVersion history contains original_v1.png
    expect(env.versions).toHaveLength(1);
    expect(env.versions[0].mediaUrl).toBe("https://d111.cloudfront.net/posters/original_v1.png");
    expect(env.contentItems.get("ci_200").mediaUrl).toBe("https://d111.cloudfront.net/posters/revised_v2.png");
  });
});
