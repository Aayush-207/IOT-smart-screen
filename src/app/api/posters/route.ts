import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const posters = await prisma.poster.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        assignments: {
          include: {
            screen: {
              select: { id: true, slug: true, name: true },
            },
          },
        },
      },
    });

    const formattedPosters = posters.map((poster) => ({
      id: poster.id,
      title: poster.title,
      imagePath: poster.imagePath,
      originalFileName: poster.originalFileName,
      mimeType: poster.mimeType,
      createdAt: poster.createdAt,
      assignedScreens: poster.assignments.map((a) => a.screen),
    }));

    return NextResponse.json({ success: true, posters: formattedPosters });
  } catch (error: any) {
    console.error('Fetch posters error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve posters' },
      { status: 500 }
    );
  }
}
