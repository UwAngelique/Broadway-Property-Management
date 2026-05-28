import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CANONICAL_HOST = process.env.NEXT_PUBLIC_CANONICAL_HOST ?? "broadwaycreation.rw";

function shouldBypass(pathname: string): boolean {
  return pathname.startsWith("/_next") || pathname.startsWith("/api");
}

export function middleware(request: NextRequest) {
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }

  const hostname = request.nextUrl.hostname.toLowerCase();
  const needsCanonicalRedirect =
    hostname === `www.${CANONICAL_HOST}` || hostname.endsWith(".vercel.app");

  if (!needsCanonicalRedirect || shouldBypass(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.hostname = CANONICAL_HOST;
  return NextResponse.redirect(redirectUrl, 308);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
