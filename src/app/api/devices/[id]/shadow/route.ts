import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRouteAuth } from "@/lib/rbac";
import { Role } from "@/lib/enums";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await checkRouteAuth([Role.club_president, Role.club_hod, Role.admin, Role.viewer]);
  if ("response" in authResult) return authResult.response;
  const { id: deviceId } = await params;

  try {
    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      include: {
        schedules: {
          include: {
            contentItem: {
              include: { event: true },
            },
          },
        },
      },
    });

    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    const shadowState = {
      state: {
        reported: {
          status: device.status,
          firmwareVersion: device.firmwareVersion,
          lastHeartbeat: device.lastHeartbeat,
          locationTag: device.locationTag,
          zone: device.zone,
        },
        desired: {
          playlist: device.schedules.map((sched) => ({
            scheduleId: sched.id,
            contentItemId: sched.contentItemId,
            mediaUrl: sched.contentItem.mediaUrl,
            eventTitle: sched.contentItem.event.title,
            startAt: sched.startAt,
            endAt: sched.endAt,
          })),
        },
      },
      metadata: {
        timestamp: Math.floor(Date.now() / 1000),
      },
    };

    return NextResponse.json(shadowState);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
