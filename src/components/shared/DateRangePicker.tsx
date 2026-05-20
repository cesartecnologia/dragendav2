"use client";

import type { DateRange } from "../../lib/types";
import { formatDateBR, toDateISO } from "../../lib/utils/date";

export type DateRangePickerProps = {
  value: DateRange;
  onChange: (value: DateRange) => void;
};

export const DateRangePicker = ({
  value,
  onChange,
}: DateRangePickerProps): JSX.Element => {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="grid gap-1 text-sm text-clinic-text">
        Início
        <input
          type="date"
          value={toDateISO(value.from)}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            onChange({ ...value, from: new Date(`${event.target.value}T00:00:00`) })
          }
          className="rounded-md border border-clinic-border bg-white px-3 py-2"
          aria-label={`Início ${formatDateBR(value.from)}`}
        />
      </label>
      <label className="grid gap-1 text-sm text-clinic-text">
        Fim
        <input
          type="date"
          value={toDateISO(value.to)}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            onChange({ ...value, to: new Date(`${event.target.value}T23:59:59`) })
          }
          className="rounded-md border border-clinic-border bg-white px-3 py-2"
          aria-label={`Fim ${formatDateBR(value.to)}`}
        />
      </label>
    </div>
  );
};

