import { NextRequest, NextResponse } from "next/server";
import { checkRouteAuth } from "@/lib/rbac";
import { Role } from "@/lib/enums";
import {
  runAllJobs,
  runBroadcastWindowJob,
  runEligibilityDeadlineJob,
  runReminderEscalationJob,
  runAutoArchiveJob,
} from "@/lib/jobs";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const authResult = await checkRouteAuth([Role.admin]);
  if ("response" in authResult) return authResult.response;

  try {
    const body = await req.json().catch(() => ({}));
    const { jobName } = body;

    let result;
    switch (jobName) {
      case "broadcast":
      case "broadcast_window":
        result = await runBroadcastWindowJob();
        break;
      case "deadlines":
      case "eligibility_check":
      case "eligibility_deadline":
        result = await runEligibilityDeadlineJob();
        break;
      case "reminders":
      case "send_reminders":
      case "reminder_escalation":
        result = await runReminderEscalationJob();
        break;
      case "archiving":
      case "archive_past_events":
      case "auto_archive":
        result = await runAutoArchiveJob();
        break;
      default:
        result = await runAllJobs();
        break;
    }

    return NextResponse.json({
      message: `Job '${jobName || "all"}' executed successfully`,
      result,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
