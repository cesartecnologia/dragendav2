import { NextResponse, type NextRequest } from "next/server";

const protectedPrefixes = [
  "/painel",
  "/agendamentos",
  "/pacientes",
  "/medicos",
  "/financeiro",
  "/relatorios",
  "/funcionarios",
  "/configuracoes",
  "/minha-assinatura",
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
    "/painel",
    "/painel/:path*",
    "/agendamentos",
    "/agendamentos/:path*",
    "/pacientes",
    "/pacientes/:path*",
    "/medicos",
    "/medicos/:path*",
    "/financeiro",
    "/financeiro/:path*",
    "/relatorios",
    "/relatorios/:path*",
    "/funcionarios",
    "/funcionarios/:path*",
    "/configuracoes",
    "/configuracoes/:path*",
    "/minha-assinatura",
    "/minha-assinatura/:path*",
  ],
};
