import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json().catch(() => ({}));

    const {
      playlistVersion: clientPlaylistVersion = 0,
      kioskVersion,
      freeStorageMb = 2048,
      playbackEvents = [],
      commandResults = [],
    } = body;

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

    // Step 17: Screen-health updates & status calculation
    await prisma.screen.update({
      where: { id: screen.id },
      data: {
        lastSeenAt: now,
        lastSyncAt: now,
        freeStorageMb: typeof freeStorageMb === 'number' ? freeStorageMb : screen.freeStorageMb,
      },
    });

    // Step 16: Playback Telemetry Ingestion (Deduplicated using eventId)
    if (Array.isArray(playbackEvents) && playbackEvents.length > 0) {
      for (const event of playbackEvents) {
        if (!event.eventId || !event.posterId) continue;
        try {
          const startedAt = event.startedAt ? new Date(event.startedAt) : now;
          const completedAt = event.completedAt ? new Date(event.completedAt) : now;
          await prisma.playbackLog.upsert({
            where: { eventId: event.eventId },
            create: {
              eventId: event.eventId,
              screenId: screen.id,
              posterId: event.posterId,
              playlistVersion: event.playlistVersion || screen.playlistVersion,
              startedAt,
              completedAt,
              status: event.status || 'SUCCESS',
              failureReason: event.failureReason || null,
            },
            update: {}, // ignore duplicate report
          });
        } catch (err) {
          console.warn('Error ingesting playback event:', err);
        }
      }
    }

    // Step 18: Acknowledge Completed Remote Commands
    if (Array.isArray(commandResults) && commandResults.length > 0) {
      for (const res of commandResults) {
        if (!res.commandId) continue;
        try {
          await prisma.deviceCommand.update({
            where: { id: res.commandId },
            data: {
              status: res.status || 'COMPLETED',
              completedAt: now,
              errorMessage: res.errorMessage || null,
            },
          });
        } catch (err) {
          console.warn('Error updating command result:', err);
        }
      }
    }

    // Step 18: Deliver Pending Non-Expired Remote Commands
    const pendingCommands = await prisma.deviceCommand.findMany({
      where: {
        screenId: screen.id,
        status: 'QUEUED',
        expiresAt: { gt: now },
      },
    });

    if (pendingCommands.length > 0) {
      await prisma.deviceCommand.updateMany({
        where: {
          id: { in: pendingCommands.map((c) => c.id) },
        },
        data: {
          status: 'DELIVERED',
          deliveredAt: now,
        },
      });
    }

    // Step 11: Playlist Generation
    const assignments = await prisma.screenAssignment.findMany({
      where: { screenId: screen.id },
      include: { poster: true },
      orderBy: { displayOrder: 'asc' },
    });

    const activeItems = assignments
      .map((a) => a.poster)
      .filter((poster) => {
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
      commands: pendingCommands.map((c) => ({
        commandId: c.id,
        command: c.command,
        params: c.params ? JSON.parse(c.params) : null,
        expiresAt: c.expiresAt.toISOString(),
      })),
    });
  } catch (error: any) {
    console.error('Screen sync error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during sync' },
      { status: 500 }
    );
  }
}
