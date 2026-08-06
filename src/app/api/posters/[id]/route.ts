import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'node:fs';
import path from 'node:path';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const poster = await prisma.poster.findUnique({
      where: { id },
    });

    if (!poster) {
      return NextResponse.json(
        { success: false, error: 'Poster not found' },
        { status: 404 }
      );
    }

    // Attempt to remove physical file
    if (poster.imagePath.startsWith('/uploads/')) {
      const fileName = path.basename(poster.imagePath);
      const filePath = path.join(process.cwd(), 'public', 'uploads', fileName);
      if (fs.existsSync(filePath)) {
        try {
          await fs.promises.unlink(filePath);
        } catch (e) {
          console.warn('Failed to delete file from disk:', e);
        }
      }
    }

    // Delete poster record (assignments deleted automatically via Cascade)
    await prisma.poster.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Poster deleted successfully.',
    });
  } catch (error: any) {
    console.error('Delete poster error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete poster' },
      { status: 500 }
    );
  }
}
