"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useClinic } from "../../lib/hooks/useClinic";
import { useAuth } from "../../lib/hooks/useAuth";
import { canAccessDashboardRoute } from "../../lib/utils/accessControl";

export type DashboardAuthGateProps = {
  children: ReactNode;
};

export const DashboardAuthGate = ({
  children,
}: DashboardAuthGateProps): JSX.Element => {
  const router = useRouter();
  const pathname = usePathname();
  const { firebaseUser, user, isLoading } = useAuth();
  const clinic = useClinic(user?.clinicId ?? "");
  const [graceExpired, setGraceExpired] = useState(false);
  const canAccessRoute =
    user !== null ? canAccessDashboardRoute(user.role, pathname) : false;
  const billingAccess = useQuery({
    queryKey: ["billing-access", user?.clinicId ?? "", user?.role ?? ""],
    queryFn: async () => {
      const response = await fetch("/api/billing/access", {
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error("Não foi possível validar assinatura");
      }

      return (await response.json()) as { access: { allowed: boolean } };
    },
    enabled:
      !isLoading &&
      firebaseUser !== null &&
      user !== null &&
      canAccessRoute,
    retry: false,
    staleTime: 60_000,
  });

  useEffect(() => {
    const primaryColor = clinic.data?.primaryColor;

    if (primaryColor !== undefined && primaryColor.length > 0) {
      document.documentElement.style.setProperty(
        "--clinic-primary-dynamic",
        primaryColor,
      );
    }
  }, [clinic.data?.primaryColor]);

  useEffect(() => {
    if (isLoading || firebaseUser !== null) {
      setGraceExpired(false);
      return;
    }

    const hasSessionCookie = document.cookie
      .split(";")
      .some((cookie) => cookie.trim().startsWith("firebase-token="));

    if (!hasSessionCookie) {
      router.replace("/login");
      return;
    }

    const timeout = window.setTimeout(() => {
      setGraceExpired(true);
      router.replace("/login");
    }, 2500);

    return () => window.clearTimeout(timeout);
  }, [firebaseUser, isLoading, router]);

  useEffect(() => {
    if (isLoading || firebaseUser === null || user === null) {
      return;
    }

    if (!canAccessRoute) {
      router.replace("/painel");
      return;
    }

    if (billingAccess.isError || billingAccess.data?.access.allowed === false) {
      router.replace("/assinatura");
    }
  }, [
    billingAccess.data?.access.allowed,
    billingAccess.isError,
    canAccessRoute,
    firebaseUser,
    isLoading,
    router,
    user,
  ]);

  if (
    isLoading ||
    firebaseUser === null ||
    graceExpired ||
    user === null ||
    !canAccessRoute ||
    billingAccess.isError ||
    billingAccess.data?.access.allowed === false ||
    (canAccessRoute && billingAccess.data === undefined && billingAccess.isFetching)
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-clinic-bg text-clinic-muted">
        <div className="inline-flex items-center gap-2 rounded-md border border-clinic-border bg-clinic-surface px-4 py-3 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Verificando login...
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
