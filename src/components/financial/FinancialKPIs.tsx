"use client";

import type { RevenueSummary } from "../../lib/types";
import { formatMoney } from "../../lib/utils/money";

export type FinancialKPIsProps = {
  summary: RevenueSummary | undefined;
  isLoading: boolean;
  error: string | null;
};

export const FinancialKPIs = ({ summary, isLoading, error }: FinancialKPIsProps): JSX.Element => {
  const items = [
    { label: "Total recebido", value: formatMoney(summary?.totalPaid ?? 0) },
    { label: "A receber", value: formatMoney(summary?.totalPending ?? 0) },
    { label: "Inadimplente", value: formatMoney(summary?.totalCancelled ?? 0) },
    { label: "Ticket médio", value: formatMoney(summary?.avgTicket ?? 0) },
  ];

  if (error !== null) {
    return <p className="rounded-md bg-clinic-danger/10 p-4 text-clinic-danger">{error}</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-md border border-clinic-border bg-clinic-surface p-4">
          <p className="text-sm text-clinic-muted">{item.label}</p>
          <p className={`mt-2 text-xl font-semibold text-clinic-text ${isLoading ? "h-7 w-24 animate-pulse rounded bg-clinic-border text-transparent" : ""}`}>{item.value}</p>
        </div>
      ))}
    </div>
  );
};
