"use client";

import { useState } from "react";
import type { Appointment } from "../../lib/types";
import { EmptyState } from "../shared/EmptyState";
import { LoadingSkeleton } from "../shared/LoadingSkeleton";
import { AppointmentCard } from "./AppointmentCard";
import { AppointmentActionsModal } from "./AppointmentActionsModal";

export type ListViewProps = {
  appointments: Appointment[];
  isLoading: boolean;
  error: string | null;
  onConfirm?: (appointment: Appointment) => void;
  onCancel?: (appointment: Appointment) => void;
  onMarkPaid?: (appointment: Appointment) => void;
  onReschedule?: (appointment: Appointment) => void;
  onPrint?: (appointment: Appointment) => void;
  onWhatsApp?: (appointment: Appointment) => void;
};

export const ListView = ({
  appointments,
  isLoading,
  error,
  onConfirm,
  onCancel,
  onMarkPaid,
  onReschedule,
  onPrint,
  onWhatsApp,
}: ListViewProps): JSX.Element => {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  if (isLoading) {
    return <LoadingSkeleton count={15} />;
  }

  if (error !== null) {
    return <EmptyState title="Erro ao carregar agenda" description={error} />;
  }

  if (appointments.length === 0) {
    return <EmptyState title="Nenhum agendamento" description="Crie um novo agendamento para começar." actionHref="/appointments?modal=new" actionLabel="Novo agendamento" />;
  }

  return (
    <>
      <div className="grid gap-3">
        {appointments.map((appointment) => (
          <button
            key={appointment.id}
            type="button"
            onClick={() => setSelectedAppointment(appointment)}
            className="text-left"
          >
            <AppointmentCard appointment={appointment} />
          </button>
        ))}
      </div>
      <AppointmentActionsModal
        appointment={selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        onConfirm={onConfirm}
        onCancel={onCancel}
        onMarkPaid={onMarkPaid}
        onReschedule={onReschedule}
        onPrint={onPrint}
        onWhatsApp={onWhatsApp}
      />
    </>
  );
};
