import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { actorId = 'usr_100' } = await request.json().catch(() => ({}));

    const event = await prisma.event.findUnique({
      where: { id },
      include: { posters: true },
    });

    if (!event) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
    }

    const now = new Date();

    // Execute cancellation in an atomic transaction
    await prisma.$transaction(async (tx) => {
      // Update all posters for this event to CANCELLED and expire schedule
      for (const poster of event.posters) {
        const prevStatus = poster.status;
        await tx.poster.update({
          where: { id: poster.id },
          data: {
            status: 'CANCELLED',
            activeUntil: now,
          },
        });

        // Find assigned screens and increment playlistVersion to force manifest update
        const assignments = await tx.screenAssignment.findMany({
          where: { posterId: poster.id },
        });

        if (assignments.length > 0) {
          await tx.screen.updateMany({
            where: { id: { in: assignments.map((a) => a.screenId) } },
            data: { playlistVersion: { increment: 1 } },
          });
        }

        // Record audit entry
        await createAuditLog({
          actorId,
          action: 'EVENT_CANCELLED',
          resourceId: poster.id,
          previousState: prevStatus,
          newState: 'CANCELLED',
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: `Event "${event.name}" and associated posters successfully cancelled.`,
    });
  } catch (error: any) {
    console.error('Event cancellation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel event' },
      { status: 500 }
    );
  }
}
