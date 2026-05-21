"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { PageHeader } from "../../../../components/shared/PageHeader";
import { useUiStore } from "../../../../lib/stores/uiStore";
import { formatMoney } from "../../../../lib/utils/money";

type SubscriptionView = {
  id: string;
  status: "trialing" | "active" | "past_due" | "cancelled" | "blocked";
  plan: "starter" | "pro" | "enterprise";
  amount: number;
  nextDueDate: string | null;
};

type SubscriptionResponse = {
  subscription: SubscriptionView | null;
};

const statusLabel: Record<SubscriptionView["status"], string> = {
  trialing: "Teste",
  active: "Ativa",
  past_due: "Em atraso",
  cancelled: "Cancelada",
  blocked: "Bloqueada",
};

const planLabel: Record<SubscriptionView["plan"], string> = {
  starter: "Starter",
  pro: "Pro",
  enterprise: "Enterprise",
};

const fetchSubscription = async (): Promise<SubscriptionView | null> => {
  const response = await fetch("/api/billing/subscription");

  if (!response.ok) {
    throw new Error("Não foi possível carregar assinatura");
  }

  const payload = (await response.json()) as SubscriptionResponse;
  return payload.subscription;
};

const createSubscription = async (): Promise<SubscriptionView> => {
  const response = await fetch("/api/billing/subscription", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      plan: "starter",
      amount: 9900,
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(
      (): { message: string } => ({ message: "Não foi possível criar assinatura" }),
    )) as Partial<{ message: string }>;
    throw new Error(payload.message ?? "Não foi possível criar assinatura");
  }

  const payload = (await response.json()) as { subscription: SubscriptionView };
  return payload.subscription;
};

const BillingSettingsPage = (): JSX.Element => {
  const queryClient = useQueryClient();
  const pushToast = useUiStore((state) => state.pushToast);
  const subscription = useQuery({
    queryKey: ["billing-subscription"],
    queryFn: fetchSubscription,
    staleTime: 60_000,
  });
  const create = useMutation({
    mutationFn: createSubscription,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["billing-subscription"] });
      pushToast({
        type: "success",
        title: "Assinatura criada",
        description: "A cobrança mensal foi criada no Asaas.",
      });
    },
    onError: (error: Error) => {
      pushToast({
        type: "error",
        title: "Erro na assinatura",
        description: error.message,
      });
    },
  });

  return (
    <div className="grid gap-6">
      <PageHeader title="Plano" description="Plano atual, renovação e uso mensal." />
      <section className="rounded-md border border-clinic-border bg-clinic-surface p-5">
        {subscription.isLoading ? (
          <div className="h-24 animate-pulse rounded-md bg-clinic-border" />
        ) : null}
        {subscription.error !== null ? (
          <p className="text-sm text-clinic-danger">{subscription.error.message}</p>
        ) : null}
        {!subscription.isLoading && subscription.data === null ? (
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-clinic-text">Starter</h2>
              <p className="mt-1 text-sm text-clinic-muted">
                Ative a cobrança mensal pelo Asaas para controlar o acesso da clínica.
              </p>
            </div>
            <button
              type="button"
              disabled={create.isPending}
              onClick={() => create.mutate()}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-clinic-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Ativar assinatura
            </button>
          </div>
        ) : null}
        {subscription.data !== null && subscription.data !== undefined ? (
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-clinic-muted">Plano</p>
              <p className="mt-1 text-lg font-semibold text-clinic-text">{planLabel[subscription.data.plan]}</p>
            </div>
            <div>
              <p className="text-sm text-clinic-muted">Status</p>
              <p className="mt-1 text-lg font-semibold text-clinic-text">{statusLabel[subscription.data.status]}</p>
            </div>
            <div>
              <p className="text-sm text-clinic-muted">Mensalidade</p>
              <p className="mt-1 text-lg font-semibold text-clinic-text">{formatMoney(subscription.data.amount)}</p>
            </div>
            <div>
              <p className="text-sm text-clinic-muted">Próximo vencimento</p>
              <p className="mt-1 text-lg font-semibold text-clinic-text">{subscription.data.nextDueDate ?? "-"}</p>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
};

export default BillingSettingsPage;
