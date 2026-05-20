"use client";

import type { Slot } from "../../lib/types";

export type ScheduleGridProps = {
  slots: Slot[];
  isLoading: boolean;
  error: string | null;
};

export const ScheduleGrid = ({ slots, isLoading, error }: ScheduleGridProps): JSX.Element => {
  if (isLoading) {
    return <div className="h-48 animate-pulse rounded-md bg-clinic-border" />;
  }

  if (error !== null) {
    return <p className="rounded-md bg-clinic-danger/10 p-4 text-clinic-danger">{error}</p>;
  }

  if (slots.length === 0) {
    return <p className="rounded-md border border-dashed p-4 text-clinic-muted">Nenhum horário gerado.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6">
      {slots.map((slot) => (
        <div key={slot.time} className={`rounded-md px-3 py-2 text-center text-sm ${slot.available ? "bg-clinic-success/10 text-clinic-success" : "bg-clinic-danger/10 text-clinic-danger"}`}>
          {slot.time}
        </div>
      ))}
    </div>
  );
};

