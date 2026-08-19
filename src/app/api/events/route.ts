import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRouteAuth } from "@/lib/rbac";
import { Role, Status } from "@/lib/enums";

export const dynamic = "force-dynamic";

export async function GET() {
  const authResult = await checkRouteAuth([Role.club_president, Role.club_hod, Role.admin, Role.viewer]);
  if ("response" in authResult) return authResult.response;
  try {
    const events = await prisma.event.findMany({
      include: {
        club: true,
        contentItems: {
          include: {
            approvalSteps: {
              orderBy: { createdAt: "desc" },
            },
            versions: {
              orderBy: { createdAt: "desc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { eventDate: "asc" },
    });

    return NextResponse.json(events);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authResult = await checkRouteAuth([Role.club_president, Role.admin]);
  if ("response" in authResult) return authResult.response;
  const user = authResult.user;

  try {
    const body = await req.json();
    const { clubId, title, eventDate, venue } = body;

    if (!clubId || !title || !eventDate || !venue) {
      return NextResponse.json(
        { error: "Missing required fields: clubId, title, eventDate, venue" },
        { status: 400 }
      );
    }

    // Role scope check: club_president can only create for their own club
    if (user.role === Role.club_president && user.clubId !== clubId) {
      return NextResponse.json(
        { error: "Forbidden: Club President can only create events for their own club" },
        { status: 403 }
      );
    }

    const event = await prisma.event.create({
      data: {
        clubId,
        title: title.trim(),
        eventDate: new Date(eventDate),
        venue: venue.trim(),
        contentItems: {
          create: {
            mediaUrl: "",
            status: Status.awaiting_poster,
            submittedById: user.id,
            approvalSteps: {
              create: {
                approverUserId: user.id,
                approverRole: user.role,
                decision: "event_created",
                comment: "Event created, awaiting poster upload",
              },
            },
          },
        },
      },
      include: {
        club: true,
        contentItems: true,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
