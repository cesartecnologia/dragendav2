import { NextResponse, type NextRequest } from "next/server";

const protectedPrefixes = [
  "/dashboard",
  "/appointments",
  "/patients",
  "/doctors",
  "/financial",
  "/reports",
  "/settings",
];

export const proxy = (request: NextRequest): NextResponse => {
  const pathname = request.nextUrl.pathname;
  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const sessionCookie =
    request.cookies.get("__session")?.value ??
    request.cookies.get("firebase-token")?.value ??
    "";

  if (sessionCookie.length === 0) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
};

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/appointments",
    "/appointments/:path*",
    "/patients",
    "/patients/:path*",
    "/doctors",
    "/doctors/:path*",
    "/financial",
    "/financial/:path*",
    "/reports",
    "/reports/:path*",
    "/settings",
    "/settings/:path*",
  ],
};
