import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRouteAuth } from "@/lib/rbac";
import { executeStateTransition } from "@/lib/state-machine";
import { Role } from "@/lib/enums";

export const dynamic = "force-dynamic";

// Simple in-memory rate limiting map for uploads per user
const uploadRateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkUploadRateLimit(userId: string): boolean {
  const now = Date.now();
  const userRate = uploadRateLimitMap.get(userId);

  if (!userRate || now > userRate.resetAt) {
    uploadRateLimitMap.set(userId, { count: 1, resetAt: now + 60 * 1000 });
    return true;
  }

  if (userRate.count >= 10) {
    return false; // Limit: max 10 uploads per minute
  }

  userRate.count += 1;
  return true;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await checkRouteAuth([Role.club_president, Role.admin]);
  if ("response" in authResult) return authResult.response;
  const user = authResult.user;

  const { id: eventId } = await params;

  if (!checkUploadRateLimit(user.id)) {
    return NextResponse.json(
      { error: "Too many upload requests. Please wait a minute before trying again." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { mediaUrl, selfCertified } = body;

    if (!mediaUrl) {
      return NextResponse.json({ error: "Missing mediaUrl" }, { status: 400 });
    }

    if (selfCertified !== true) {
      return NextResponse.json(
        { error: "Self-certification check is mandatory to upload posters" },
        { status: 400 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { contentItems: { orderBy: { createdAt: "desc" } } },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (user.role === Role.club_president && event.clubId !== user.clubId) {
      return NextResponse.json(
        { error: "Forbidden: Club President can only upload posters for their own club" },
        { status: 403 }
      );
    }

    // Get latest content item or create one
    let contentItem = event.contentItems[0];
    if (!contentItem) {
      contentItem = await prisma.contentItem.create({
        data: {
          eventId: event.id,
          mediaUrl,
          selfCertified: true,
          status: "awaiting_poster",
          submittedById: user.id,
        },
      });
    }

    const result = await executeStateTransition(
      {
        contentItemId: contentItem.id,
        action: "upload_poster",
        actorUserId: user.id,
        actorRole: user.role,
        mediaUrl,
        selfCertified: true,
      },
      prisma
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
