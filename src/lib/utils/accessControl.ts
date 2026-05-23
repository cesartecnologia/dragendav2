import type { Role } from "../types";

const receptionistBlockedRoutes = [
  "/financial",
  "/reports",
  "/users",
  "/settings/company",
  "/settings/billing",
  "/subscription",
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
