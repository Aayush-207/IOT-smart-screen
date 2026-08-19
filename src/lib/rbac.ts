import { NextResponse } from "next/server";
import { Role } from "./enums";
import { getSession, SessionUser } from "./auth";

export interface AuthResult {
  authorized: boolean;
  status: number;
  error?: string;
  user?: SessionUser;
}

export function authorize(user: SessionUser | null, allowedRoles: Role[]): AuthResult {
  if (!user) {
    return { authorized: false, status: 401, error: "Unauthorized: Login required" };
  }
  if (!allowedRoles.includes(user.role)) {
    return {
      authorized: false,
      status: 403,
      error: `Forbidden: Role '${user.role}' does not have required permissions`,
    };
  }
  return { authorized: true, status: 200, user };
}

export async function checkRouteAuth(
  allowedRoles: Role[]
): Promise<{ user: SessionUser } | { response: NextResponse }> {
  const session = await getSession();
  const auth = authorize(session?.user || null, allowedRoles);

  if (!auth.authorized || !auth.user) {
    return {
      response: NextResponse.json(
        { error: auth.error || "Forbidden" },
        { status: auth.status || 403 }
      ),
    };
  }

  return { user: auth.user };
}
