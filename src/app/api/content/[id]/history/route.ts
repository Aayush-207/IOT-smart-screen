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

  const { id: contentItemId } = await params;

  try {
    const item = await prisma.contentItem.findUnique({
      where: { id: contentItemId },
      include: {
        approvalSteps: {
          orderBy: { createdAt: "desc" },
        },
        versions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "ContentItem not found" }, { status: 404 });
    }

    return NextResponse.json({
      contentItemId: item.id,
      currentStatus: item.status,
      currentMediaUrl: item.mediaUrl,
      history: item.approvalSteps,
      versions: item.versions,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
