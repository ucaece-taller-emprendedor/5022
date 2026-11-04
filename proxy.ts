import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

// Primera barrera (optimista): sin cookie de sesión no se entra a las áreas privadas.
// La autorización real (rol y estado) se valida en el servidor con requireRole/assertRole.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(getSessionCookie(request));
  const isAdminArea = pathname === "/admin" || (pathname.startsWith("/admin/") && pathname !== "/admin/login");
  const isAppPrivate =
    pathname.startsWith("/app") && !["/app/login", "/app/registro"].includes(pathname);

  if (!hasSession && isAdminArea) return NextResponse.redirect(new URL("/admin/login", request.url));
  if (!hasSession && isAppPrivate) return NextResponse.redirect(new URL("/app/login", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/app/:path*"] };
