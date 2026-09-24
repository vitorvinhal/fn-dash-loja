import { NextResponse, type NextRequest } from "next/server";

// Rotas administrativas exigem sessão autenticada no servidor
// (defense-in-depth além do guard client-side e do requireAdmin na API).
const PROTECTED: Array<{ path: string; redirectTo: string }> = [
  { path: "/admin", redirectTo: "/login" },
];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const match = PROTECTED.find(
    (p) => pathname === p.path || pathname.startsWith(p.path + "/")
  );
  if (!match) return NextResponse.next();

  const hasSession = request.cookies.has("fn-dash-auth-token");
  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = match.redirectTo;
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};