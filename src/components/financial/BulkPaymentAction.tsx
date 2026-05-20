"use client";

import { Loader2 } from "lucide-react";

export type BulkPaymentActionProps = {
  selectedCount: number;
  isPending: boolean;
  onConfirm: () => void;
};

export const BulkPaymentAction = ({ selectedCount, isPending, onConfirm }: BulkPaymentActionProps): JSX.Element => {
  return (
    <button type="button" disabled={selectedCount === 0 || isPending} onClick={onConfirm} className="inline-flex items-center gap-2 rounded-md bg-clinic-primary px-4 py-2 text-sm text-white disabled:opacity-60">
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      Marcar {selectedCount} como pago
    </button>
  );
};

