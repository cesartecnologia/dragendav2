"use client";

import { CreditCard, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useUiStore } from "../../../lib/stores/uiStore";

type PublicCardCheckoutStartProps = {
  paymentMethod?: "credit_card" | "boleto";
};

const copyByMethod = {
  credit_card: {
    badge: "Cartão de crédito",
    title: "Abrindo sua página de pagamento",
    description: "Você será direcionado para a página de pagamento em instantes.",
    retryLabel: "Tentar novamente",
    endpoint: "/api/asaas/public-card-checkout",
    Icon: CreditCard,
  },
  boleto: {
    badge: "Boleto bancário",
    title: "Continue com boleto",
    description: "Você será levado para a página de pagamento do Asaas e poderá continuar depois.",
    retryLabel: "Tentar novamente",
    endpoint: "/api/asaas/public-boleto-subscription",
    Icon: FileText,
  },
} as const;

export const PublicCardCheckoutStart = ({
  paymentMethod = "credit_card",
}: PublicCardCheckoutStartProps): JSX.Element => {
  const startedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const pushToast = useUiStore((state) => state.pushToast);
  const content = copyByMethod[paymentMethod];
  const Icon = content.Icon;

  useEffect(() => {
    if (startedRef.current) {
      return;
    }

    startedRef.current = true;

    const startCheckout = async (): Promise<void> => {
      try {
        const response = await fetch(content.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const payload = (await response.json().catch(() => null)) as { error?: string; checkoutUrl?: string } | null;

        if (!response.ok || payload?.checkoutUrl === undefined) {
          throw new Error(payload?.error ?? "Não foi possível abrir a página de pagamento agora.");
        }

        window.location.href = payload.checkoutUrl;
      } catch (caughtError: unknown) {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "Não foi possível abrir a página de pagamento agora.";
        setError(message);
        pushToast({ type: "error", title: "Erro no pagamento", description: message });
      }
    };

    void startCheckout();
  }, [content.endpoint, pushToast]);

  return (
    <div className="w-full rounded-[28px] border border-slate-200 bg-white p-6 text-center shadow-[0_20px_70px_rgba(14,165,233,0.10)]">
      <div className="mx-auto inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
        <Icon className="h-3.5 w-3.5" />
        {content.badge}
      </div>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">{content.title}</h1>
      <p className="mt-2 text-[15px] leading-6 text-slate-600">{content.description}</p>

      {error !== null ? (
        <div className="mt-6 space-y-4">
          <p className="text-sm leading-6 text-slate-600">{error}</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/assinatura" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
              Voltar para assinatura
            </Link>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              {content.retryLabel}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-center py-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
            <Loader2 className="h-4 w-4 animate-spin" />
            Preparando pagamento...
          </div>
        </div>
      )}
    </div>
  );
};
