import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const screen = await prisma.screen.findUnique({
      where: { slug },
      include: {
        assignments: {
          orderBy: { displayOrder: 'asc' },
          include: { poster: true },
        },
      },
    });

    if (!screen) {
      return NextResponse.json(
        { success: false, error: `Screen '${slug}' not found` },
        { status: 404 }
      );
    }

    const playlist = screen.assignments.map((assignment) => ({
      id: assignment.poster.id,
      title: assignment.poster.title,
      imagePath: assignment.poster.imagePath,
      displayOrder: assignment.displayOrder,
    }));

    return NextResponse.json({
      success: true,
      screen: {
        id: screen.id,
        slug: screen.slug,
        name: screen.name,
        location: screen.location,
        lastSeenAt: screen.lastSeenAt,
      },
      playlist,
    });
  } catch (error: any) {
    console.error('Playlist fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error fetching playlist' },
      { status: 500 }
    );
  }
}
