"use client";

import { Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { PAYMENT_METHOD, type Appointment, type PaymentMethod } from "../../lib/types";
import { formatMoney } from "../../lib/utils/money";

export type PaymentMethodModalProps = {
  appointment: Appointment | null;
  isPending: boolean;
  onClose: () => void;
  onConfirm: (appointment: Appointment, paymentMethod: PaymentMethod) => void;
};

const paymentOptions: Array<{ label: string; value: PaymentMethod }> = [
  { label: "Débito", value: PAYMENT_METHOD.DEBIT },
  { label: "Crédito", value: PAYMENT_METHOD.CREDIT },
  { label: "Pix", value: PAYMENT_METHOD.PIX },
  { label: "Dinheiro", value: PAYMENT_METHOD.CASH },
];

export const PaymentMethodModal = ({
  appointment,
  isPending,
  onClose,
  onConfirm,
}: PaymentMethodModalProps): JSX.Element | null => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PAYMENT_METHOD.PIX);

  useEffect(() => {
    if (appointment === null) {
      return undefined;
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [appointment, onClose]);

  if (appointment === null) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onMouseDown={onClose} role="presentation">
      <div className="w-full max-w-sm rounded-t-lg bg-clinic-surface p-4 shadow-xl sm:rounded-md sm:p-5" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-clinic-text">Confirmar pagamento</h2>
            <p className="mt-1 text-sm text-clinic-muted">
              {appointment.patientName} · {formatMoney(appointment.amount)}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md border border-clinic-border p-2 text-clinic-muted" aria-label="Fechar">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5 grid gap-2">
          {paymentOptions.map((option) => (
            <label key={option.value} className="flex cursor-pointer items-center gap-3 rounded-md border border-clinic-border p-3 text-sm">
              <input
                type="radio"
                name="paymentMethod"
                value={option.value}
                checked={paymentMethod === option.value}
                onChange={() => setPaymentMethod(option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
        <button
          type="button"
          disabled={isPending}
          onClick={() => onConfirm(appointment, paymentMethod)}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-clinic-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Confirmar pagamento
        </button>
      </div>
    </div>
  );
};
