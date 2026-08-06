import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isScreenOnline } from '@/lib/screen-status';

export async function GET() {
  try {
    const screens = await prisma.screen.findMany({
      orderBy: { slug: 'asc' },
      include: {
        assignments: {
          orderBy: { displayOrder: 'asc' },
          include: { poster: true },
        },
      },
    });

    const now = new Date();
    const formattedScreens = screens.map((screen) => {
      const isOnline = isScreenOnline(screen.lastSeenAt, now);
      return {
        id: screen.id,
        slug: screen.slug,
        name: screen.name,
        building: screen.building,
        floor: screen.floor,
        status: screen.status,
        playlistVersion: screen.playlistVersion,
        freeStorageMb: screen.freeStorageMb,
        lastSeenAt: screen.lastSeenAt,
        isOnline,
        posters: screen.assignments.map((a) => ({
          assignmentId: a.id,
          displayOrder: a.displayOrder,
          ...a.poster,
        })),
      };
    });

    return NextResponse.json({ success: true, screens: formattedScreens });
  } catch (error: any) {
    console.error('Failed to fetch screens:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve registered screens' },
      { status: 500 }
    );
  }
}
