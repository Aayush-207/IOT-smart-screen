import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'node:fs';
import path from 'node:path';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const checksum = filename.replace(/\.(webp|jpg|jpeg|png)$/i, '');

    // 1. Try public/media filesystem folder
    const mediaPath = path.join(process.cwd(), 'public', 'media', filename);
    if (fs.existsSync(mediaPath)) {
      const fileBuffer = await fs.promises.readFile(mediaPath);
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'image/webp',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // 2. Try public/uploads filesystem folder
    const uploadsPath = path.join(process.cwd(), 'public', 'uploads', filename);
    if (fs.existsSync(uploadsPath)) {
      const fileBuffer = await fs.promises.readFile(uploadsPath);
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // 3. Database fallback lookup by checksum or imagePath
    const poster = await prisma.poster.findFirst({
      where: {
        OR: [
          { checksum: checksum },
          { imagePath: { contains: filename } },
        ],
      },
    });

    if (poster && poster.imagePath) {
      if (poster.imagePath.startsWith('data:image')) {
        const base64Data = poster.imagePath.split(',')[1];
        if (base64Data) {
          const buffer = Buffer.from(base64Data, 'base64');
          return new NextResponse(buffer, {
            headers: {
              'Content-Type': poster.mimeType || 'image/webp',
              'Cache-Control': 'public, max-age=31536000, immutable',
            },
          });
        }
      }

      // Check relative path
      const relativePath = path.join(process.cwd(), 'public', poster.imagePath);
      if (fs.existsSync(relativePath)) {
        const fileBuffer = await fs.promises.readFile(relativePath);
        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': poster.mimeType || 'image/webp',
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      }
    }

    // 4. Fallback placeholder SVG
    const svgPlaceholder = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <rect width="800" height="600" fill="#0f172a"/>
      <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" fill="#38bdf8" font-family="sans-serif" font-size="28" font-weight="bold">CampusCast Digital Signage</text>
      <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="18">Media Node ID: ${checksum.substring(0, 10)}</text>
    </svg>`;

    return new NextResponse(svgPlaceholder, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Media route error:', error);
    return new NextResponse('Media Not Found', { status: 404 });
  }
}
