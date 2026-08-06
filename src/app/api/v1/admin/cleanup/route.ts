import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

export async function POST() {
  try {
    const now = new Date();

    // Find all expired posters (activeUntil < current_time)
    const expiredPosters = await prisma.poster.findMany({
      where: {
        activeUntil: { lt: now },
        status: 'APPROVED',
      },
      include: { assignments: true },
    });

    let removedAssignmentsCount = 0;

    await prisma.$transaction(async (tx) => {
      for (const poster of expiredPosters) {
        // Mark status as EXPIRED
        await tx.poster.update({
          where: { id: poster.id },
          data: { status: 'EXPIRED' },
        });

        // Remove active screen assignments for expired poster
        if (poster.assignments.length > 0) {
          const screenIds = poster.assignments.map((a) => a.screenId);
          await tx.screenAssignment.deleteMany({
            where: { posterId: poster.id },
          });

          // Increment playlist versions on affected screens to update kiosk manifests
          await tx.screen.updateMany({
            where: { id: { in: screenIds } },
            data: { playlistVersion: { increment: 1 } },
          });

          removedAssignmentsCount += poster.assignments.length;
        }
      }

      // Record Audit Log Entry
      await createAuditLog({
        actorId: 'usr_background_worker',
        action: 'CLEANUP_EXPIRED_MEDIA',
        resourceId: `expired_posters_${expiredPosters.length}`,
        newState: `Cleaned ${expiredPosters.length} expired posters and ${removedAssignmentsCount} assignments`,
      });
    });

    return NextResponse.json({
      success: true,
      message: `Background media cleanup worker executed successfully. Processed ${expiredPosters.length} expired posters.`,
      expiredCount: expiredPosters.length,
      removedAssignmentsCount,
    });
  } catch (error: any) {
    console.error('Cleanup worker error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to run background media cleanup' },
      { status: 500 }
    );
  }
}
