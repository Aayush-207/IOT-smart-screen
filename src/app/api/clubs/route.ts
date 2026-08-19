import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRouteAuth } from "@/lib/rbac";
import { Role } from "@/lib/enums";

export const dynamic = "force-dynamic";

export async function GET() {
  const authResult = await checkRouteAuth([
    Role.club_president,
    Role.club_hod,
    Role.admin,
    Role.viewer,
  ]);
  if ("response" in authResult) return authResult.response;

  try {
    const clubs = await prisma.club.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(clubs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
