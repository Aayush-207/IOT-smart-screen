import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await request.formData();

    const title = formData.get('title') as string;
    const actorId = (formData.get('actorId') as string) || 'usr_101';
    const posterFile = formData.get('poster') as File | null;

    const event = await prisma.event.findUnique({
      where: { id },
      include: { posters: true },
    });

    if (!event) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
    }

    const currentApprovedPoster = event.posters.find((p) => p.status === 'APPROVED');

    let imagePath = currentApprovedPoster?.imagePath || '/uploads/default.png';
    let mimeType = currentApprovedPoster?.mimeType || 'image/png';
    let originalFileName = currentApprovedPoster?.originalFileName || 'updated_poster.png';
    let checksum = currentApprovedPoster?.checksum || 'v2_' + Date.now().toString(16);

    if (posterFile) {
      const buffer = Buffer.from(await posterFile.arrayBuffer());
      const crypto = await import('crypto');
      checksum = crypto.createHash('sha256').update(buffer).digest('hex').substring(0, 16);
      originalFileName = posterFile.name;
      mimeType = posterFile.type;
      imagePath = `data:${mimeType};base64,${buffer.toString('base64')}`;
    }

    // Create new poster draft version without replacing active approved poster
    const newPosterVersion = await prisma.poster.create({
      data: {
        eventId: event.id,
        title: title || `${event.name} (v2 Draft)`,
        imagePath,
        originalFileName,
        mimeType,
        checksum,
        status: 'DRAFT',
        activeFrom: currentApprovedPoster?.activeFrom,
        activeUntil: currentApprovedPoster?.activeUntil,
        isPublic: false,
      },
    });

    await createAuditLog({
      actorId,
      action: 'POSTER_NEW_VERSION_CREATED',
      resourceId: newPosterVersion.id,
      previousState: currentApprovedPoster ? `Active (${currentApprovedPoster.id})` : null,
      newState: 'DRAFT_V2',
    });

    return NextResponse.json({
      success: true,
      message: 'New poster draft version created. Existing approved poster remains active until final approval.',
      newPosterVersion,
    });
  } catch (error: any) {
    console.error('Create poster version error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create new poster version' },
      { status: 500 }
    );
  }
}
