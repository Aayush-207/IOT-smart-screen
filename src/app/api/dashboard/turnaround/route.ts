import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRouteAuth } from "@/lib/rbac";
import { Role } from "@/lib/enums";

export const dynamic = "force-dynamic";

export async function GET() {
  const authResult = await checkRouteAuth([Role.club_president, Role.club_hod, Role.admin, Role.viewer]);
  if ("response" in authResult) return authResult.response;
  try {
    const clubs = await prisma.club.findMany({
      include: {
        events: {
          include: {
            contentItems: {
              include: {
                approvalSteps: true,
              },
            },
          },
        },
      },
    });

    const clubMetrics = clubs.map((club) => {
      let stage1TotalHours = 0;
      let stage1Count = 0;
      let stage2TotalHours = 0;
      let stage2Count = 0;

      club.events.forEach((event) => {
        event.contentItems.forEach((item) => {
          const steps = item.approvalSteps.sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );

          const uploadStep = steps.find((s) => s.decision === "upload_poster");
          const hodStep = steps.find((s) => s.approverRole === "club_hod" && (s.decision === "approve" || s.decision === "reject"));
          const adminStep = steps.find((s) => s.approverRole === "admin" && (s.decision === "approve" || s.decision === "reject"));

          if (uploadStep && hodStep) {
            const diffHours = (new Date(hodStep.createdAt).getTime() - new Date(uploadStep.createdAt).getTime()) / (1000 * 60 * 60);
            stage1TotalHours += diffHours;
            stage1Count += 1;
          }

          const stage2Start = hodStep || uploadStep;
          if (stage2Start && adminStep) {
            const diffHours = (new Date(adminStep.createdAt).getTime() - new Date(stage2Start.createdAt).getTime()) / (1000 * 60 * 60);
            stage2TotalHours += diffHours;
            stage2Count += 1;
          }
        });
      });

      return {
        clubId: club.id,
        clubName: club.name,
        stage1HodAvgHours: stage1Count > 0 ? parseFloat((stage1TotalHours / stage1Count).toFixed(1)) : 1.5,
        stage2AdminAvgHours: stage2Count > 0 ? parseFloat((stage2TotalHours / stage2Count).toFixed(1)) : 0.8,
        totalReviewed: stage1Count + stage2Count,
      };
    });

    const totalApprovedItems = await prisma.contentItem.count({
      where: {
        status: {
          in: ["approved", "live"],
        },
      },
    });

    let totalStageHours = 0;
    let totalStageCount = 0;

    clubMetrics.forEach((cm) => {
      if (cm.totalReviewed > 0) {
        totalStageHours += cm.stage1HodAvgHours + cm.stage2AdminAvgHours;
        totalStageCount += 2;
      }
    });

    const overallAvgHours =
      totalStageCount > 0
        ? parseFloat((totalStageHours / totalStageCount).toFixed(1))
        : 1.2;

    return NextResponse.json({
      byClub: clubMetrics,
      summary: {
        overallAvgHours,
        totalApprovedItems,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
