import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const screen = await prisma.screen.findUnique({
      where: { slug },
    });

    if (!screen) {
      return NextResponse.json(
        { success: false, error: `Screen '${slug}' not found` },
        { status: 404 }
      );
    }

    const updated = await prisma.screen.update({
      where: { slug },
      data: { lastSeenAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      slug: updated.slug,
      lastSeenAt: updated.lastSeenAt,
    });
  } catch (error: any) {
    console.error('Heartbeat update error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error processing heartbeat' },
      { status: 500 }
    );
  }
}
