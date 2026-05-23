"use client";

import type { Vacation } from "../../lib/types";

export type VacationEditorProps = {
  value: Vacation[];
  onChange: (value: Vacation[]) => void;
};

export const VacationEditor = ({ value, onChange }: VacationEditorProps): JSX.Element => {
  return (
    <div className="grid gap-3">
      {value.map((vacation, index) => (
        <div key={`${vacation.start}-${index}`} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <input type="date" value={vacation.start} onChange={(event) => onChange(value.map((item, itemIndex) => itemIndex === index ? { ...item, start: event.target.value } : item))} className="rounded-md border px-3 py-2" />
          <input type="date" value={vacation.end} onChange={(event) => onChange(value.map((item, itemIndex) => itemIndex === index ? { ...item, end: event.target.value } : item))} className="rounded-md border px-3 py-2" />
          <button type="button" onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))} className="rounded-md border px-3 py-2 text-clinic-danger">Remover</button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...value, { start: "", end: "" }])} className="rounded-md border border-clinic-border px-4 py-2 text-sm">Adicionar férias</button>
    </div>
  );
};
