"use client";

import type { Payment } from "../../lib/types";
import { formatDateBR } from "../../lib/utils/date";
import { formatMoney } from "../../lib/utils/money";
import { EmptyState } from "../shared/EmptyState";

export type PendingPaymentsProps = {
  payments: Payment[];
  isLoading: boolean;
  error: string | null;
};

export const PendingPayments = ({ payments, isLoading, error }: PendingPaymentsProps): JSX.Element => {
  if (isLoading) {
    return <div className="h-40 animate-pulse rounded-md bg-clinic-border" />;
  }

  if (error !== null) {
    return <EmptyState title="Erro ao carregar inadimplência" description={error} />;
  }

  if (payments.length === 0) {
    return <EmptyState title="Sem pendências" description="Nenhum pagamento pendente no período." />;
  }

  return (
    <div className="grid gap-2">
      {payments.map((payment) => (
        <div key={payment.id} className="flex items-center justify-between rounded-md border border-clinic-border bg-clinic-surface p-3 text-sm">
          <span>{payment.patientName} · {formatDateBR(payment.date)}</span>
          <span className="font-medium">{formatMoney(payment.amount)}</span>
        </div>
      ))}
    </div>
  );
};

