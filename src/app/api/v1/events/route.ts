import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const clubId = formData.get('clubId') as string;
    const venue = formData.get('venue') as string;
    const eventDateStr = formData.get('eventDate') as string;
    const startTime = formData.get('startTime') as string;
    const endTime = formData.get('endTime') as string;
    const contactInfo = formData.get('contactInfo') as string;
    const registrationUrl = formData.get('registrationUrl') as string || null;
    const targetScreensRaw = formData.getAll('targetScreens');
    const file = formData.get('poster') as File | null;

    // Backend validation of required fields
    if (!name || !description || !clubId || !venue || !eventDateStr || !startTime || !endTime || !contactInfo) {
      return NextResponse.json(
        { success: false, error: 'Validation failed: Missing required event details' },
        { status: 400 }
      );
    }

    const eventDate = new Date(eventDateStr);
    if (isNaN(eventDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Validation failed: Invalid event date format' },
        { status: 400 }
      );
    }

    let targetScreens: string[] = [];
    targetScreensRaw.forEach((item) => {
      if (typeof item === 'string') {
        try {
          const parsed = JSON.parse(item);
          if (Array.isArray(parsed)) targetScreens.push(...parsed);
          else targetScreens.push(item);
        } catch {
          targetScreens.push(item);
        }
      }
    });

    // Step 9: Automatic 21-Day Scheduling calculation
    // activeFrom = Event date - 21 calendar days (00:00:00)
    // activeUntil = Event date (23:59:59)
    const activeFrom = new Date(eventDate);
    activeFrom.setDate(activeFrom.getDate() - 21);
    activeFrom.setHours(0, 0, 0, 0);

    const activeUntil = new Date(eventDate);
    activeUntil.setHours(23, 59, 59, 999);

    // Save initial poster image file & compute SHA-256 checksum
    let imagePath = '/placeholder.jpg';
    let checksum = 'af1d9038c29b71e80957';
    let originalFileName = 'poster.jpg';
    let mimeType = 'image/jpeg';

    if (file && file.size > 0) {
      originalFileName = file.name;
      mimeType = file.type;

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Step 3: Compute SHA-256 checksum
      checksum = crypto.createHash('sha256').update(buffer).digest('hex').substring(0, 20);

      const ext = path.extname(file.name) || '.jpg';
      const safeUniqueName = `${checksum}${ext}`;

      try {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const filePath = path.join(uploadsDir, safeUniqueName);
        await fs.promises.writeFile(filePath, buffer);
        imagePath = `/uploads/${safeUniqueName}`;
      } catch (fsErr) {
        // Fallback for read-only serverless environment
        const base64 = buffer.toString('base64');
        imagePath = `data:${file.type};base64,${base64}`;
      }
    }

    // Step 8: Transactional Creation of Event, Poster, Screen Assignments & Audit Trail
    const result = await prisma.$transaction(async (tx) => {
      const event = await tx.event.create({
        data: {
          name,
          description,
          clubId,
          venue,
          eventDate,
          startTime,
          endTime,
          contactInfo,
          registrationUrl,
          targetScreens: JSON.stringify(targetScreens),
        },
      });

      const poster = await tx.poster.create({
        data: {
          eventId: event.id,
          title: `${name} Poster`,
          imagePath,
          originalFileName,
          mimeType,
          checksum,
          status: 'DRAFT',
          activeFrom,
          activeUntil,
          isPublic: false,
        },
      });

      // Assign to target screens
      if (targetScreens.length > 0) {
        const screens = await tx.screen.findMany({
          where: { slug: { in: targetScreens } },
        });

        for (const screen of screens) {
          await tx.screenAssignment.upsert({
            where: {
              screenId_posterId: {
                screenId: screen.id,
                posterId: poster.id,
              },
            },
            create: {
              screenId: screen.id,
              posterId: poster.id,
              displayOrder: 1,
            },
            update: {},
          });
        }
      }

      // Initial Audit Entry
      const audit = await tx.approval.create({
        data: {
          posterId: poster.id,
          stage: 'DESIGN_LEAD',
          reviewerId: 'usr_101',
          reviewerName: 'Gaurav (Design Lead)',
          action: 'CREATE_EVENT',
          comment: 'Event created and poster saved as DRAFT.',
        },
      });

      return { event, poster, audit };
    });

    return NextResponse.json({
      success: true,
      message: 'Event created successfully with DRAFT poster status.',
      event: result.event,
      poster: result.poster,
    });
  } catch (error: any) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while creating event' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      include: {
        posters: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, events });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch events' }, { status: 500 });
  }
}
