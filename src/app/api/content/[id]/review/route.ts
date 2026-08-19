import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRouteAuth } from "@/lib/rbac";
import { executeStateTransition, TransitionAction } from "@/lib/state-machine";
import { Role, Status } from "@/lib/enums";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await checkRouteAuth([Role.club_hod, Role.admin]);
  if ("response" in authResult) return authResult.response;
  const user = authResult.user;

  const { id: contentItemId } = await params;

  try {
    const body = await req.json();
    const { decision, comment } = body; // decision: "approve" | "reject"

    if (decision !== "approve" && decision !== "reject") {
      return NextResponse.json(
        { error: "Invalid decision. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    const item = await prisma.contentItem.findUnique({
      where: { id: contentItemId },
      include: {
        event: {
          include: { club: true },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "ContentItem not found" }, { status: 404 });
    }

    // RBAC Check 1: Self-approval prevention
    if (item.submittedById === user.id) {
      return NextResponse.json(
        { error: "Forbidden: Users cannot approve or reject their own submission" },
        { status: 403 }
      );
    }

    // RBAC Check 2: Stage 2 Admin requirement
    if (item.status === Status.pending_admin_approval && user.role !== Role.admin) {
      return NextResponse.json(
        { error: "Forbidden: Admin approval requires admin role" },
        { status: 403 }
      );
    }

    // RBAC Check 3: Stage 1 HOD Department scope requirement
    if (item.status === Status.pending_hod_approval && user.role === Role.club_hod) {
      if (user.departmentId !== item.event.club.departmentId) {
        return NextResponse.json(
          { error: "Forbidden: HOD is not authorized for content in a different department" },
          { status: 403 }
        );
      }
    }

    let action: TransitionAction;
    if (item.status === Status.pending_hod_approval) {
      action = decision === "approve" ? "hod_approve" : "hod_reject";
    } else if (item.status === Status.pending_admin_approval) {
      action = decision === "approve" ? "admin_approve" : "admin_reject";
    } else {
      return NextResponse.json(
        { error: `Item is not pending approval (current status: ${item.status})` },
        { status: 400 }
      );
    }

    const result = await executeStateTransition(
      {
        contentItemId,
        action,
        actorUserId: user.id,
        actorRole: user.role,
        comment,
      },
      prisma
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
