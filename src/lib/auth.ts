import { Role } from "./enums";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  clubId?: string | null;
  departmentId?: string | null;
}

export interface Session {
  user: SessionUser;
}

/**
 * Gets active session from cookies or headers.
 * Supports active impersonation/dev user cookie "campuscast_user_id" for easy multi-role testing,
 * and falls back to default seed user.
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const userIdCookie = cookieStore.get("campuscast_user_id")?.value;

  if (userIdCookie) {
    const user = await prisma.user.findUnique({
      where: { id: userIdCookie },
    });

    if (user) {
      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as Role,
          clubId: user.clubId,
          departmentId: user.departmentId,
        },
      };
    }
  }

  // Fallback to default admin or first available user
  const defaultUser = await prisma.user.findFirst({
    where: { role: Role.admin },
  });

  if (defaultUser) {
    return {
      user: {
        id: defaultUser.id,
        name: defaultUser.name,
        email: defaultUser.email,
        role: defaultUser.role as Role,
        clubId: defaultUser.clubId,
        departmentId: defaultUser.departmentId,
      },
    };
  }

  return null;
}

export function assertRole(user: SessionUser, allowedRoles: Role[]) {
  if (!allowedRoles.includes(user.role)) {
    throw new Error(`Forbidden: Role '${user.role}' does not have permission.`);
  }
}
