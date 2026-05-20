import type { AppointmentStatus, AppointmentType, PaymentMethod, PaymentStatus, Role } from "../types";

export const paymentMethodLabel = (method: PaymentMethod | string): string => {
  const labels: Record<string, string> = {
    cash: "Dinheiro",
    credit: "Crédito",
    debit: "Débito",
    pix: "Pix",
    insurance: "Convênio",
    courtesy: "Cortesia",
  };

  return labels[method] ?? sentenceCase(method);
};

export const paymentStatusLabel = (status: PaymentStatus | string): string => {
  const labels: Record<string, string> = {
    pending: "Pendente",
    paid: "Pago",
    partial: "Parcial",
    cancelled: "Cancelado",
    refunded: "Reembolsado",
  };

  return labels[status] ?? sentenceCase(status);
};

export const appointmentStatusLabel = (status: AppointmentStatus | string): string => {
  const labels: Record<string, string> = {
    scheduled: "Agendado",
    confirmed: "Confirmado",
    cancelled: "Cancelado",
    completed: "Concluído",
    "no-show": "Não compareceu",
  };

  return labels[status] ?? sentenceCase(status);
};

export const appointmentTypeLabel = (type: AppointmentType | string): string => {
  const labels: Record<string, string> = {
    consultation: "Consulta",
    return: "Retorno",
    exam: "Exame",
    procedure: "Procedimento",
  };

  return labels[type] ?? sentenceCase(type);
};

export const roleLabel = (role: Role | string): string => {
  const labels: Record<string, string> = {
    OWNER: "Proprietário",
    ADMIN: "Administrador",
    RECEPTIONIST: "Recepção",
  };

  return labels[role] ?? sentenceCase(role);
};

export const sentenceCase = (value: string): string => {
  const normalized = value.replaceAll("_", " ").replaceAll("-", " ").trim().toLowerCase();
  return normalized.length === 0 ? "" : `${normalized[0]?.toUpperCase() ?? ""}${normalized.slice(1)}`;
};
