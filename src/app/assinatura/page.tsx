"use client";

import { ArrowRight, CalendarDays, CheckCircle2, CreditCard, FileText, Loader2, Lock, MessageCircle, Users } from "lucide-react";
import { useState } from "react";
import { AppLogo } from "../../components/layout/AppLogo";
import { useUiStore } from "../../lib/stores/uiStore";
import { formatMoney } from "../../lib/utils/money";

type BillingType = "CREDIT_CARD" | "BOLETO";

type CheckoutForm = {
  name: string;
  email: string;
  cpfCnpj: string;
  phone: string;
  postalCode: string;
  addressNumber: string;
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
};

const initialForm: CheckoutForm = {
  name: "",
  email: "",
  cpfCnpj: "",
  phone: "",
  postalCode: "",
  addressNumber: "",
  holderName: "",
  number: "",
  expiryMonth: "",
  expiryYear: "",
  ccv: "",
};

const benefits = [
  "Agenda, pacientes e equipe em um só lugar.",
  "Cadastro de médicos, especialidades, exames e convênios.",
  "Agendamentos com confirmação pelo WhatsApp.",
  "Financeiro, relatórios e comprovantes em PDF.",
  "Teste grátis por 7 dias sem perder seus cadastros.",
  "Dados seguros por clínica com acesso individual.",
];

const formatDigits = (value: string): string => value.replace(/\D/g, "");

