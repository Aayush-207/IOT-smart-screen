import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('campuscast_session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, authenticated: false, error: 'Unauthorized: No active session' },
        { status: 401 }
      );
    }

    // Lookup user by session token or ID
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: sessionToken },
          { email: sessionToken },
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, authenticated: false, error: 'Session expired or invalid user' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        clubId: user.clubId,
      },
    });
  } catch (error: any) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
