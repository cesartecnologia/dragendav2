"use client";

import { Loader2 } from "lucide-react";
import { MoneyInput } from "../shared/MoneyInput";

export type PaymentModalProps = {
  open: boolean;
  amount: number;
  isPending: boolean;
  onAmountChange: (amount: number) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export const PaymentModal = ({ open, amount, isPending, onAmountChange, onClose, onSubmit }: PaymentModalProps): JSX.Element | null => {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div className="w-full max-w-md rounded-t-lg bg-clinic-surface p-4 sm:rounded-md sm:p-5">
        <h2 className="text-lg font-semibold">Registrar pagamento</h2>
        <div className="mt-4">
          <MoneyInput id="payment-amount" label="Valor" value={amount} onChange={onAmountChange} />
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={isPending} className="rounded-md border px-4 py-2">Cancelar</button>
          <button type="button" onClick={onSubmit} disabled={isPending} className="inline-flex items-center gap-2 rounded-md bg-clinic-primary px-4 py-2 text-white">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};
