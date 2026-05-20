"use client";

import type { Appointment } from "../../lib/types";
import { formatDateTimeBR } from "../../lib/utils/date";
import { EmptyState } from "../shared/EmptyState";
import { StatusBadge } from "../shared/StatusBadge";

export type PatientTimelineProps = {
  appointments: Appointment[];
  isLoading: boolean;
  error: string | null;
};

export const PatientTimeline = ({ appointments, isLoading, error }: PatientTimelineProps): JSX.Element => {
  if (isLoading) {
    return <div className="h-48 animate-pulse rounded-md bg-clinic-border" />;
  }

  if (error !== null) {
    return <EmptyState title="Erro ao carregar histórico" description={error} />;
  }

  if (appointments.length === 0) {
    return <EmptyState title="Sem consultas" description="Este paciente ainda não possui consultas registradas." />;
  }

  return (
    <div className="grid gap-3">
      {appointments.map((appointment) => (
        <div key={appointment.id} className="rounded-md border border-clinic-border bg-clinic-surface p-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-medium text-clinic-text">{formatDateTimeBR(appointment.date, appointment.time)}</p>
              <p className="text-sm text-clinic-muted">{appointment.doctorName} · {appointment.specialty}</p>
            </div>
            <div className="flex gap-2">
              <StatusBadge status={appointment.status} />
              <StatusBadge status={appointment.paymentStatus} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

