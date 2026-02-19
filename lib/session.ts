import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { randomBytes, createHash } from "crypto";

// Helper function to hash tokens
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

const SESSION_DURATION = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
const SESSION_COOKIE_NAME = "session_token";

export interface SessionData {
  id: string;
  userId: string;
  expiresAt: Date;
  user?: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
}

/**
 * Get current session from cookie and validate it
 */
/**
 * Get current session from cookie and validate it
 */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    // Force type check bypass for tokenHash as it exists in schema/client but TS is confused
    const session = await prisma.session.findFirst({
      where: { tokenHash: hashToken(token) } as any,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        }
      }
    });

    if (!session) {
      return null;
    }
    
    // Verifica expiração
    if (session.expiresAt < new Date()) {
      await invalidateSession(token);
      return null;
    }

    // Verifica validade
    if (!session.isValid) {
      return null;
    }

    // Atualiza horário de última atividade
    await prisma.session.update({
      where: { id: session.id },
      data: { lastActiveAt: new Date() }
    });


    const s = session as any;

    return {
      id: s.id.toString(),
      userId: s.userId.toString(),
      expiresAt: s.expiresAt,
      user: {
        ...s.user,
        id: s.user.id.toString()
      }
    };
  } catch (error) {
    console.error("Erro ao buscar sessão:", error);
    return null;
  }
}

/**
 * Create a new session for a user
 */
export async function createSession(userId: string | bigint, ipAddress?: string, userAgent?: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  // Ensure userId is BigInt for database storage
  const userIdBigInt = typeof userId === 'string' ? BigInt(userId) : userId;

  await prisma.session.create({
    data: {
      user: {
        connect: { id: userIdBigInt as any }
      },
      tokenHash,
      expiresAt,
      ipAddress,
      userAgent,
    } as any
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/"
  });

  return token;
}

/**
 * Invalidate a session
 */
export async function invalidateSession(token: string): Promise<void> {
  try {
    const tokenHash = hashToken(token);
      await prisma.session.update({
      where: { tokenHash } as any, // Cast for similar tokenHash issue
      data: { isValid: false }
    });

    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch (error) {
    console.error("Erro ao invalidar sessão:", error);
  }
}

/**
 * Invalidate all sessions for a user
 */
export async function invalidateAllUserSessions(userId: string): Promise<void> {
  await prisma.session.updateMany({
    where: { userId: BigInt(userId) },
    data: { isValid: false }
  });
}

/**
 * Clean up expired sessions (to be run periodically)
 */
export async function cleanupExpiredSessions(): Promise<void> {
  await prisma.session.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { isValid: false }
      ]
    }
  });
}
