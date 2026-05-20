"use client";

import { formatCpf, onlyDigits } from "../../lib/utils/cpf";

export type CpfInputProps = {
  id: string;
  label: string;
  value: string;
  error?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

export const CpfInput = ({
  id,
  label,
  value,
  error,
  disabled = false,
  onChange,
}: CpfInputProps): JSX.Element => {
  return (
    <label htmlFor={id} className="grid gap-1 text-sm text-clinic-text">
      {label}
      <input
        id={id}
        value={formatCpf(value)}
        disabled={disabled}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          onChange(onlyDigits(event.target.value))
        }
        className="rounded-md border border-clinic-border bg-white px-3 py-2 disabled:opacity-60"
        aria-invalid={error !== undefined}
      />
      {error !== undefined ? (
        <span className="text-xs text-clinic-danger">{error}</span>
      ) : null}
    </label>
  );
};

