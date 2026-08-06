import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { posterId, screenIds } = body;

    if (!posterId || !Array.isArray(screenIds) || screenIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'posterId and at least one screenId are required.' },
        { status: 400 }
      );
    }

    const poster = await prisma.poster.findUnique({
      where: { id: posterId },
    });

    if (!poster) {
      return NextResponse.json(
        { success: false, error: 'Poster not found.' },
        { status: 404 }
      );
    }

    const uniqueScreenIds = Array.from(new Set(screenIds)).filter(Boolean) as string[];

    const results = [];
    for (const screenId of uniqueScreenIds) {
      // Check if screen exists
      const screenExists = await prisma.screen.findUnique({ where: { id: screenId } });
      if (!screenExists) continue;

      const maxOrder = await prisma.screenAssignment.aggregate({
        where: { screenId },
        _max: { displayOrder: true },
      });
      const nextOrder = (maxOrder._max.displayOrder ?? -1) + 1;

      // Idempotent upsert using unique compound index screenId_posterId
      const assignment = await prisma.screenAssignment.upsert({
        where: {
          screenId_posterId: {
            screenId,
            posterId,
          },
        },
        update: {}, // keep existing order if already assigned
        create: {
          screenId,
          posterId,
          displayOrder: nextOrder,
        },
      });
      results.push(assignment);
    }

    if (uniqueScreenIds.length > 0) {
      await prisma.screen.updateMany({
        where: { id: { in: uniqueScreenIds } },
        data: { playlistVersion: { increment: 1 } },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Assigned poster to ${results.length} screen(s).`,
      assignments: results,
    });
  } catch (error: any) {
    console.error('Assignment error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to assign poster to screen(s).' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const posterId = searchParams.get('posterId');
    const screenId = searchParams.get('screenId');
    const assignmentId = searchParams.get('assignmentId');

    if (assignmentId) {
      const assignment = await prisma.screenAssignment.findUnique({ where: { id: assignmentId } });
      if (assignment) {
        await prisma.screenAssignment.delete({ where: { id: assignmentId } });
        await prisma.screen.update({
          where: { id: assignment.screenId },
          data: { playlistVersion: { increment: 1 } },
        });
      }
    } else if (screenId && posterId) {
      await prisma.screenAssignment.deleteMany({
        where: { screenId, posterId },
      });
      await prisma.screen.update({
        where: { id: screenId },
        data: { playlistVersion: { increment: 1 } },
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Provide assignmentId OR screenId and posterId' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Poster unassigned from screen successfully.',
    });
  } catch (error: any) {
    console.error('Unassign error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to unassign poster.' },
      { status: 500 }
    );
  }
}
