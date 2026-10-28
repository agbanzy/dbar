// Middleware disabled for static export
// The app is built with "output: export" which doesn't support middleware
// Authentication is handled by login redirect at app level

/*
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  // Public paths
  if (pathname.startsWith("/login") || pathname.startsWith("/reset")) {
    return NextResponse.next();
  }

  // Protected paths - redirect to login if no token
  if (!token && pathname !== "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
*/
