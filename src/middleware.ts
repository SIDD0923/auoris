import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes — don't protect these
  const publicPaths = ["/login", "/signup", "/api/auth"];
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check for session cookie (Better Auth uses "better-auth.session_token")
  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value;

  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder
     * - api/chat (AI chat endpoint, protected by session separately)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/chat|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
