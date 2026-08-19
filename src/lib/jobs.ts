import { prisma } from "./prisma";
import { transitionContentState } from "./state-machine";
import { deviceMessenger } from "./device-messenger";
import { storageService } from "./storage-service";
import { Status, Role } from "./enums";

/**
 * Job 6.1: Broadcast Window Job
 * Queries items with status='approved' AND eventDate <= now() + 21 days.
 * Resolves device schedules, publishes to MQTT, transitions status to 'live'.
 */
export async function runBroadcastWindowJob(): Promise<{ rowsProcessed: number }> {
  const jobName = "broadcast_window_job";
  const startedAt = new Date();

  const jobRun = await prisma.jobRun.create({
    data: { jobName, status: "running", startedAt },
  });

  let rowsProcessed = 0;

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + 21);

    const eligibleItems = await prisma.contentItem.findMany({
      where: {
        status: Status.approved,
        event: {
          eventDate: {
            lte: cutoffDate,
          },
        },
      },
      include: {
        event: true,
        schedules: {
          include: {
            device: true,
          },
        },
      },
    });

    // If no devices or schedules exist, fetch all active online/offline devices as target
    const allDevices = await prisma.device.findMany();

    for (const item of eligibleItems) {
      // Check current status inside transaction to prevent race conditions
      const refreshedItem = await prisma.contentItem.findUnique({
        where: { id: item.id },
      });

      if (refreshedItem?.status !== Status.approved) {
        continue;
      }

      const targetDevices = item.schedules.length > 0
        ? item.schedules.map((s) => s.device)
        : allDevices;

      let publishedCount = 0;
      const signedUrl = storageService.getSignedUrl(item.mediaUrl);
      const startAt = new Date().toISOString();
      const endAt = item.event.eventDate.toISOString();

      for (const device of targetDevices) {
        const res = await deviceMessenger.publishContent(device.id, {
          contentItemId: item.id,
          mediaUrl: signedUrl,
          startAt,
          endAt,
        });

        if (res.success) {
          publishedCount++;
          // Ensure a Schedule row exists if not present
          const existingSchedule = await prisma.schedule.findFirst({
            where: { contentItemId: item.id, deviceId: device.id },
          });
          if (!existingSchedule) {
            await prisma.schedule.create({
              data: {
                contentItemId: item.id,
                deviceId: device.id,
                startAt: new Date(),
                endAt: item.event.eventDate,
              },
            });
          }
        }
      }

      if (publishedCount > 0 || targetDevices.length === 0) {
        await prisma.$transaction(async (tx) => {
          await transitionContentState(
            {
              contentItemId: item.id,
              action: "broadcast_live",
            },
            tx
          );
        });
        rowsProcessed++;
      }
    }

    await prisma.jobRun.update({
      where: { id: jobRun.id },
      data: {
        status: "success",
        rowsProcessed,
        completedAt: new Date(),
      },
    });

    return { rowsProcessed };
  } catch (error: any) {
    await prisma.jobRun.update({
      where: { id: jobRun.id },
      data: {
        status: "failed",
        error: error?.message || String(error),
        completedAt: new Date(),
      },
    });
    throw error;
  }
}

/**
 * Job 6.2: Eligibility Deadline Job
 * Queries items NOT IN ('approved','live','archived') AND eventDate <= now() + 7 days.
 * Transitions to 'ineligible'.
 */
export async function runEligibilityDeadlineJob(): Promise<{ rowsProcessed: number }> {
  const jobName = "eligibility_deadline_job";
  const startedAt = new Date();

  const jobRun = await prisma.jobRun.create({
    data: { jobName, status: "running", startedAt },
  });

  let rowsProcessed = 0;

  try {
    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + 7);

    const pendingItems = await prisma.contentItem.findMany({
      where: {
        status: {
          in: [Status.awaiting_poster, Status.pending_hod_approval, Status.pending_admin_approval],
        },
        event: {
          eventDate: {
            lte: deadlineDate,
          },
        },
      },
      include: {
        event: true,
      },
    });

    for (const item of pendingItems) {
      await prisma.$transaction(async (tx) => {
        await transitionContentState(
          {
            contentItemId: item.id,
            action: "mark_ineligible",
          },
          tx
        );
      });
      rowsProcessed++;
      console.log(`[DEADLINE JOB] Marked ContentItem ${item.id} (Event: ${item.event.title}) as ineligible`);
    }

    await prisma.jobRun.update({
      where: { id: jobRun.id },
      data: {
        status: "success",
        rowsProcessed,
        completedAt: new Date(),
      },
    });

    return { rowsProcessed };
  } catch (error: any) {
    await prisma.jobRun.update({
      where: { id: jobRun.id },
      data: {
        status: "failed",
        error: error?.message || String(error),
        completedAt: new Date(),
      },
    });
    throw error;
  }
}

