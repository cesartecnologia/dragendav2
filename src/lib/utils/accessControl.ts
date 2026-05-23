import type { Role } from "../types";

const receptionistBlockedRoutes = [
  "/financeiro",
  "/relatorios",
  "/funcionarios",
  "/configuracoes/clinica",
  "/configuracoes/cobranca",
  "/minha-assinatura",
] as const;

export const canAccessDashboardRoute = (
  role: Role | undefined,
  pathname: string,
): boolean => {
  if (role !== "RECEPTIONIST") {
    return true;
  }

  return !receptionistBlockedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
};
