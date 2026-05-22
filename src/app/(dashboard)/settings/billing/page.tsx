"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { PageHeader } from "../../../../components/shared/PageHeader";
import { useUiStore } from "../../../../lib/stores/uiStore";
import { formatMoney } from "../../../../lib/utils/money";

type SubscriptionView = {
  id: string;
  status: "trialing" | "active" | "past_due" | "cancelled" | "blocked";
  plan: "starter" | "pro" | "enterprise";
  amount: number;
  nextDueDate: string | null;
  paymentUrl?: string | null;
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

const fetchSubscription = async (): Promise<SubscriptionView | null> => {
  const response = await fetch("/api/billing/subscription");

  if (!response.ok) {
    throw new Error("Não foi possível carregar assinatura");
  }

  const payload = (await response.json()) as SubscriptionResponse;
  return payload.subscription;
};

const createSubscription = async (): Promise<SubscriptionView> => {
  const response = await fetch("/api/billing/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
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
    onSuccess: async (createdSubscription) => {
      await queryClient.invalidateQueries({ queryKey: ["billing-subscription"] });
      pushToast({
        type: "success",
        title: "Checkout criado",
        description: "Você será direcionado para o Asaas.",
      });
      const paymentUrl = createdSubscription.paymentUrl;

      if (paymentUrl !== undefined && paymentUrl !== null && paymentUrl.length > 0) {
        window.location.href = paymentUrl;
      }
    },
    onError: (error: Error) => {
      pushToast({
        type: "error",
        title: "Erro na assinatura",
        description: error.message,
      });
    },
  });
  const currentSubscription = subscription.data;
  const hasPaidAccess = currentSubscription?.status === "active";
  const planTitle =
    currentSubscription?.status === "past_due"
      ? "Pagamento pendente"
      : hasPaidAccess
        ? "Plano Premium ativo"
        : currentSubscription?.status === "trialing"
          ? "Teste grátis ativo"
          : "Plano Premium";
  const ctaLabel =
    currentSubscription?.status === "past_due"
      ? "Regularizar assinatura"
      : hasPaidAccess
        ? "Plano Premium ativo"
        : "Assinar pelo Asaas";
  const features = [
    "Cadastro ilimitado de médicos",
    "Agendamentos ilimitados",
    "Visão completa da rotina da clínica",
    "Cadastro completo de pacientes",
    "Gestão da equipe e atendimentos",
    "Suporte prioritário",
  ];

  return (
    <div className="grid gap-6">
      <PageHeader title="Plano" description="Plano atual, renovação e uso mensal." />
      <section className="mx-auto w-full max-w-3xl rounded-[30px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.06)]">
        {subscription.isLoading ? (
          <div className="m-6 h-72 animate-pulse rounded-[24px] bg-sky-50" />
        ) : null}
        {subscription.error !== null ? (
          <p className="m-6 rounded-2xl bg-clinic-danger/10 p-4 text-sm text-clinic-danger">{subscription.error.message}</p>
        ) : null}
        {!subscription.isLoading && subscription.error === null ? (
          <>
            <div className="space-y-6 px-6 py-8 sm:px-8">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">{planTitle}</h2>
                  <p className="mx-auto max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                    Gerencie sua clínica com mais organização, controle e praticidade no dia a dia.
                  </p>
                </div>

                {currentSubscription !== null && currentSubscription !== undefined ? (
                  <span className="w-fit rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700">
                    {statusLabel[currentSubscription.status]}
                  </span>
                ) : null}
              </div>

              <div className="rounded-[26px] border border-sky-100 bg-sky-50/80 px-5 py-8 sm:px-8">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="flex items-end justify-center gap-1.5">
                    <span className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
                      {formatMoney(currentSubscription?.amount ?? 9990)}
                    </span>
                    <span className="pb-1 text-sm text-slate-500 sm:text-base">/mês</span>
                  </div>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                    Ideal para clínicas que querem concentrar agenda, pacientes, equipe e visão do negócio em uma única plataforma.
                  </p>
                  {currentSubscription?.nextDueDate ? (
                    <div className="mt-5 w-full max-w-xl rounded-2xl border border-sky-200 bg-white px-4 py-3 text-center text-sm text-sky-800">
                      <span className="font-medium">Próximo vencimento:</span> {currentSubscription.nextDueDate}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="space-y-6 border-t border-slate-100 px-6 py-6 sm:px-8">
              <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
                {features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3 rounded-xl">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sky-500" />
                    <p className="text-slate-700">{feature}</p>
                  </div>
                ))}
              </div>

              <div className="mx-auto w-full max-w-xl space-y-4">
                <button
                  type="button"
                  onClick={() => create.mutate()}
                  disabled={create.isPending || hasPaidAccess}
                  className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold transition disabled:opacity-60 ${
                    hasPaidAccess
                      ? "border border-slate-200 bg-white text-slate-700"
                      : "bg-sky-600 text-white shadow-lg shadow-sky-900/15 hover:bg-sky-700"
                  }`}
                >
                  {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                  {ctaLabel}
                </button>
              </div>
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
};

export default BillingSettingsPage;
