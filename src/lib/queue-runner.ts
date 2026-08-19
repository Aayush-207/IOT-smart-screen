import { Queue, Worker } from "bullmq";
import Redis from "ioredis";
import { runAllJobs, runBroadcastWindowJob, runEligibilityDeadlineJob, runReminderEscalationJob, runAutoArchiveJob } from "./jobs";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

let connection: Redis | null = null;
let jobQueue: Queue | null = null;

try {
  connection = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
    retryStrategy(times) {
      if (times > 3) return null; // Stop retrying quickly if Redis is offline
      return 1000;
    },
  });

  connection.on("error", (err) => {
    console.warn("[REDIS WARNING] Could not connect to Redis server:", err.message);
  });

  jobQueue = new Queue("campuscast-jobs", { connection });
} catch (e: any) {
  console.warn("[BULLMQ INITIALIZATION] Operating without active Redis queue:", e?.message || e);
}

export async function scheduleRepeatableJobs() {
  if (!jobQueue) {
    console.log("[JOBS] Redis not connected. Jobs can be triggered manually via /api/jobs/run endpoint");
    return;
  }

  try {
    const broadcastIntervalHours = parseInt(process.env.BROADCAST_JOB_INTERVAL_HOURS || "2", 10);

    await jobQueue.add(
      "broadcast_window",
      {},
      { repeat: { every: broadcastIntervalHours * 60 * 60 * 1000 } } as any
    );

    await jobQueue.add(
      "eligibility_deadline",
      {},
      { repeat: { every: broadcastIntervalHours * 60 * 60 * 1000 } } as any
    );

    await jobQueue.add(
      "auto_archive",
      {},
      { repeat: { every: 24 * 60 * 60 * 1000 } } as any
    );

    console.log("[BULLMQ] Successfully scheduled repeatable background jobs");
  } catch (err: any) {
    console.warn("[BULLMQ ERROR] Failed to schedule jobs:", err.message);
  }
}

export function initWorker() {
  if (!connection) return null;

  try {
    return new Worker(
      "campuscast-jobs",
      async (job) => {
        console.log(`[BULLMQ WORKER] Executing job: ${job.name}`);
        switch (job.name) {
          case "broadcast_window":
            return await runBroadcastWindowJob();
          case "eligibility_deadline":
            return await runEligibilityDeadlineJob();
          case "reminder_escalation":
            return await runReminderEscalationJob();
          case "auto_archive":
            return await runAutoArchiveJob();
          default:
            return await runAllJobs();
        }
      },
      { connection }
    );
  } catch (err: any) {
    console.warn("[BULLMQ WORKER ERROR]", err.message);
    return null;
  }
}
