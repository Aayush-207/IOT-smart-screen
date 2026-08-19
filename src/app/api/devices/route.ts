import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRouteAuth } from "@/lib/rbac";
import { Role } from "@/lib/enums";

export const dynamic = "force-dynamic";

export async function GET() {
  const authResult = await checkRouteAuth([Role.club_president, Role.club_hod, Role.admin, Role.viewer]);
  if ("response" in authResult) return authResult.response;
  try {
    const devices = await prisma.device.findMany({
      include: {
        schedules: {
          include: {
            contentItem: {
              include: { event: true },
            },
          },
        },
      },
      orderBy: { locationTag: "asc" },
    });
    return NextResponse.json(devices);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authResult = await checkRouteAuth([Role.admin]);
  if ("response" in authResult) return authResult.response;

  try {
    const { locationTag, zone, firmwareVersion } = await req.json();

    if (!locationTag || !zone) {
      return NextResponse.json({ error: "Missing locationTag or zone" }, { status: 400 });
    }

    const device = await prisma.device.create({
      data: {
        locationTag: locationTag.trim(),
        zone: zone.trim(),
        status: "online",
        lastHeartbeat: new Date(),
        firmwareVersion: firmwareVersion || "v1.0.4-esp32",
      },
    });

    return NextResponse.json(device, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
