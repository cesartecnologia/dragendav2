"use client";

import type { Insurance } from "../../lib/types";

export type InsuranceCardProps = {
  insurance: Insurance;
};

export const InsuranceCard = ({ insurance }: InsuranceCardProps): JSX.Element => {
  return (
    <div className="rounded-md border border-clinic-border bg-clinic-surface p-4">
      <h3 className="font-semibold text-clinic-text">{insurance.name}</h3>
      <p className="text-sm text-clinic-muted">{insurance.ansCode.trim().length > 0 ? `ANS ${insurance.ansCode}` : "Sem código ANS"}</p>
      <p className="mt-2 text-sm text-clinic-muted">Desconto informado no agendamento</p>
      <p className="mt-2 text-sm text-clinic-muted">{insurance.coverageRules.length} regras cadastradas</p>
    </div>
  );
};
