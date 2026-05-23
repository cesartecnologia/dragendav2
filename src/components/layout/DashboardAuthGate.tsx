"use client";

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
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

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
      setSubscriptionLoading(true);
      return;
    }

    if (!canAccessDashboardRoute(user.role, pathname)) {
      router.replace("/dashboard");
      setSubscriptionLoading(false);
      return;
    }

    let active = true;

    void fetch("/api/billing/access", { credentials: "same-origin" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Não foi possível validar assinatura");
        }

        return (await response.json()) as { access: { allowed: boolean } };
      })
      .then((payload) => {
        if (!active) {
          return;
        }

        if (!payload.access.allowed && pathname !== "/assinatura") {
          router.replace("/assinatura");
          return;
        }

        setSubscriptionLoading(false);
      })
      .catch(() => {
        if (!active) {
          return;
        }

        router.replace("/assinatura");
      });

    return () => {
      active = false;
    };
  }, [firebaseUser, isLoading, pathname, router, user]);

  if (isLoading || firebaseUser === null || graceExpired || subscriptionLoading) {
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
