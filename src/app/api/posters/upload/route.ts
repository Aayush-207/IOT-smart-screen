import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const title = (formData.get('title') as string | null)?.trim();
    const screenIdsRaw = formData.getAll('screenIds');

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No image file provided.' },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Poster title is required.' },
        { status: 400 }
      );
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds maximum allowed limit of 10 MB.' },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported image format (${file.type}). Allowed formats: PNG, JPEG, WebP.`,
        },
        { status: 400 }
      );
    }

    // Generate safe unique filename
    const ext = path.extname(file.name) || (file.type === 'image/png' ? '.png' : file.type === 'image/webp' ? '.webp' : '.jpg');
    const safeUniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;

    let publicPath = '';
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_UPLOAD_PRESET) {
      try {
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
        const cloudinaryFormData = new FormData();
        const blob = new Blob([buffer], { type: file.type });
        cloudinaryFormData.append('file', blob, file.name);
        cloudinaryFormData.append('upload_preset', uploadPreset);

        const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: cloudinaryFormData,
        });

        if (cloudRes.ok) {
          const cloudData = await cloudRes.json();
          publicPath = cloudData.secure_url;
        } else {
          throw new Error('Cloudinary API upload error');
        }
      } catch (cloudErr) {
        console.warn('Cloudinary upload failed, using local/base64 fallback:', cloudErr);
        const base64 = buffer.toString('base64');
        publicPath = `data:${file.type};base64,${base64}`;
      }
    } else {
      try {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const filePath = path.join(uploadsDir, safeUniqueName);
        await fs.promises.writeFile(filePath, buffer);
        publicPath = `/uploads/${safeUniqueName}`;
      } catch (fsErr) {
        console.warn('Local filesystem write unallowed, using base64 data URL:', fsErr);
        const base64 = buffer.toString('base64');
        publicPath = `data:${file.type};base64,${base64}`;
      }
    }

    // Create poster record in database
    const poster = await prisma.poster.create({
      data: {
        title,
        imagePath: publicPath,
        originalFileName: file.name,
        mimeType: file.type,
      },
    });

    // Handle screen assignments if provided
    let screenIds: string[] = [];
    screenIdsRaw.forEach((item) => {
      if (typeof item === 'string') {
        try {
          const parsed = JSON.parse(item);
          if (Array.isArray(parsed)) screenIds.push(...parsed);
          else screenIds.push(item);
        } catch {
          screenIds.push(item);
        }
      }
    });

    // Deduplicate screen IDs
    const uniqueScreenIds = Array.from(new Set(screenIds)).filter(Boolean);

    if (uniqueScreenIds.length > 0) {
      for (const screenId of uniqueScreenIds) {
        // Ensure target screen exists in database
        const screenExists = await prisma.screen.findUnique({ where: { id: screenId } });
        if (!screenExists) continue;

        // Get maximum current display order for this screen
        const maxOrder = await prisma.screenAssignment.aggregate({
          where: { screenId },
          _max: { displayOrder: true },
        });
        const nextOrder = (maxOrder._max.displayOrder ?? -1) + 1;

        await prisma.screenAssignment.upsert({
          where: {
            screenId_posterId: {
              screenId,
              posterId: poster.id,
            },
          },
          update: {},
          create: {
            screenId,
            posterId: poster.id,
            displayOrder: nextOrder,
          },
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Poster uploaded and published successfully!',
        poster,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process image upload' },
      { status: 500 }
    );
  }
}
