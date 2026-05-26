"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { PageHeader } from "../shared/PageHeader";
import { useUiStore } from "../../lib/stores/uiStore";
import { formatMoney } from "../../lib/utils/money";
import { invalidateQueriesInBackground } from "../../lib/utils/queryInvalidation";

type SubscriptionView = {
  id: string;
  status: "trialing" | "active" | "past_due" | "cancelled" | "blocked";
  plan: "starter" | "pro" | "enterprise";
  amount: number;
  nextDueDate: string | null;
  paymentUrl?: string | null;
};

type BillingAccessView = {
  allowed: boolean;
  master: boolean;
  status: "trialing" | "active" | "past_due" | "cancelled" | "blocked" | "none";
  trialEndsAt: string | null;
  trialDaysRemaining: number | null;
  subscription: SubscriptionView | null;
};

type SubscriptionResponse = {
  subscription: SubscriptionView | null;
  access: BillingAccessView;
};

const statusLabel: Record<BillingAccessView["status"], string> = {
  trialing: "Teste grátis",
  active: "Ativa",
  past_due: "Pagamento pendente",
  cancelled: "Cancelada",
  blocked: "Aguardando regularização",
  none: "Sem assinatura",
};

const statusStyles: Record<BillingAccessView["status"], string> = {
  trialing: "bg-sky-100 text-sky-700",
  active: "bg-emerald-100 text-emerald-700",
  past_due: "bg-amber-100 text-amber-700",
  cancelled: "bg-slate-100 text-slate-600",
  blocked: "bg-rose-100 text-rose-700",
  none: "bg-slate-100 text-slate-600",
};

const formatDisplayDate = (date: string | null): string => {
  if (date === null || date.length === 0) {
    return "Ainda não definido";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(parsed);
};

const fetchSubscription = async (): Promise<SubscriptionResponse> => {
  const response = await fetch("/api/billing/subscription");

  if (!response.ok) {
    throw new Error("Não foi possível carregar sua assinatura.");
  }

  return (await response.json()) as SubscriptionResponse;
};

const createCheckout = async (): Promise<SubscriptionView> => {
  const response = await fetch("/api/billing/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(
      (): { message: string } => ({ message: "Não foi possível abrir a assinatura." }),
    )) as Partial<{ message: string }>;
    throw new Error(payload.message ?? "Não foi possível abrir a assinatura.");
  }

  const payload = (await response.json()) as { subscription: SubscriptionView };
  return payload.subscription;
};