const SubscriptionPage = (): JSX.Element => {
  const [billingType, setBillingType] = useState<BillingType>("CREDIT_CARD");
  const [form, setForm] = useState<CheckoutForm>(initialForm);
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const pushToast = useUiStore((state) => state.pushToast);

  const update = (key: keyof CheckoutForm, value: string): void => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billingType,
          holder: {
            name: form.name,
            email: form.email,
            cpfCnpj: formatDigits(form.cpfCnpj),
            phone: formatDigits(form.phone),
            postalCode: formatDigits(form.postalCode),
            addressNumber: form.addressNumber,
          },
          ...(billingType === "CREDIT_CARD"
            ? {
                creditCard: {
                  holderName: form.holderName,
                  number: formatDigits(form.number),
                  expiryMonth: form.expiryMonth,
                  expiryYear: form.expiryYear,
                  ccv: formatDigits(form.ccv),
                },
              }
            : {}),
        }),
      });
      const payload = (await response.json().catch((): { message?: string } => ({}))) as {
        message?: string;
        subscription?: { paymentUrl?: string | null };
      };

      if (!response.ok) {
        throw new Error(payload.message ?? "Não foi possível iniciar assinatura");
      }

      pushToast({
        type: "success",
        title: "Assinatura criada",
        description: billingType === "BOLETO" ? "Boleto gerado no Asaas." : "Cartão enviado para processamento.",
      });
      setPaymentUrl(payload.subscription?.paymentUrl ?? null);

      if (billingType === "CREDIT_CARD") {
        window.location.href = "/dashboard";
      }
    } catch (error: unknown) {
      pushToast({
        type: "error",
        title: "Erro na assinatura",
        description: error instanceof Error ? error.message : "Não foi possível processar a assinatura.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-clinic-bg px-4 py-8 text-clinic-text">
      <div className="mx-auto grid max-w-6xl gap-8">
        <header className="flex items-center justify-between">
          <AppLogo />
          <a href="/login" className="rounded-md border border-clinic-border bg-clinic-surface px-4 py-2 text-sm font-medium">
            Entrar
          </a>
        </header>
        <section className="grid gap-8 rounded-md border border-clinic-border bg-clinic-surface p-5 shadow-sm md:p-8">
          <div className="grid gap-5 text-center">
            <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-clinic-border bg-clinic-bg px-4 py-2 text-sm text-clinic-muted">
              <Lock className="h-4 w-4 text-clinic-primary" />
              Plano mensal para clínicas integradas
            </p>
            <div>
              <h1 className="text-4xl font-bold tracking-normal text-clinic-text md:text-6xl">Dr. Agenda</h1>
              <p className="mt-3 text-base text-clinic-muted md:text-lg">Organize agenda, pacientes, médicos, financeiro e confirmações em uma única plataforma.</p>
            </div>
            <div className="flex items-end justify-center gap-2">
              <span className="text-5xl font-bold text-clinic-text md:text-7xl">{formatMoney(9990)}</span>
              <span className="pb-2 text-lg text-clinic-muted">/mês</span>
            </div>
            <p className="text-sm text-clinic-muted">Comece com 7 dias grátis. Ao assinar, seus dados continuam exatamente como foram cadastrados.</p>
          </div>
          <div className="grid gap-3 rounded-md border border-clinic-border bg-clinic-bg p-4 md:grid-cols-2">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-3 rounded-md border border-clinic-border bg-clinic-surface p-4">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-clinic-success" />
                <span className="text-sm text-clinic-text">{benefit}</span>
              </div>
            ))}
          </div>
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="grid gap-4">
              <div className="grid gap-3 rounded-md border border-clinic-border bg-clinic-surface p-5">
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-5 w-5 text-clinic-primary" />
                  <div>
                    <h2 className="font-semibold">Agenda inteligente</h2>
                    <p className="text-sm text-clinic-muted">Horários por período, médicos, especialidades, exames e confirmação.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-clinic-secondary" />
                  <div>
                    <h2 className="font-semibold">Equipe e pacientes</h2>
                    <p className="text-sm text-clinic-muted">Controle de funcionários, pacientes, convênios e histórico.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-clinic-accent" />
                  <div>
                    <h2 className="font-semibold">WhatsApp</h2>
                    <p className="text-sm text-clinic-muted">Mensagens de confirmação, lembrete e cobrança.</p>
                  </div>
                </div>
              </div>
              <div className="rounded-md border border-clinic-border bg-clinic-bg p-4 text-sm text-clinic-muted">
                O acesso completo é liberado durante o teste grátis e continua após a confirmação do pagamento.
              </div>
            </div>
            <div className="grid gap-4 rounded-md border border-clinic-border bg-clinic-surface p-5">
              <div className="grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setBillingType("CREDIT_CARD")}
                  className={`rounded-md border p-4 text-left ${billingType === "CREDIT_CARD" ? "border-clinic-primary bg-clinic-primary/5" : "border-clinic-border"}`}
                >
                  <CreditCard className="mb-3 h-5 w-5 text-clinic-primary" />
                  <p className="font-semibold">Cartão de crédito</p>
                  <p className="mt-1 text-sm text-clinic-muted">Pagamento online e recorrente.</p>
                </button>
                <button
                  type="button"
                  onClick={() => setBillingType("BOLETO")}
                  className={`rounded-md border p-4 text-left ${billingType === "BOLETO" ? "border-clinic-warning bg-clinic-warning/10" : "border-clinic-border"}`}
                >
                  <FileText className="mb-3 h-5 w-5 text-clinic-warning" />
                  <p className="font-semibold">Boleto bancário</p>
                  <p className="mt-1 text-sm text-clinic-muted">Gere o boleto pelo Asaas.</p>
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1 text-sm">Nome<input value={form.name} onChange={(event) => update("name", event.target.value)} className="rounded-md border border-clinic-border px-3 py-2" /></label>
                <label className="grid gap-1 text-sm">Email<input value={form.email} onChange={(event) => update("email", event.target.value)} className="rounded-md border border-clinic-border px-3 py-2" /></label>
                <label className="grid gap-1 text-sm">CPF/CNPJ<input value={form.cpfCnpj} onChange={(event) => update("cpfCnpj", event.target.value)} className="rounded-md border border-clinic-border px-3 py-2" /></label>
                <label className="grid gap-1 text-sm">Telefone<input value={form.phone} onChange={(event) => update("phone", event.target.value)} className="rounded-md border border-clinic-border px-3 py-2" /></label>
                <label className="grid gap-1 text-sm">CEP<input value={form.postalCode} onChange={(event) => update("postalCode", event.target.value)} className="rounded-md border border-clinic-border px-3 py-2" /></label>
                <label className="grid gap-1 text-sm">Número<input value={form.addressNumber} onChange={(event) => update("addressNumber", event.target.value)} className="rounded-md border border-clinic-border px-3 py-2" /></label>
              </div>
              {billingType === "CREDIT_CARD" ? (
                <div className="grid gap-3 rounded-md border border-clinic-border bg-clinic-bg p-4 md:grid-cols-2">
                  <label className="grid gap-1 text-sm md:col-span-2">Nome no cartão<input value={form.holderName} onChange={(event) => update("holderName", event.target.value)} className="rounded-md border border-clinic-border px-3 py-2" /></label>
                  <label className="grid gap-1 text-sm md:col-span-2">Número do cartão<input value={form.number} onChange={(event) => update("number", event.target.value)} className="rounded-md border border-clinic-border px-3 py-2" /></label>
                  <label className="grid gap-1 text-sm">Mês<input value={form.expiryMonth} onChange={(event) => update("expiryMonth", event.target.value)} placeholder="MM" className="rounded-md border border-clinic-border px-3 py-2" /></label>
                  <label className="grid gap-1 text-sm">Ano<input value={form.expiryYear} onChange={(event) => update("expiryYear", event.target.value)} placeholder="AAAA" className="rounded-md border border-clinic-border px-3 py-2" /></label>
                  <label className="grid gap-1 text-sm">CVV<input value={form.ccv} onChange={(event) => update("ccv", event.target.value)} className="rounded-md border border-clinic-border px-3 py-2" /></label>
                </div>
              ) : null}
              <button
                type="button"
                onClick={submit}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-clinic-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {billingType === "BOLETO" ? "Gerar boleto" : "Pagar com cartão"}
                <ArrowRight className="h-4 w-4" />
              </button>
              {paymentUrl !== null ? (
                <a
                  href={paymentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-clinic-border px-5 py-3 text-sm font-semibold"
                >
                  Abrir boleto
                  <ArrowRight className="h-4 w-4" />
                </a>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default SubscriptionPage;
