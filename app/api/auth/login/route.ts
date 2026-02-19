import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { checkRateLimit, resetRateLimit, RATE_LIMIT_CONFIGS } from "@/lib/rate-limit";
import * as bcrypt from "bcryptjs";

// Security constants
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;
    
    // 1. Capture IP/UserAgent for forensics and rate limiting
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || 
               req.headers.get("x-real-ip") || 
               "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha obrigatórios" }, { status: 400 });
    }

    // 2. SECURITY: Rate limiting by IP
    const rateLimitKey = `login:${ip}`;
    const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMIT_CONFIGS.login);
    
    if (!rateLimit.allowed) {
      const retryAfterSeconds = Math.ceil(rateLimit.resetIn / 1000);
      
      await logAudit({
        action: "LOGIN",
        resource: "System",
        details: { 
          reason: "Rate limit exceeded", 
          ipAddress: ip,
          attempts: rateLimit.count 
        },
        severity: "WARNING",
        ipAddress: ip,
        userAgent: userAgent,
      });
      
      return NextResponse.json(
        { 
          error: `Muitas tentativas. Tente novamente em ${retryAfterSeconds} segundos.`,
          retryAfter: retryAfterSeconds 
        }, 
        { 
          status: 429,
          headers: {
            "Retry-After": String(retryAfterSeconds),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(Date.now() / 1000) + retryAfterSeconds),
          }
        }
      );
    }

    // 3. Fetch User
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // 4. Check if user exists and is active
    if (!user || !user.isActive) {
      await logAudit({
        action: "LOGIN",
        resource: "System",
        details: { reason: "User not found or inactive", emailAttempt: email },
        severity: "WARNING",
        ipAddress: ip,
        userAgent: userAgent,
      });
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    // 5. SECURITY: Check account lockout
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const lockoutRemaining = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 1000 / 60);
      
      await logAudit({
        action: "LOGIN",
        resource: "System",
        details: { reason: "Account locked", emailAttempt: email, lockoutRemaining },
        severity: "WARNING",
        actorId: user.id,
        actorEmail: user.email,
        ipAddress: ip,
        userAgent: userAgent,
      });
      
      return NextResponse.json(
        { error: `Conta bloqueada. Tente novamente em ${lockoutRemaining} minutos.` }, 
        { status: 423 }
      );
    }

    // 6. Validate password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      const newFailedAttempts = user.failedLoginAttempts + 1;
      
      // Update failed attempts and potentially lock account
      const updateData: any = { 
        failedLoginAttempts: { increment: 1 } 
      };
      
      // Lock account after MAX_FAILED_ATTEMPTS
      if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
        updateData.lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
        
        await logAudit({
          action: "LOGIN", // Changed from LOCKOUT - action describes security event
          resource: "User",
          resourceId: user.id.toString(),
          details: { 
            reason: "Too many failed attempts", 
            failedAttempts: newFailedAttempts,
            lockoutDurationMinutes: LOCKOUT_DURATION_MINUTES 
          },
          severity: "WARNING",
          actorId: user.id,
          actorEmail: user.email,
          ipAddress: ip,
          userAgent: userAgent,
        });
      }
      
      await prisma.user.update({
        where: { id: user.id },
        data: updateData
      });

      await logAudit({
        action: "LOGIN",
        resource: "System",
        details: { 
          reason: "Invalid password", 
          emailAttempt: email,
          failedAttempts: newFailedAttempts,
          maxAttempts: MAX_FAILED_ATTEMPTS
        },
        severity: "WARNING",
        actorId: user.id,
        actorEmail: user.email,
        ipAddress: ip,
        userAgent: userAgent,
      });

      const remainingAttempts = MAX_FAILED_ATTEMPTS - newFailedAttempts;
      const errorMessage = remainingAttempts > 0 
        ? `Credenciais inválidas. ${remainingAttempts} tentativa(s) restante(s).`
        : `Conta bloqueada por ${LOCKOUT_DURATION_MINUTES} minutos.`;

      return NextResponse.json({ error: errorMessage }, { status: 401 });
    }

    // 7. Success - Reset failures, lockout, and update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        failedLoginAttempts: 0,
        lockoutUntil: null,
        lastLoginAt: new Date()
      } 
    });

    // Reset rate limit on successful login
    resetRateLimit(rateLimitKey);

    // 8. Create Session (Cookie)
    await createSession(user.id, ip, userAgent);

    // 9. Audit Success
    await logAudit({
      action: "LOGIN",
      resource: "System",
      severity: "INFO",
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role as any,
      ipAddress: ip,
      userAgent: userAgent,
    });

    return NextResponse.json({ 
      success: true, 
      user: { 
        name: user.name, 
        email: user.email, 
        role: user.role 
      } 
    });

  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
