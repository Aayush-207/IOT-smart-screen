import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, email } = body;

    const conditions = [];
    if (userId) conditions.push({ id: userId });
    if (email) conditions.push({ email: email });

    if (conditions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'SSO Identity verification failed: User identifier required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { OR: conditions },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'SSO Identity verification failed: User not found in database' },
        { status: 404 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set('campuscast_session', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({
      success: true,
      message: 'Verified campus identity successfully.',
      user: {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        clubId: user.clubId,
      },
    });
  } catch (error: any) {
    console.error('SSO Login error:', error);
    return NextResponse.json(
      { success: false, error: 'SSO authentication error' },
      { status: 500 }
    );
  }
}
