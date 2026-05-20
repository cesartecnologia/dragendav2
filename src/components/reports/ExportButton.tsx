"use client";

import { Download, Loader2 } from "lucide-react";

export type ExportButtonProps = {
  label: string;
  isPending: boolean;
  onClick: () => void;
};

export const ExportButton = ({ label, isPending, onClick }: ExportButtonProps): JSX.Element => {
  return (
    <button type="button" disabled={isPending} onClick={onClick} className="inline-flex items-center gap-2 rounded-md border border-clinic-border px-4 py-2 text-sm disabled:opacity-60">
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      {label}
    </button>
  );
};

