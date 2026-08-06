import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ posterId: string }> }
) {
  try {
    const { posterId } = await params;

    // Check user session
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('campuscast_session')?.value || 'usr_101'; // default demo fallback

    const user = await prisma.user.findFirst({
      where: { OR: [{ id: sessionToken }, { email: sessionToken }] },
    });

    if (!user || (user.role !== 'DESIGN_LEAD' && user.role !== 'SYSTEM_ADMIN')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only authorized Design Leads can submit posters' },
        { status: 403 }
      );
    }

    // Step 8: Transactional Lock & Transition (DRAFT -> PENDING_PRESIDENT)
    const updatedPoster = await prisma.$transaction(async (tx) => {
      const poster = await tx.poster.findUnique({
        where: { id: posterId },
        include: { event: true },
      });

      if (!poster) {
        throw new Error('Poster not found');
      }

      if (poster.status !== 'DRAFT' && poster.status !== 'CHANGES_REQUESTED') {
        throw new Error(`Poster status must be DRAFT or CHANGES_REQUESTED to submit. Current: ${poster.status}`);
      }

      // Check if event is over
      if (poster.event && new Date(poster.event.eventDate).getTime() < Date.now()) {
        throw new Error('Cannot submit poster for an event that has already passed.');
      }

      const updated = await tx.poster.update({
        where: { id: posterId },
        data: {
          status: 'PENDING_PRESIDENT',
        },
      });

      // Audit Record
      await tx.approval.create({
        data: {
          posterId: poster.id,
          stage: 'DESIGN_LEAD',
          reviewerId: user.id,
          reviewerName: user.name,
          action: 'SUBMIT_FOR_APPROVAL',
          comment: 'Submitted poster for President Review.',
        },
      });

      return updated;
    });

    return NextResponse.json({
      success: true,
      message: 'Poster submitted successfully for President approval.',
      poster: updatedPoster,
    });
  } catch (error: any) {
    console.error('Submit poster error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit poster' },
      { status: 400 }
    );
  }
}
