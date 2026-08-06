import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('campuscast_session')?.value || 'usr_102'; // default to President for demo if not logged in

    const user = await prisma.user.findFirst({
      where: { OR: [{ id: sessionToken }, { email: sessionToken }] },
    });

    let statusFilter: string[] = [];
    if (user?.role === 'PRESIDENT') {
      statusFilter = ['PENDING_PRESIDENT'];
    } else if (user?.role === 'HOD') {
      statusFilter = ['PENDING_HOD'];
    } else if (user?.role === 'SYSTEM_ADMIN') {
      statusFilter = ['PENDING_ADMIN'];
    } else {
      // Return all pending for global view
      statusFilter = ['PENDING_PRESIDENT', 'PENDING_HOD', 'PENDING_ADMIN'];
    }

    const pendingPosters = await prisma.poster.findMany({
      where: {
        status: { in: statusFilter },
      },
      include: {
        event: true,
        approvals: {
          orderBy: { createdAt: 'desc' },
        },
        assignments: {
          include: { screen: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      currentUser: user,
      inbox: pendingPosters,
    });
  } catch (error: any) {
    console.error('Fetch approval inbox error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch approval inbox' },
      { status: 500 }
    );
  }
}
