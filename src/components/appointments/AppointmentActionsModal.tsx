"use client";

import {
  CheckCircle2,
  CreditCard,
  FileText,
  MessageCircle,
  RefreshCcw,
  XCircle,
} from "lucide-react";
import { useEffect } from "react";
import type { Appointment } from "../../lib/types";
import { formatDateBR } from "../../lib/utils/date";
import { formatMoney } from "../../lib/utils/money";
import { StatusBadge } from "../shared/StatusBadge";

export type AppointmentActionsModalProps = {
  appointment: Appointment | null;
  onClose: () => void;
  onConfirm?: (appointment: Appointment) => void;
  onCancel?: (appointment: Appointment) => void;
  onMarkPaid?: (appointment: Appointment) => void;
  onReschedule?: (appointment: Appointment) => void;
  onPrint?: (appointment: Appointment) => void;
  onWhatsApp?: (appointment: Appointment) => void;
};

export const AppointmentActionsModal = ({
  appointment,
  onClose,
  onConfirm,
  onCancel,
  onMarkPaid,
  onReschedule,
  onPrint,
  onWhatsApp,
}: AppointmentActionsModalProps): JSX.Element | null => {
  useEffect(() => {
    if (appointment === null) {
      return undefined;
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [appointment, onClose]);

  if (appointment === null) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 sm:items-center sm:p-4"
      onMouseDown={onClose}
      role="presentation"
    >
      <div
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-lg bg-clinic-surface p-4 shadow-xl sm:rounded-md sm:p-5"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-clinic-text">
              {appointment.patientName}
            </h2>
            <p className="text-sm text-clinic-muted">
              {formatDateBR(appointment.date)} às {appointment.time}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-clinic-border p-2 text-clinic-muted hover:bg-clinic-bg"
            aria-label="Fechar detalhes"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 grid gap-2 text-sm text-clinic-text">
          <p>
            <strong>Médico:</strong> {appointment.doctorName}
          </p>
          <p>
            <strong>Especialidade:</strong> {appointment.specialty}
          </p>
          <p>
            <strong>Valor:</strong> {formatMoney(appointment.amount)}
          </p>
          <p>
            <strong>Convênio:</strong> {appointment.insuranceName ?? "Particular"}
          </p>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={appointment.status} />
            <StatusBadge status={appointment.paymentStatus} />
          </div>
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={() => onPrint?.(appointment)} className="inline-flex items-center justify-center gap-2 rounded-md border border-clinic-border px-3 py-2 text-sm">
            <FileText className="h-4 w-4" />
            Imprimir
          </button>
          <button type="button" onClick={() => onWhatsApp?.(appointment)} className="inline-flex items-center justify-center gap-2 rounded-md border border-clinic-border px-3 py-2 text-sm">
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </button>
          {appointment.paymentStatus !== "paid" ? (
            <button type="button" onClick={() => onMarkPaid?.(appointment)} className="inline-flex items-center justify-center gap-2 rounded-md border border-clinic-border px-3 py-2 text-sm">
              <CreditCard className="h-4 w-4" />
              Pagamento
            </button>
          ) : null}
          <button type="button" onClick={() => onReschedule?.(appointment)} className="inline-flex items-center justify-center gap-2 rounded-md border border-clinic-border px-3 py-2 text-sm">
            <RefreshCcw className="h-4 w-4" />
            Remarcar
          </button>
          <button type="button" onClick={() => onConfirm?.(appointment)} className="inline-flex items-center justify-center gap-2 rounded-md border border-clinic-border px-3 py-2 text-sm text-clinic-success">
            <CheckCircle2 className="h-4 w-4" />
            Confirmar
          </button>
          {appointment.status !== "cancelled" ? (
            <button type="button" onClick={() => onCancel?.(appointment)} className="inline-flex items-center justify-center gap-2 rounded-md border border-clinic-border px-3 py-2 text-sm text-clinic-danger">
              <XCircle className="h-4 w-4" />
              Cancelar
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
