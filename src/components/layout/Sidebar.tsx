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
import { AppLogo } from "./AppLogo";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/appointments", label: "Agenda", icon: CalendarDays },
  { href: "/patients", label: "Pacientes", icon: Users },
  { href: "/doctors", label: "Médicos", icon: Stethoscope },
  { href: "/settings/exams", label: "Exames", icon: FlaskConical },
  { href: "/financial", label: "Financeiro", icon: Wallet },
  { href: "/reports", label: "Relatórios", icon: ChartNoAxesCombined },
  { href: "/users", label: "Funcionários", icon: UserCircle },
  { href: "/settings/company", label: "Clínica", icon: Building2 },
  { href: "/subscription", label: "Assinatura", icon: CreditCard },
];

export const Sidebar = (): JSX.Element => {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-clinic-border bg-clinic-surface md:flex md:flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-clinic-border px-4">
        <AppLogo className="h-8 w-8 shrink-0" />
        <span className="font-semibold text-clinic-text">Dr. Agenda</span>
      </div>
      <nav className="grid flex-1 content-start gap-1 p-3">
        {items.map((item) => {
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
  );
};
