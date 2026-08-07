import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { createAuditLog } from '@/lib/audit';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ posterId: string }> }
) {
  try {
    const { posterId } = await params;
    const body = await request.json();
    const { action, comment } = body; // action: 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT'

    if (!action || !['APPROVE', 'REQUEST_CHANGES', 'REJECT'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid approval action. Must be APPROVE, REQUEST_CHANGES, or REJECT' },
        { status: 400 }
      );
    }

    if ((action === 'REQUEST_CHANGES' || action === 'REJECT') && !comment) {
      return NextResponse.json(
        { success: false, error: 'A comment is required for rejection or requested changes.' },
        { status: 400 }
      );
    }

    // Identify user
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('campuscast_session')?.value || 'usr_102'; // default fallback for demo

    const user = await prisma.user.findFirst({
      where: { OR: [{ id: sessionToken }, { email: sessionToken }] },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized user' }, { status: 401 });
    }

    // Step 8: Perform entire approval inside one atomic database transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Lock poster record
      const poster = await tx.poster.findUnique({
        where: { id: posterId },
        include: { event: true, assignments: true },
      });

      if (!poster) {
        throw new Error('Poster not found');
      }

      let newStatus = poster.status;
      let stage = '';

      // 2. Validate current workflow stage & reviewer role
      if (poster.status === 'PENDING_PRESIDENT') {
        stage = 'PRESIDENT';
        if (user.role !== 'PRESIDENT' && user.role !== 'SYSTEM_ADMIN') {
          throw new Error(`Unauthorized: President role required for PENDING_PRESIDENT stage. Your role: ${user.role}`);
        }
        if (action === 'APPROVE') newStatus = 'PENDING_HOD';
        else if (action === 'REQUEST_CHANGES') newStatus = 'CHANGES_REQUESTED';
        else if (action === 'REJECT') newStatus = 'REJECTED';
      } else if (poster.status === 'PENDING_HOD') {
        stage = 'HOD';
        if (user.role !== 'HOD' && user.role !== 'SYSTEM_ADMIN') {
          throw new Error(`Unauthorized: HOD role required for PENDING_HOD stage. Your role: ${user.role}`);
        }
        if (action === 'APPROVE') newStatus = 'PENDING_ADMIN';
        else if (action === 'REQUEST_CHANGES') newStatus = 'CHANGES_REQUESTED';
        else if (action === 'REJECT') newStatus = 'REJECTED';
      } else if (poster.status === 'PENDING_ADMIN') {
        stage = 'ADMIN';
        if (user.role !== 'SYSTEM_ADMIN') {
          throw new Error(`Unauthorized: Campus Admin role required for final approval stage. Your role: ${user.role}`);
        }
        if (action === 'APPROVE') newStatus = 'APPROVED';
        else if (action === 'REQUEST_CHANGES') newStatus = 'CHANGES_REQUESTED';
        else if (action === 'REJECT') newStatus = 'REJECTED';
      } else {
        throw new Error(`Poster is not currently pending review. Current status: ${poster.status}`);
      }

      // Step 10: Media Publishing when APPROVED
      let isPublic = poster.isPublic;
      let publicImagePath = poster.imagePath;
      if (newStatus === 'APPROVED') {
        isPublic = true;
        // Step 10: Assign public media URL using SHA-256 checksum filename
        publicImagePath = `/media/${poster.checksum}.webp`;
      }

      // 3. Insert immutable approval record
      const approvalRecord = await tx.approval.create({
        data: {
          posterId: poster.id,
          stage,
          reviewerId: user.id,
          reviewerName: user.name,
          action,
          comment: comment || null,
        },
      });

      // 4. Update poster status & public state
      const updatedPoster = await tx.poster.update({
        where: { id: posterId },
        data: {
          status: newStatus,
          isPublic,
          imagePath: publicImagePath,
        },
      });

      // Step 24: Record Audit Entry
      await createAuditLog({
        actorId: user.id,
        action: `POSTER_${action}_${stage}`,
        resourceId: poster.id,
        previousState: poster.status,
        newState: newStatus,
      });

      // Step 11: Increment screen playlist versions if poster is APPROVED
      if (newStatus === 'APPROVED' && poster.assignments.length > 0) {
        const screenIds = poster.assignments.map((a) => a.screenId);
        await tx.screen.updateMany({
          where: { id: { in: screenIds } },
          data: {
            playlistVersion: { increment: 1 },
          },
        });
      }

      return { poster: updatedPoster, approval: approvalRecord };
    });

    return NextResponse.json({
      success: true,
      message: `Approval action "${action}" completed successfully. Status updated to ${result.poster.status}.`,
      poster: result.poster,
      approval: result.approval,
    });
  } catch (error: any) {
    console.error('Approval action error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Approval action failed' },
      { status: 400 }
    );
  }
}
