"use client";

import type { AppointmentStatus, PaymentStatus } from "../../lib/types";
import { sentenceCase } from "../../lib/utils/labels";

export type StatusBadgeProps = {
  status: AppointmentStatus | PaymentStatus | string;
};

const labels: Record<string, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  completed: "Concluído",
  "no-show": "Não compareceu",
  pending: "Pendente",
  paid: "Pago",
  partial: "Parcial",
  refunded: "Reembolsado",
};

const classes: Record<string, string> = {
  scheduled: "bg-clinic-primary/10 text-clinic-primary",
  confirmed: "bg-clinic-success/10 text-clinic-success",
  cancelled: "bg-clinic-danger/10 text-clinic-danger",
  completed: "bg-clinic-secondary/10 text-clinic-secondary",
  "no-show": "bg-clinic-warning/10 text-clinic-warning",
  pending: "bg-clinic-warning/10 text-clinic-warning",
  paid: "bg-clinic-success/10 text-clinic-success",
  partial: "bg-clinic-accent/10 text-clinic-accent",
  refunded: "bg-clinic-muted/10 text-clinic-muted",
};

export const StatusBadge = ({ status }: StatusBadgeProps): JSX.Element => {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        classes[status] ?? "bg-clinic-bg text-clinic-muted"
      }`}
    >
      {labels[status] ?? sentenceCase(status)}
    </span>
  );
};
