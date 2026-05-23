"use client";

import {
  CalendarClock,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Appointment } from "../../lib/types";
import { formatDateBR } from "../../lib/utils/date";
import { getSpecialtyColor } from "../../lib/utils/specialtyColor";
import { EmptyState } from "../shared/EmptyState";
import { AppointmentActionsModal } from "./AppointmentActionsModal";

export type CalendarViewProps = {
  appointments: Appointment[];
  isLoading: boolean;
  error: string | null;
  onConfirm?: (appointment: Appointment) => void;
  onCancel?: (appointment: Appointment) => void;
  onMarkPaid?: (appointment: Appointment) => void;
  onReschedule?: (appointment: Appointment) => void;
  onPrint?: (appointment: Appointment) => void;
  onWhatsApp?: (appointment: Appointment) => void;
  onEmptySlot?: (date: string, time: string) => void;
};

const hours = Array.from({ length: 11 }, (_, index) => `${index + 8}`.padStart(2, "0"));

const toDateKey = (date: Date): string => date.toISOString().slice(0, 10);

const createWeekDays = (appointments: Appointment[]): string[] => {
  const firstAppointment = appointments[0]?.date;
  const base = firstAppointment !== undefined ? new Date(`${firstAppointment}T12:00:00`) : new Date();
  const day = base.getDay();
  const monday = new Date(base);
  monday.setDate(base.getDate() - ((day + 6) % 7));

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return toDateKey(date);
  });
};

export const CalendarView = ({
  appointments,
  isLoading,
  error,
  onConfirm,
  onCancel,
  onMarkPaid,
  onReschedule,
  onPrint,
  onWhatsApp,
  onEmptySlot,
}: CalendarViewProps): JSX.Element => {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const weekDays = useMemo(() => createWeekDays(appointments), [appointments]);
  const todayKey = toDateKey(new Date());
  const appointmentsByDateHour = useMemo(() => {
    const map = new Map<string, Appointment[]>();

    appointments.forEach((appointment) => {
      const key = `${appointment.date}_${appointment.time.slice(0, 2)}`;
      map.set(key, [...(map.get(key) ?? []), appointment]);
    });

    return map;
  }, [appointments]);

  if (isLoading) {
    return <div className="h-[640px] animate-pulse rounded-md bg-clinic-border" />;
  }

  if (error !== null) {
    return <EmptyState title="Erro ao carregar calendário" description={error} />;
  }

  return (
    <div className="overflow-hidden rounded-md border border-clinic-border bg-clinic-surface">
      <div className="grid grid-cols-[64px_repeat(7,minmax(120px,1fr))] border-b border-clinic-border bg-clinic-bg">
        <div className="p-3 text-center text-clinic-primary">
          <CalendarClock className="mx-auto h-5 w-5" />
        </div>
        {weekDays.map((date) => {
          const isToday = date === todayKey;

          return (
            <div
              key={date}
              className={`border-l border-clinic-border p-3 text-center ${isToday ? "bg-clinic-primary/10 ring-1 ring-inset ring-clinic-primary/30" : ""}`}
            >
              <p className="text-sm font-semibold text-clinic-text">
                {new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "short" })}
              </p>
              <p className="text-xs text-clinic-muted">{formatDateBR(date)}</p>
            </div>
          );
        })}
      </div>
      <div className="max-h-[620px] overflow-auto">
        {hours.map((hour) => (
          <div key={hour} className="grid min-h-28 grid-cols-[64px_repeat(7,minmax(120px,1fr))] border-b border-clinic-border last:border-b-0">
            <div className="border-r border-clinic-border p-2 text-center text-sm text-clinic-muted">
              {hour}:00
            </div>
            {weekDays.map((date) => {
              const items = (appointmentsByDateHour.get(`${date}_${hour}`) ?? []).filter(
                (appointment) => appointment.status !== "cancelled",
              );
              return (
                <div
                  key={`${date}_${hour}`}
                  className="min-h-28 border-r border-clinic-border p-1.5 text-left last:border-r-0 hover:bg-clinic-bg"
                >
                  <div className="grid max-h-24 gap-1 overflow-y-auto pr-1">
                    {items.map((appointment) => (
                    (() => {
                      const specialtyColor = getSpecialtyColor(appointment.specialty);
                      return (
                    <button
                      key={appointment.id}
                      type="button"
                      onClick={() => setSelectedAppointment(appointment)}
                      className="rounded-md border border-l-4 border-clinic-border bg-white p-1.5 text-left shadow-sm"
                      style={{ borderLeftColor: specialtyColor.border }}
                    >
                      <p className="text-xs font-semibold text-clinic-text">
                        {appointment.time} · {appointment.patientName}
                      </p>
                      <p className="text-[11px] leading-tight text-clinic-muted">
                        {appointment.doctorName} · {appointment.specialty}
                      </p>
                    </button>
                      );
                    })()
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => onEmptySlot?.(date, `${hour}:00`)}
                    className="mt-1 h-5 w-full rounded-sm text-left text-[10px] text-transparent hover:bg-clinic-primary/10 hover:px-1 hover:text-clinic-primary"
                    aria-label={`Novo agendamento em ${formatDateBR(date)} às ${hour}:00`}
                  >
                    Novo
                  </button>
                </div>
              );
            })}
          </div>
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
    </div>
  );
};
