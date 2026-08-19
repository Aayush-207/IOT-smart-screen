import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRouteAuth } from "@/lib/rbac";
import { Role, Status } from "@/lib/enums";

export const dynamic = "force-dynamic";

export async function GET() {
  const authResult = await checkRouteAuth([Role.club_president, Role.club_hod, Role.admin, Role.viewer]);
  if ("response" in authResult) return authResult.response;
  try {
    const pendingItems = await prisma.contentItem.findMany({
      where: {
        status: {
          in: [Status.pending_hod_approval, Status.pending_admin_approval, Status.awaiting_poster],
        },
      },
      include: {
        event: {
          include: {
            club: true,
          },
        },
      },
      orderBy: {
        event: {
          eventDate: "asc",
        },
      },
    });

    const now = new Date();

    const deadlines = pendingItems.map((item) => {
      const eventDate = new Date(item.event.eventDate);
      const diffMs = eventDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      return {
        contentItemId: item.id,
        eventId: item.event.id,
        eventTitle: item.event.title,
        clubName: item.event.club.name,
        status: item.status,
        eventDate: item.event.eventDate,
        daysRemaining,
        isUrgent: daysRemaining <= 7,
      };
    });

    return NextResponse.json(deadlines);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
