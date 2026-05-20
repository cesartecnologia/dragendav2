"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useClinic } from "../../lib/hooks/useClinic";
import { useAuth } from "../../lib/hooks/useAuth";

export type DashboardAuthGateProps = {
  children: ReactNode;
};

export const DashboardAuthGate = ({
  children,
}: DashboardAuthGateProps): JSX.Element => {
  const router = useRouter();
  const { firebaseUser, user, isLoading } = useAuth();
  const clinic = useClinic(user?.clinicId ?? "");
  const [graceExpired, setGraceExpired] = useState(false);

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

  if (isLoading || firebaseUser === null || graceExpired) {
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
