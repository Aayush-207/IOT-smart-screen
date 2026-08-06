import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const screenId = searchParams.get('screenId');

    const whereClause = screenId
      ? { screen: { OR: [{ id: screenId }, { slug: screenId }] } }
      : {};

    const logs = await prisma.playbackLog.findMany({
      where: whereClause,
      include: {
        screen: { select: { name: true, slug: true } },
        poster: { select: { title: true, checksum: true } },
      },
      orderBy: { completedAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch playback logs' },
      { status: 500 }
    );
  }
}
