"use client";

import { usePathname } from "next/navigation";

const labels: Record<string, string> = {
  dashboard: "Dashboard",
  appointments: "Agenda",
  patients: "Pacientes",
  doctors: "Médicos",
  financial: "Financeiro",
  reports: "Relatórios",
  settings: "Configurações",
  company: "Empresa",
  whatsapp: "WhatsApp",
  insurances: "Convênios",
  specialties: "Especialidades",
  users: "Usuários",
  billing: "Plano",
  new: "Novo",
  schedule: "Agenda",
};

export const Breadcrumb = (): JSX.Element => {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav aria-label="Caminho" className="text-sm text-clinic-muted">
      {segments.map((segment, index) => (
        <span key={`${segment}-${index}`}>
          {index > 0 ? " / " : null}
          {labels[segment] ?? segment}
        </span>
      ))}
    </nav>
  );
};

