"use client";

import { Plus, Trash2 } from "lucide-react";
import type { ConsultationPeriod } from "../../lib/types";

export type PeriodEditorProps = {
  value: ConsultationPeriod[];
  onChange: (value: ConsultationPeriod[]) => void;
};

export const PeriodEditor = ({
  value,
  onChange,
}: PeriodEditorProps): JSX.Element => {
  const addPeriod = (): void => {
    onChange([
      ...value,
      {
        id: crypto.randomUUID(),
        startDate: "",
        endDate: "",
        startTime: "08:00",
        endTime: "18:00",
        slotMin: 30,
        maxPatients: 1,
      },
    ]);
  };

  const updatePeriod = (
    id: string,
    data: Partial<ConsultationPeriod>,
  ): void => {
    onChange(value.map((item) => (item.id === id ? { ...item, ...data } : item)));
  };

  return (
    <div className="grid gap-3">
      {value.length === 0 ? (
        <div className="rounded-md border border-dashed border-clinic-border p-4 text-sm text-clinic-muted">
          Nenhum período cadastrado. Adicione as semanas em que o médico atende.
        </div>
      ) : null}
      {value.map((period) => (
        <div
          key={period.id}
          className="grid gap-3 rounded-md border border-clinic-border p-3 sm:grid-cols-2 lg:grid-cols-12"
        >
          <label className="grid gap-1 text-sm lg:col-span-2">
            Início
            <input
              type="date"
              value={period.startDate}
              onChange={(event) =>
                updatePeriod(period.id, { startDate: event.target.value })
              }
              className="rounded-md border px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm lg:col-span-2">
            Fim
            <input
              type="date"
              value={period.endDate}
              onChange={(event) =>
                updatePeriod(period.id, { endDate: event.target.value })
              }
              className="rounded-md border px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm lg:col-span-2">
            Entrada
            <input
              type="time"
              value={period.startTime}
              onChange={(event) =>
                updatePeriod(period.id, { startTime: event.target.value })
              }
              className="rounded-md border px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm lg:col-span-2">
            Saída
            <input
              type="time"
              value={period.endTime}
              onChange={(event) =>
                updatePeriod(period.id, { endTime: event.target.value })
              }
              className="rounded-md border px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm lg:col-span-2">
            Duração da consulta (min)
            <input
              type="number"
              value={period.slotMin}
              onChange={(event) =>
                updatePeriod(period.id, { slotMin: Number(event.target.value) })
              }
              className="rounded-md border px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm lg:col-span-1">
            Pacientes por horário
            <input
              type="number"
              value={period.maxPatients}
              onChange={(event) =>
                updatePeriod(period.id, { maxPatients: Number(event.target.value) })
              }
              className="rounded-md border px-3 py-2"
            />
          </label>
          <button
            type="button"
            onClick={() => onChange(value.filter((item) => item.id !== period.id))}
            className="inline-flex items-center justify-center rounded-md border border-clinic-border p-2 text-clinic-danger sm:mt-6 lg:col-span-1"
            aria-label="Remover período"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addPeriod}
        className="inline-flex items-center justify-center gap-2 rounded-md border border-clinic-border px-4 py-2 text-sm"
      >
        <Plus className="h-4 w-4" />
        Adicionar período
      </button>
    </div>
  );
};
