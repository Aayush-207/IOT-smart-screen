import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json().catch(() => ({}));

    const { playlistVersion: clientPlaylistVersion = 0, kioskVersion, freeStorageMb = 2048 } = body;

    const screen = await prisma.screen.findUnique({
      where: { slug },
    });

    if (!screen) {
      return NextResponse.json(
        { success: false, error: `Device not found: ${slug}` },
        { status: 404 }
      );
    }

    const now = new Date();

    // Update screen telemetry heartbeat and storage info
    await prisma.screen.update({
      where: { id: screen.id },
      data: {
        lastSeenAt: now,
        lastSyncAt: now,
        freeStorageMb: typeof freeStorageMb === 'number' ? freeStorageMb : screen.freeStorageMb,
      },
    });

    // Step 11: Playlist Generation
    // Select posters where:
    // 1. status = 'APPROVED' (or assigned for active display)
    // 2. activeFrom <= now AND activeUntil >= now
    // 3. screen assignment matches screen
    const assignments = await prisma.screenAssignment.findMany({
      where: {
        screenId: screen.id,
      },
      include: {
        poster: true,
      },
      orderBy: {
        displayOrder: 'asc',
      },
    });

    // Filter by active schedule boundaries & status
    const activeItems = assignments
      .map((a) => a.poster)
      .filter((poster) => {
        // Allow APPROVED posters (or legacy assigned posters in POC mode)
        const isApprovedOrActive = poster.status === 'APPROVED' || poster.isPublic;
        if (!isApprovedOrActive) return false;

        if (poster.activeFrom && new Date(poster.activeFrom).getTime() > now.getTime()) {
          return false;
        }
        if (poster.activeUntil && new Date(poster.activeUntil).getTime() < now.getTime()) {
          return false;
        }
        return true;
      });

    const manifestItems = activeItems.map((poster) => ({
      posterId: poster.id,
      title: poster.title,
      url: poster.isPublic ? `/media/${poster.checksum}.webp` : poster.imagePath,
      sha256: poster.checksum,
      durationSeconds: 15,
      activeFrom: poster.activeFrom ? poster.activeFrom.toISOString() : null,
      activeUntil: poster.activeUntil ? poster.activeUntil.toISOString() : null,
    }));

    const playlistChanged = clientPlaylistVersion !== screen.playlistVersion;

    // Step 13: Jitter recommendation calculation (e.g. 50s + random 0-20s)
    const nextSyncIntervalSeconds = Math.floor(50 + Math.random() * 20);

    return NextResponse.json({
      success: true,
      serverTime: now.toISOString(),
      screenId: screen.slug,
      playlistVersion: screen.playlistVersion,
      playlistChanged,
      nextSyncIntervalSeconds,
      manifest: {
        screenId: screen.slug,
        version: screen.playlistVersion,
        generatedAt: now.toISOString(),
        items: manifestItems,
      },
      commands: [],
    });
  } catch (error: any) {
    console.error('Screen sync error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during sync' },
      { status: 500 }
    );
  }
}
