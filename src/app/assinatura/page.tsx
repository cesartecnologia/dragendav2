"use client";

import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AppLogo } from "../../components/layout/AppLogo";
import { useUiStore } from "../../lib/stores/uiStore";
import { formatMoney } from "../../lib/utils/money";

const features = [
  "Agenda, pacientes e equipe em um só lugar.",
  "Cadastros e agendamentos sem limite.",
  "Suporte para acompanhar sua operação.",
  "Organize sua clínica antes de assinar.",
] as const;

const SubscriptionPage = (): JSX.Element => {
  const [loading, setLoading] = useState(false);
  const pushToast = useUiStore((state) => state.pushToast);

  const startAsaasCheckout = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const payload = (await response.json().catch((): { message?: string } => ({}))) as {
        message?: string;
        subscription?: { paymentUrl?: string | null };
      };

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        throw new Error(payload.message ?? "Não foi possível iniciar a assinatura");
      }

      const paymentUrl = payload.subscription?.paymentUrl;

      if (paymentUrl === undefined || paymentUrl === null || paymentUrl.length === 0) {
        throw new Error("O Asaas não retornou o link de pagamento");
      }

      window.location.href = paymentUrl;
    } catch (error: unknown) {
      pushToast({
        type: "error",
        title: "Erro na assinatura",
        description: error instanceof Error ? error.message : "Não foi possível abrir o checkout.",
      });
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5fbff] px-4 py-4 text-slate-950 sm:px-6 sm:py-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <header className="flex items-center justify-between rounded-[28px] border border-white/70 bg-white/95 px-4 py-3 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <AppLogo className="h-10 w-10" />
            <span className="text-lg font-bold tracking-tight text-slate-950">Dr. Agenda</span>
          </Link>

          <Link
            href="/login"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Área do cliente
          </Link>
        </header>

        <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.06)]">
          <div className="px-6 py-8 sm:px-8 sm:py-10">
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800">
                <ShieldCheck className="h-3.5 w-3.5" />
                Assinatura mensal
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl">Plano Premium</h1>
                <p className="text-sm leading-7 text-slate-600 sm:text-base">
                  Comece com 7 dias grátis e mantenha seus cadastros quando assinar.
                </p>
              </div>
              <div className="pt-1">
                <div className="flex flex-wrap items-end justify-center gap-2 text-slate-950">
                  <span className="text-4xl font-bold tracking-tight sm:text-6xl">{formatMoney(9990)}</span>
                  <span className="pb-1 text-sm text-slate-500 sm:text-base">/mês</span>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-sky-600 px-6 text-sm font-bold text-white shadow-lg shadow-sky-900/15 transition hover:bg-sky-700"
                >
                  <Sparkles className="h-4 w-4" />
                  Começar teste grátis
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          <div className="space-y-8 px-6 pb-8 sm:px-8">
            <div className="grid gap-3 rounded-[26px] border border-sky-100 bg-sky-50/80 p-4 sm:p-6 md:grid-cols-2">
              {features.map((feature) => (
                <div key={feature} className="flex min-h-[68px] items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-sky-500" />
                  <p className="text-sm leading-6 text-slate-700">{feature}</p>
                </div>
              ))}
            </div>

            <div className="rounded-[28px] border border-sky-100 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)] sm:p-6">
              <div className="h-1 w-full rounded-full bg-sky-500" />
              <div className="mt-5 grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="space-y-1.5">
                    <h2 className="text-lg font-semibold tracking-tight text-slate-950">Checkout seguro Asaas</h2>
                    <p className="text-sm leading-6 text-slate-600">
                      O cliente conclui a assinatura diretamente no ambiente oficial do Asaas.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={startAsaasCheckout}
                  disabled={loading}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 px-6 text-sm font-bold text-white shadow-lg shadow-sky-900/15 transition hover:bg-sky-700 disabled:opacity-60 md:w-auto"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Assinar pelo Asaas
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto flex items-center gap-2 text-sm text-slate-500">
          <Stethoscope className="h-4 w-4" />
          Gestão profissional para clínicas e consultórios.
        </div>
      </div>
    </main>
  );
};

export default SubscriptionPage;
