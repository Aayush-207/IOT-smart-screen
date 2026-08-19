import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRouteAuth } from "@/lib/rbac";
import { Role } from "@/lib/enums";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await checkRouteAuth([Role.admin]);
  if ("response" in authResult) return authResult.response;

  const { id: clubId } = await params;

  try {
    const { hodUserId } = await req.json();

    const updatedClub = await prisma.club.update({
      where: { id: clubId },
      data: { hodUserId: hodUserId || null },
    });

    return NextResponse.json({
      message: `Club ${updatedClub.name} updated. ${
        updatedClub.hodUserId ? "HOD assigned." : "HOD removed (skips Stage 1 HOD approval)."
      }`,
      club: updatedClub,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
