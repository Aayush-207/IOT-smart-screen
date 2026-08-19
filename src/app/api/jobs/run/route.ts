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
        result = await runBroadcastWindowJob();
        break;
      case "deadlines":
        result = await runEligibilityDeadlineJob();
        break;
      case "reminders":
        result = await runReminderEscalationJob();
        break;
      case "archiving":
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
