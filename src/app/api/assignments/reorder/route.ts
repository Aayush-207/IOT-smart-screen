import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request) {
  try {
    const { screenId, orderedPosterIds } = await request.json();

    if (!screenId || !Array.isArray(orderedPosterIds)) {
      return NextResponse.json(
        { success: false, error: 'screenId and orderedPosterIds array are required.' },
        { status: 400 }
      );
    }

    const updates = orderedPosterIds.map((posterId: string, index: number) =>
      prisma.screenAssignment.updateMany({
        where: {
          screenId,
          posterId,
        },
        data: {
          displayOrder: index,
        },
      })
    );

    await prisma.$transaction(updates);

    return NextResponse.json({
      success: true,
      message: 'Playlist order updated successfully.',
    });
  } catch (error: any) {
    console.error('Reorder error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reorder playlist.' },
      { status: 500 }
    );
  }
}