export const SubscriptionOverview = (): JSX.Element => {
  const queryClient = useQueryClient();
  const pushToast = useUiStore((state) => state.pushToast);
  const subscription = useQuery({
    queryKey: ["billing-subscription"],
    queryFn: fetchSubscription,
    staleTime: 60_000,
  });
  const checkout = useMutation({
    mutationFn: createCheckout,
    onSuccess: (createdSubscription) => {
      invalidateQueriesInBackground(queryClient, {
        queryKey: ["billing-subscription"],
      });

      if (createdSubscription.paymentUrl !== undefined && createdSubscription.paymentUrl !== null && createdSubscription.paymentUrl.length > 0) {
        window.location.assign(createdSubscription.paymentUrl);
        return;
      }

      pushToast({
        type: "success",
        title: "Assinatura iniciada",
        description: "Confira sua assinatura para continuar.",
      });
    },
    onError: (error: Error) => {
      pushToast({
        type: "error",
        title: "Não foi possível abrir a assinatura",
        description: error.message,
      });
    },
  });
  const data = subscription.data;
  const currentSubscription = data?.subscription ?? data?.access.subscription ?? null;
  const currentStatus = data?.access.master === true ? "active" : data?.access.status ?? currentSubscription?.status ?? "none";
  const hasAccess = data?.access.master === true || data?.access.allowed === true || currentSubscription?.status === "active";
  const amount = currentSubscription?.amount ?? 9990;
  const nextDueDate = currentSubscription?.nextDueDate ?? null;
  const trialEndsAt = data?.access.trialEndsAt ?? null;
  const trialDaysRemaining = data?.access.trialDaysRemaining ?? null;
  const isTrialActive = currentStatus === "trialing" && data?.access.allowed === true;
  const headline = data?.access.master === true
    ? "Acesso Master liberado"
    : isTrialActive
      ? "Teste grátis liberado"
      : currentStatus === "trialing"
        ? "Teste grátis encerrado"
      : currentStatus === "active"
        ? "Assinatura ativa"
        : "Escolha sua assinatura";
  const description = data?.access.master === true
    ? "Este usuário acessa o sistema completo para testes e validações."
    : isTrialActive
      ? "Use o sistema completo por 7 dias. Seus cadastros ficam salvos quando decidir assinar."
    : hasAccess
      ? "Acompanhe o plano, vencimento e situação da sua clínica."
      : "Assine para continuar de onde parou, mantendo todos os cadastros da clínica.";
  const ctaLabel = currentStatus === "past_due" || currentStatus === "blocked"
    ? "Regularizar assinatura"
    : "Assinar agora";
  const features = [
    "Agenda completa da clínica",
    "Médicos, pacientes e equipe no mesmo lugar",
    "Relatórios para acompanhar a operação",
    "Financeiro e comprovantes organizados",
    "Cadastros preservados após a confirmação",
    "Acesso mensal por R$ 99,90",
  ];

  return (
    <div className="grid gap-6">
      <PageHeader title="Assinatura" description="Acompanhe o acesso da clínica, vencimento e plano atual." />
      <section className="overflow-hidden rounded-[30px] border border-sky-100 bg-white shadow-[0_24px_80px_rgba(14,116,144,0.10)]">
        {subscription.isLoading ? (
          <div className="m-6 h-96 animate-pulse rounded-[24px] bg-sky-50" />
        ) : null}
        {subscription.error !== null ? (
          <div className="m-6 flex items-start gap-3 rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{subscription.error.message}</p>
          </div>
        ) : null}
        {!subscription.isLoading && subscription.error === null ? (
          <>
            <div className="relative bg-gradient-to-br from-sky-50 via-cyan-50 to-white px-6 py-8 sm:px-8">
              <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                <div className="space-y-5">
                  <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${statusStyles[currentStatus]}`}>
                    <BadgeCheck className="h-4 w-4" />
                    {data?.access.master === true ? "Master" : statusLabel[currentStatus]}
                  </span>
                  <div className="space-y-3">
                    <h2 className="max-w-3xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{headline}</h2>
                    <p className="max-w-2xl text-base leading-7 text-slate-600">{description}</p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => checkout.mutate()}
                      disabled={checkout.isPending || data?.access.master === true}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-sky-600 px-5 text-sm font-bold text-white shadow-lg shadow-sky-900/15 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {checkout.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                      {data?.access.master === true ? "Acesso liberado" : ctaLabel}
                    </button>
                    {hasAccess ? (
                      <div className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-white px-5 text-sm font-bold text-sky-700">
                        <ShieldCheck className="h-4 w-4" />
                        Sistema liberado
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-[26px] border border-white/80 bg-white/90 p-6 shadow-[0_18px_50px_rgba(14,116,144,0.12)]">
                  <p className="text-sm font-semibold text-slate-500">Plano mensal</p>
                  <div className="mt-3 flex items-end gap-1.5">
                    <span className="text-4xl font-bold tracking-tight text-slate-950">{formatMoney(amount)}</span>
                    <span className="pb-1 text-sm text-slate-500">/mês</span>
                  </div>
                  <div className="mt-6 grid gap-3">
                    <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                        <CalendarClock className="h-4 w-4 text-sky-600" />
                        Próximo vencimento
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{formatDisplayDate(nextDueDate)}</p>
                    </div>
                    {trialEndsAt !== null ? (
                      <div className="rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3">
                        <p className="text-sm font-bold text-slate-800">
                          {isTrialActive ? "Teste grátis termina em" : "Teste grátis terminou em"}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {formatDisplayDate(trialEndsAt)}
                          {trialDaysRemaining !== null && isTrialActive ? ` (${trialDaysRemaining} dia${trialDaysRemaining === 1 ? "" : "s"})` : ""}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 px-6 py-7 sm:grid-cols-2 sm:px-8 lg:grid-cols-3">
              {features.map((feature) => (
                <div key={feature} className="flex min-h-20 items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sky-500" />
                  <p className="text-sm leading-6 text-slate-700">{feature}</p>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
};
