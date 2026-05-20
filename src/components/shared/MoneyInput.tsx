"use client";

import { formatMoney } from "../../lib/utils/money";

export type MoneyInputProps = {
  id: string;
  label: string;
  value: number;
  error?: string;
  disabled?: boolean;
  onChange: (value: number) => void;
};

export const MoneyInput = ({
  id,
  label,
  value,
  error,
  disabled = false,
  onChange,
}: MoneyInputProps): JSX.Element => {
  return (
    <label htmlFor={id} className="grid gap-1 text-sm text-clinic-text">
      {label}
      <input
        id={id}
        inputMode="numeric"
        value={formatMoney(value)}
        disabled={disabled}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          onChange(Number(event.target.value.replace(/\D/g, "")))
        }
        className="rounded-md border border-clinic-border bg-white px-3 py-2 text-right disabled:opacity-60"
        aria-invalid={error !== undefined}
      />
      {error !== undefined ? (
        <span className="text-xs text-clinic-danger">{error}</span>
      ) : null}
    </label>
  );
};

