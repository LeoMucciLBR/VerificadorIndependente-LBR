import { NextRequest, NextResponse } from "next/server";

const publicRoutes = ["/"];
const protectedRoutes = ["/admin", "/select-project"];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route));
  
  // Rotas de projeto dinâmicas também são protegidas
  const isDynamicProjectRoute = /^\/[^/]+\/(execucoes|registros|geolocalizacao|settings|relatorio|sintese|documentacao)/.test(path);
  
  const sessionToken = req.cookies.get("session_token")?.value;
  const hasSession = !!sessionToken;

  // Redirecionar para seleção de projeto se já autenticado e tentando acessar login
  if (path === "/" && hasSession) {
    return NextResponse.redirect(new URL("/select-project", req.nextUrl));
  }

  // Redirecionar para login se não autenticado e tentando acessar rota protegida
  if ((isProtectedRoute || isDynamicProjectRoute) && !hasSession) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
