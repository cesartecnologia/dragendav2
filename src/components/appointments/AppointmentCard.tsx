"use client";

import type { Appointment } from "../../lib/types";
import { formatDateTimeBR } from "../../lib/utils/date";
import { getSpecialtyColor } from "../../lib/utils/specialtyColor";
import { StatusBadge } from "../shared/StatusBadge";

export type AppointmentCardProps = {
  appointment: Appointment;
};

export const AppointmentCard = ({ appointment }: AppointmentCardProps): JSX.Element => {
  const specialtyColor = getSpecialtyColor(appointment.specialty);

  return (
    <div className="block rounded-md border border-l-8 border-clinic-border bg-clinic-surface p-4 transition hover:shadow-sm" style={{ borderLeftColor: specialtyColor.border }}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h3 className="font-semibold text-clinic-text">{appointment.patientName}</h3>
          <p className="text-sm text-clinic-muted">{formatDateTimeBR(appointment.date, appointment.time)}</p>
          <p className="text-sm text-clinic-muted">{appointment.doctorName} · <span style={{ color: specialtyColor.text }}>{appointment.specialty}</span></p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={appointment.status} />
          <StatusBadge status={appointment.paymentStatus} />
        </div>
      </div>
    </div>
  );
};
