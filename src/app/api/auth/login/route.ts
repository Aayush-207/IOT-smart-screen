import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email, userId } = await req.json();

    let user = null;
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
    } else if (email) {
      user = await prisma.user.findFirst({
        where: { email: { equals: email.trim().toLowerCase() } },
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: "User not found. Please check your credentials or sign up." },
        { status: 404 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set("campuscast_user_id", user.id, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({
      message: `Successfully logged in as ${user.name}`,
      user,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
