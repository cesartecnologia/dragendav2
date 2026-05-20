"use client";

import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useEffect } from "react";
import { useUiStore, type ToastState } from "../../lib/stores/uiStore";

const toastStyles: Record<ToastState["type"], string> = {
  success: "border-clinic-success/30 bg-clinic-success/10 text-clinic-success",
  error: "border-clinic-danger/30 bg-clinic-danger/10 text-clinic-danger",
  info: "border-clinic-primary/30 bg-clinic-primary/10 text-clinic-primary",
};

const toastIcons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

export const ToastViewport = (): JSX.Element => {
  const toasts = useUiStore((state) => state.toasts);
  const removeToast = useUiStore((state) => state.removeToast);

  useEffect(() => {
    const timers = toasts.map((toast) =>
      window.setTimeout(() => removeToast(toast.id), 4500),
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [removeToast, toasts]);

  return (
    <div className="fixed right-4 top-4 z-[80] grid w-[calc(100vw-2rem)] max-w-sm gap-3">
      {toasts.map((toast) => {
        const Icon = toastIcons[toast.type];

        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 rounded-md border bg-clinic-surface p-4 shadow-lg ${toastStyles[toast.type]}`}
            role="status"
          >
            <Icon className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-clinic-text">{toast.title}</p>
              <p className="mt-1 text-sm text-clinic-muted">{toast.description}</p>
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="rounded-md p-1 text-clinic-muted hover:bg-clinic-bg"
              aria-label="Fechar notificação"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
