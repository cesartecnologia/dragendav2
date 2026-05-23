"use client";

import type { WorkDay } from "../../lib/types";

export type WorkDayEditorProps = {
  value: WorkDay[];
  onChange: (value: WorkDay[]) => void;
};

const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export const WorkDayEditor = ({ value, onChange }: WorkDayEditorProps): JSX.Element => {
  return (
    <div className="grid gap-3">
      {weekdays.map((label, index) => {
        const weekday = index as WorkDay["weekday"];
        const item = value.find((day) => day.weekday === weekday);
        const active = item !== undefined;
        return (
          <div key={label} className="grid gap-2 rounded-md border border-clinic-border p-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={active}
                onChange={(event) => {
                  onChange(
                    event.target.checked
                      ? [...value, { weekday, startTime: "08:00", endTime: "18:00", slotMin: 30, maxPatients: 1 }]
                      : value.filter((day) => day.weekday !== weekday),
                  );
                }}
              />
              {label}
            </label>
            <input type="time" value={item?.startTime ?? "08:00"} disabled={!active} onChange={(event) => onChange(value.map((day) => day.weekday === weekday ? { ...day, startTime: event.target.value } : day))} className="rounded-md border px-3 py-2" />
            <input type="time" value={item?.endTime ?? "18:00"} disabled={!active} onChange={(event) => onChange(value.map((day) => day.weekday === weekday ? { ...day, endTime: event.target.value } : day))} className="rounded-md border px-3 py-2" />
            <input type="number" value={item?.slotMin ?? 30} disabled={!active} onChange={(event) => onChange(value.map((day) => day.weekday === weekday ? { ...day, slotMin: Number(event.target.value) } : day))} className="rounded-md border px-3 py-2" />
            <input type="number" value={item?.maxPatients ?? 1} disabled={!active} onChange={(event) => onChange(value.map((day) => day.weekday === weekday ? { ...day, maxPatients: Number(event.target.value) } : day))} className="rounded-md border px-3 py-2" />
          </div>
        );
      })}
    </div>
  );
};
