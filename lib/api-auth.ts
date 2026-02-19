import { NextResponse } from "next/server";
import { getSession, SessionData } from "@/lib/session";

/**
 * API Authentication Helper
 * 
 * Centralized authentication verification for API routes.
 * Use this to protect API endpoints that require authentication.
 */

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export interface AuthResult {
  authenticated: true;
  user: AuthenticatedUser;
  session: SessionData;
}

export interface AuthError {
  authenticated: false;
  response: NextResponse;
}

export type AuthCheck = AuthResult | AuthError;

/**
 * Check if the request is authenticated
 * 
 * @returns AuthResult with user data if authenticated, AuthError with response if not
 * 
 * @example
 * // In your API route:
 * export async function GET(req: NextRequest) {
 *   const auth = await requireAuth();
 *   if (!auth.authenticated) return auth.response;
 *   
 *   const { user, session } = auth;
 *   // ... use authenticated user
 * }
 */
export async function requireAuth(): Promise<AuthCheck> {
  const session = await getSession();

  if (!session) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      ),
    };
  }

  if (!session.user) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { error: "Sessão inválida" },
        { status: 401 }
      ),
    };
  }

  return {
    authenticated: true,
    user: {
      id: session.userId,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
    },
    session,
  };
}

/**
 * Check if user has required role
 * 
 * @param allowedRoles - Array of allowed roles
 * @returns AuthResult if authorized, AuthError if not
 * 
 * @example
 * const auth = await requireRole(["ADMIN", "GERENTE"]);
 * if (!auth.authenticated) return auth.response;
 */
export async function requireRole(allowedRoles: string[]): Promise<AuthCheck> {
  const auth = await requireAuth();
  
  if (!auth.authenticated) {
    return auth;
  }

  if (!allowedRoles.includes(auth.user.role)) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { error: "Acesso não autorizado" },
        { status: 403 }
      ),
    };
  }

  return auth;
}

/**
 * Check if user is Admin
 */
export async function requireAdmin(): Promise<AuthCheck> {
  return requireRole(["ADMIN"]);
}

/**
 * Check if user is Admin or Gerente
 */
export async function requireManager(): Promise<AuthCheck> {
  return requireRole(["ADMIN", "GERENTE"]);
}
