import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Public routes — no auth required ───────────────────────────────────
  const publicPaths = ["/login", "/signup", "/api/auth"];
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    // If user already has a session and hits /login or /signup, redirect home
    if (pathname === "/login" || pathname === "/signup") {
      const sessionToken =
        request.cookies.get("__Secure-better-auth.session_token")?.value ??
        request.cookies.get("better-auth.session_token")?.value;
      if (sessionToken) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
    return NextResponse.next();
  }

  // ── Check session cookie (works both dev HTTP and prod HTTPS) ──────────
  const sessionToken =
    request.cookies.get("__Secure-better-auth.session_token")?.value ??
    request.cookies.get("better-auth.session_token")?.value;

  if (!sessionToken) {
    // API routes return 401 instead of redirect
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Add security headers ───────────────────────────────────────────────
  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except static assets and image optimization
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
