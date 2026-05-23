"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ChartNoAxesCombined,
  Building2,
  CreditCard,
  FlaskConical,
  LayoutDashboard,
  Stethoscope,
  LogOut,
  Users,
  UserCircle,
  Wallet,
} from "lucide-react";
import { logout } from "../../lib/firebase/auth";
import { useAuth } from "../../lib/hooks/useAuth";
import { canAccessDashboardRoute } from "../../lib/utils/accessControl";
import { AppLogo } from "./AppLogo";

const items = [
  { href: "/painel", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agendamentos", label: "Agenda", icon: CalendarDays },
  { href: "/pacientes", label: "Pacientes", icon: Users },
  { href: "/medicos", label: "Médicos", icon: Stethoscope },
  { href: "/configuracoes/exames", label: "Exames", icon: FlaskConical },
  { href: "/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/relatorios", label: "Relatórios", icon: ChartNoAxesCombined },
  { href: "/funcionarios", label: "Funcionários", icon: UserCircle },
  { href: "/configuracoes/clinica", label: "Clínica", icon: Building2 },
  { href: "/minha-assinatura", label: "Assinatura", icon: CreditCard },
];

export const Sidebar = (): JSX.Element => {
  const pathname = usePathname();
  const { user } = useAuth();
  const visibleItems = items.filter((item) => canAccessDashboardRoute(user?.role, item.href));

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-clinic-border bg-clinic-surface lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-clinic-border px-4">
          <AppLogo className="h-8 w-8 shrink-0" />
          <span className="font-semibold text-clinic-text">Dr. Agenda</span>
        </div>
        <nav className="grid flex-1 content-start gap-1 p-3">
          {visibleItems.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                  active
                    ? "bg-clinic-primary text-white"
                    : "text-clinic-muted hover:bg-clinic-bg hover:text-clinic-text"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-clinic-border p-3">
          <div className="mb-3 flex items-center gap-3 rounded-md bg-clinic-bg p-3">
            <UserCircle className="h-8 w-8 text-clinic-muted" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-clinic-text">
                {user?.name ?? "Usuário"}
              </p>
              <p className="truncate text-xs text-clinic-muted">
                {user?.role === "OWNER" ? "Proprietário" : user?.role === "ADMIN" ? "Administrador" : user?.role === "RECEPTIONIST" ? "Recepção" : "Sem cargo"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              void logout();
            }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-clinic-danger hover:bg-clinic-danger/10"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-clinic-border bg-clinic-surface/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-[0_-10px_30px_rgba(44,44,42,0.08)] backdrop-blur lg:hidden">
        <div className="flex gap-1 overflow-x-auto">
          {visibleItems.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-w-[4.5rem] flex-col items-center justify-center gap-1 rounded-md px-2 py-2 text-[11px] font-medium ${
                  active
                    ? "bg-clinic-primary text-white"
                    : "text-clinic-muted hover:bg-clinic-bg hover:text-clinic-text"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};