/**
 * Job 6.3: Reminder & Escalation Job
 * Sends reminders for items pending > 48h. Escalates to Admin if within 3 days of 7-day deadline (<= 10 days out).
 */
export async function runReminderEscalationJob(): Promise<{ rowsProcessed: number }> {
  const jobName = "reminder_escalation_job";
  const startedAt = new Date();

  const jobRun = await prisma.jobRun.create({
    data: { jobName, status: "running", startedAt },
  });

  let rowsProcessed = 0;

  try {
    const now = new Date();
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const tenDaysFromNow = new Date();
    tenDaysFromNow.setDate(tenDaysFromNow.getDate() + 10);

    const itemsToReview = await prisma.contentItem.findMany({
      where: {
        status: {
          in: [Status.pending_hod_approval, Status.pending_admin_approval],
        },
      },
      include: {
        event: {
          include: { club: true },
        },
      },
    });

    for (const item of itemsToReview) {
      const isUrgent = item.event.eventDate >= now && item.event.eventDate <= tenDaysFromNow;
      const isStale = item.updatedAt <= fortyEightHoursAgo;

      if (item.status === Status.pending_hod_approval && isUrgent) {
        // Escalate directly to Admin
        await prisma.$transaction(async (tx) => {
          await tx.contentItem.update({
            where: { id: item.id },
            data: { status: Status.pending_admin_approval },
          });
          await tx.approvalStep.create({
            data: {
              contentItemId: item.id,
              approverRole: Role.admin,
              decision: "escalated_to_admin",
              comment: "Escalated to Admin because event date is within 10 days (3 days before eligibility deadline)",
            },
          });
        });
        rowsProcessed++;
        console.log(`[ESCALATION JOB] Escalated item ${item.id} to Admin due to upcoming deadline`);
      } else if (isStale) {
        console.log(`[REMINDER JOB] Reminder sent for ContentItem ${item.id} pending in state ${item.status}`);
        rowsProcessed++;
      }
    }

    await prisma.jobRun.update({
      where: { id: jobRun.id },
      data: {
        status: "success",
        rowsProcessed,
        completedAt: new Date(),
      },
    });

    return { rowsProcessed };
  } catch (error: any) {
    await prisma.jobRun.update({
      where: { id: jobRun.id },
      data: {
        status: "failed",
        error: error?.message || String(error),
        completedAt: new Date(),
      },
    });
    throw error;
  }
}

/**
 * Job 6.4: Auto-Archive Job
 * Daily job. status = 'live' AND eventDate < now() -> status = 'archived'. Deletes/expires schedules.
 */
export async function runAutoArchiveJob(): Promise<{ rowsProcessed: number }> {
  const jobName = "auto_archive_job";
  const startedAt = new Date();

  const jobRun = await prisma.jobRun.create({
    data: { jobName, status: "running", startedAt },
  });

  let rowsProcessed = 0;

  try {
    const now = new Date();

    const expiredLiveItems = await prisma.contentItem.findMany({
      where: {
        status: Status.live,
        event: {
          eventDate: {
            lt: now,
          },
        },
      },
    });

    for (const item of expiredLiveItems) {
      await prisma.$transaction(async (tx) => {
        // Delete active schedules to free up device slot
        await tx.schedule.deleteMany({
          where: { contentItemId: item.id },
        });

        await transitionContentState(
          {
            contentItemId: item.id,
            action: "auto_archive",
          },
          tx
        );
      });
      rowsProcessed++;
      console.log(`[ARCHIVE JOB] Archived ContentItem ${item.id}`);
    }

    await prisma.jobRun.update({
      where: { id: jobRun.id },
      data: {
        status: "success",
        rowsProcessed,
        completedAt: new Date(),
      },
    });

    return { rowsProcessed };
  } catch (error: any) {
    await prisma.jobRun.update({
      where: { id: jobRun.id },
      data: {
        status: "failed",
        error: error?.message || String(error),
        completedAt: new Date(),
      },
    });
    throw error;
  }
}

/**
 * Convenience runner for all jobs
 */
export async function runAllJobs() {
  const broadcast = await runBroadcastWindowJob();
  const deadline = await runEligibilityDeadlineJob();
  const reminder = await runReminderEscalationJob();
  const archive = await runAutoArchiveJob();

  return {
    broadcast,
    deadline,
    reminder,
    archive,
  };
}
