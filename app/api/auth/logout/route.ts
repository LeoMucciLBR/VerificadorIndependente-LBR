import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { createHash } from "crypto";

export async function POST() {
  try {
    // Get the session token from cookie
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    // If there's a token, try to invalidate it in the database
    if (token) {
      try {
        const tokenHash = createHash('sha256').update(token).digest('hex');
        await prisma.session.update({
          where: { tokenHash },
          data: { isValid: false }
        });
      } catch (error) {
        // Session might not exist in database, that's ok
      }
    }

    // Clear all possible session cookies
    cookieStore.delete("session_token");
    cookieStore.delete("session"); // Old session cookie if it exists

    return NextResponse.json({
      success: true,
      message: "Logout realizado com sucesso"
    });
  } catch (error) {
    console.error("Logout error:", error);
    
    // Even if there's an error, try to clear cookies
    try {
      const cookieStore = await cookies();
      cookieStore.delete("session_token");
      cookieStore.delete("session");
    } catch (e) {
      // Ignore cookie clearing errors
    }
    
    return NextResponse.json(
      { error: "Erro ao fazer logout" },
      { status: 500 }
    );
  }
}
