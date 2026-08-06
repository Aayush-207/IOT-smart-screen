import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, location, building, floor, deviceSlug } = body;

    if (!name || !location) {
      return NextResponse.json(
        { success: false, error: 'Screen name and location are required' },
        { status: 400 }
      );
    }

    const slug = deviceSlug || `dev_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;
    
    // Generate secure device credential secret
    const rawDeviceSecret = `sec_${crypto.randomBytes(16).toString('hex')}`;
    const deviceSecretHash = crypto.createHash('sha256').update(rawDeviceSecret).digest('hex');

    const screen = await prisma.screen.create({
      data: {
        slug,
        name,
        location,
        building: building || 'Main Campus',
        floor: floor || '1st Floor',
        deviceSecretHash,
        status: 'ACTIVE',
        playlistVersion: 1,
        freeStorageMb: 4096,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Screen enrolled successfully.',
      device: {
        deviceId: screen.slug,
        name: screen.name,
        location: screen.location,
        building: screen.building,
        floor: screen.floor,
        status: screen.status,
        deviceSecret: rawDeviceSecret, // Credentials returned only ONCE during initial enrollment
      },
    });
  } catch (error: any) {
    console.error('Screen enrollment error:', error);
    return NextResponse.json(
      { success: false, error: 'Screen enrollment failed' },
      { status: 500 }
    );
  }
}
