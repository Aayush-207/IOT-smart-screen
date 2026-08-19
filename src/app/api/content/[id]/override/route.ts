import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRouteAuth } from "@/lib/rbac";
import { executeStateTransition } from "@/lib/state-machine";
import { Role } from "@/lib/enums";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await checkRouteAuth([Role.admin]);
  if ("response" in authResult) return authResult.response;
  const user = authResult.user;

  const { id: contentItemId } = await params;

  try {
    const body = await req.json();
    const { reason, comment } = body;
    const overrideReason = reason || comment;

    if (!overrideReason || typeof overrideReason !== "string" || !overrideReason.trim()) {
      return NextResponse.json(
        { error: "Admin override requires a non-empty reason" },
        { status: 400 }
      );
    }

    const result = await executeStateTransition(
      {
        contentItemId,
        action: "admin_override",
        actorUserId: user.id,
        actorRole: user.role,
        comment: overrideReason.trim(),
      },
      prisma
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
