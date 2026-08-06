import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { screenId, command, params, validityMinutes = 60 } = await request.json();

    if (!screenId || !command) {
      return NextResponse.json(
        { success: false, error: 'screenId and command are required' },
        { status: 400 }
      );
    }

    const screen = await prisma.screen.findFirst({
      where: { OR: [{ id: screenId }, { slug: screenId }] },
    });

    if (!screen) {
      return NextResponse.json(
        { success: false, error: 'Target screen node not found' },
        { status: 404 }
      );
    }

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + validityMinutes);

    const deviceCommand = await prisma.deviceCommand.create({
      data: {
        screenId: screen.id,
        command,
        params: params ? JSON.stringify(params) : null,
        status: 'QUEUED',
        expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Remote command "${command}" queued for ${screen.name}.`,
      command: deviceCommand,
    });
  } catch (error: any) {
    console.error('Queue command error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to queue remote command' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const screenId = searchParams.get('screenId');

    const whereClause = screenId
      ? { screen: { OR: [{ id: screenId }, { slug: screenId }] } }
      : {};

    const commands = await prisma.deviceCommand.findMany({
      where: whereClause,
      include: {
        screen: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ success: true, commands });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch commands' }, { status: 500 });
  }
}
