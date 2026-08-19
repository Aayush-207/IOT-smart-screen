import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: deviceId } = await params;
  const body = await req.json().catch(() => ({}));

  try {
    const updatedDevice = await prisma.device.update({
      where: { id: deviceId },
      data: {
        status: body.status || "online",
        lastHeartbeat: new Date(),
        firmwareVersion: body.firmwareVersion || undefined,
      },
    });

    return NextResponse.json({ success: true, device: updatedDevice });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
