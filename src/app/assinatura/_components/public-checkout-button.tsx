"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { useUiStore } from "../../../lib/stores/uiStore";

const endpointByMethod = {
  credit_card: "/api/asaas/public-card-checkout",
  boleto: "/api/asaas/public-boleto-subscription",
} as const;

type PublicCheckoutButtonProps = {
  paymentMethod: keyof typeof endpointByMethod;
  label: string;
  variant?: "default" | "outline";
  className?: string;
};

type CheckoutPayload = {
  error?: string;
  checkoutUrl?: string;
  sessionId?: string;
};

export const PublicCheckoutButton = ({
  paymentMethod,
  label,
  variant = "default",
  className = "",
}: PublicCheckoutButtonProps): JSX.Element => {
  const [isLoading, setIsLoading] = useState(false);
  const pushToast = useUiStore((state) => state.pushToast);

  const handleClick = async (): Promise<void> => {
    if (isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(endpointByMethod[paymentMethod], {
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as CheckoutPayload | null;

      if (!response.ok || payload?.checkoutUrl === undefined) {
        throw new Error(payload?.error ?? "Não foi possível abrir a página de pagamento agora.");
      }

      window.location.assign(payload.checkoutUrl);
    } catch (error: unknown) {
      pushToast({
        type: "error",
        title: "Erro no pagamento",
        description:
          error instanceof Error
            ? error.message
            : "Não foi possível abrir a página de pagamento agora.",
      });
      setIsLoading(false);
    }
  };

  const variantClass =
    variant === "outline"
      ? "border border-sky-200 bg-white text-sky-900 hover:bg-sky-50"
      : "bg-slate-950 text-white hover:bg-slate-800";

  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 font-semibold transition disabled:opacity-60 ${variantClass} ${className}`}
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      <span className="truncate">{label}</span>
      {!isLoading ? <ArrowRight className="h-4 w-4" /> : null}
    </button>
  );
};
