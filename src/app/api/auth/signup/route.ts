import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { Role } from "@/lib/enums";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { name, email, role, clubId, departmentId } = await req.json();

    if (!name || !email || !role) {
      return NextResponse.json(
        { error: "Name, email, and role are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if email already exists
    const existing = await prisma.user.findFirst({
      where: { email: { equals: cleanEmail } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 400 }
      );
    }

    // Valid role check
    const validRoles = [Role.club_president, Role.club_hod, Role.admin, Role.viewer];
    if (!validRoles.includes(role as Role)) {
      return NextResponse.json({ error: "Invalid role selected." }, { status: 400 });
    }

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name,
        email: cleanEmail,
        role,
        clubId: clubId || null,
        departmentId: departmentId || null,
      },
    });

    const cookieStore = await cookies();
    cookieStore.set("campuscast_user_id", newUser.id, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json(
      { message: "Account created successfully!", user: newUser },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
