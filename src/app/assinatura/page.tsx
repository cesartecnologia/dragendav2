"use client";

import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  CheckCircle2,
  CreditCard,
  FileText,
  HeartPulse,
  Loader2,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
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

type Benefit = {
  title: string;
  description: string;
  icon: LucideIcon;
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

const benefits: Benefit[] = [
  {
    title: "Agenda completa",
    description: "Organize horários por médico, especialidade, período e capacidade.",
    icon: CalendarDays,
  },
  {
    title: "Pacientes e equipe",
    description: "Cadastros, histórico e permissões de acesso em um fluxo único.",
    icon: Users,
  },
  {
    title: "Gestão médica",
    description: "Médicos, CRM, fotos, períodos, férias, convênios e exames.",
    icon: Stethoscope,
  },
  {
    title: "Financeiro claro",
    description: "Recebimentos, relatórios e comprovantes sem planilhas soltas.",
    icon: BarChart3,
  },
  {
    title: "Acesso protegido",
    description: "Experimente a plataforma antes de escolher a melhor forma de pagamento.",
    icon: ShieldCheck,
  },
];

const formatDigits = (value: string): string => value.replace(/\D/g, "");

const InputField = ({
  label,
  value,
  onChange,
  placeholder,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}): JSX.Element => (
  <label className={`grid gap-1.5 text-sm font-medium text-slate-700 ${className}`}>
    {label}
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-10 rounded-md border border-sky-100 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
    />
  </label>
);

const SubscriptionPage = (): JSX.Element => {
  const [billingType, setBillingType] = useState<BillingType>("CREDIT_CARD");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [form, setForm] = useState<CheckoutForm>(initialForm);
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const pushToast = useUiStore((state) => state.pushToast);

  const update = (key: keyof CheckoutForm, value: string): void => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const openCheckout = (type: BillingType): void => {
    setBillingType(type);
    setPaymentUrl(null);
    setCheckoutOpen(true);
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
        description: billingType === "BOLETO" ? "Boleto gerado com sucesso." : "Pagamento enviado com sucesso.",
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
    <main className="min-h-screen overflow-hidden bg-[#eefafa] text-slate-950">
      <section className="relative px-4 py-6 md:px-8 lg:px-10">
        <div className="absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_18%_18%,rgba(20,184,166,0.20),transparent_34%),radial-gradient(circle_at_82%_8%,rgba(14,165,233,0.18),transparent_32%),linear-gradient(180deg,#f8ffff_0%,#eefafa_100%)]" />
        <div className="relative mx-auto max-w-7xl">
          <header className="flex items-center justify-between rounded-md border border-white/70 bg-white/75 px-4 py-3 shadow-sm backdrop-blur md:px-5">
            <div className="flex items-center gap-3">
              <AppLogo />
              <span className="hidden text-base font-bold text-slate-950 sm:inline">Dr. Agenda</span>
            </div>
            <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
              <a href="#beneficios" className="transition hover:text-sky-700">Benefícios</a>
              <a href="#preco" className="transition hover:text-sky-700">Preço</a>
              <a href="#checkout" className="transition hover:text-sky-700">Pagamento</a>
            </nav>
            <a href="/login" className="rounded-md border border-sky-100 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-sky-300">
              Entrar
            </a>
          </header>

          <div className="grid min-h-[calc(100vh-110px)] items-center gap-10 py-10 lg:grid-cols-[1fr_0.92fr] lg:py-16">
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-sky-100 bg-white px-3 py-2 text-sm font-semibold text-sky-800 shadow-sm">
                <Sparkles className="h-4 w-4" />
                Experimente agora e continue quando quiser
              </div>
              <h1 className="text-4xl font-bold leading-tight tracking-normal text-slate-950 md:text-6xl">
                Sua clínica organizada por {formatMoney(9990)}
                <span className="text-sky-700">/mês</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 md:text-lg">
                Agenda, pacientes, médicos, financeiro e relatórios em uma plataforma simples para a rotina da clínica.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => openCheckout("CREDIT_CARD")}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-sky-700 px-6 text-sm font-bold text-white shadow-lg shadow-sky-900/15 transition hover:bg-sky-800"
                >
                  <CreditCard className="h-4 w-4" />
                  Assinar com cartão
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => openCheckout("BOLETO")}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-sky-200 bg-white px-6 text-sm font-bold text-sky-900 shadow-sm transition hover:border-sky-400"
                >
                  <FileText className="h-4 w-4" />
                  Gerar boleto
                </button>
              </div>
              <div className="mt-7 grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
                {["Cadastros ilimitados", "Pagamento simples e seguro", "Sua clínica sempre organizada"].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-sky-600" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-5 rounded-[32px] bg-sky-300/20 blur-3xl" />
              <div className="relative rounded-md border border-white bg-white p-4 shadow-2xl shadow-sky-950/10">
                <div className="rounded-md border border-sky-200 bg-gradient-to-br from-sky-600 to-sky-400 p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-sky-50">Agenda de hoje</p>
                      <p className="mt-1 text-2xl font-bold">18 consultas</p>
                    </div>
                    <HeartPulse className="h-10 w-10 rounded-md bg-white/20 p-2 text-white" />
                  </div>
                  <div className="mt-5 grid gap-2">
                    {[
                      ["08:30", "Dra. Helena", "Cardiologia"],
                      ["09:00", "Dr. Marcos", "Dermatologia"],
                      ["09:00", "Dra. Camila", "Pediatria"],
                    ].map(([time, doctor, specialty]) => (
                      <div key={`${time}-${doctor}`} className="grid grid-cols-[56px_1fr] items-center gap-3 rounded-md bg-white/20 p-3">
                        <span className="rounded-md bg-white px-2 py-1 text-center text-xs font-bold text-sky-800">{time}</span>
                        <div>
                          <p className="text-sm font-semibold">{doctor}</p>
                          <p className="text-xs text-sky-50">{specialty}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-md border border-sky-100 bg-sky-50 p-4">
                    <p className="text-sm font-semibold text-sky-900">Confirmados</p>
                    <p className="mt-2 text-3xl font-bold text-sky-800">92%</p>
                  </div>
                  <div className="rounded-md border border-sky-100 bg-sky-50 p-4">
                    <p className="text-sm font-semibold text-sky-900">Recebimentos</p>
                    <p className="mt-2 text-3xl font-bold text-sky-800">R$ 8,4k</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="beneficios" className="px-4 py-12 md:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-normal text-slate-950 md:text-4xl">Tudo que a clínica precisa para operar melhor</h2>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Um sistema direto para organizar a operação, reduzir faltas e manter o controle financeiro.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <article key={benefit.title} className="rounded-md border border-sky-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-sky-950/5">
                  <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-md bg-sky-50 text-sky-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-950">{benefit.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{benefit.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="preco" className="px-4 py-12 md:px-8 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="rounded-md border border-sky-200 bg-gradient-to-br from-white to-sky-50 p-6 text-slate-950 shadow-xl shadow-sky-950/10 md:p-8">
            <p className="text-sm font-semibold text-sky-700">Plano mensal</p>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-5xl font-bold md:text-6xl">{formatMoney(9990)}</span>
              <span className="pb-2 text-lg text-slate-500">/mês</span>
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-600">
              Experimente a plataforma, organize sua clínica e continue com tudo pronto quando assinar.
            </p>
            <div className="mt-6 grid gap-3 text-sm text-slate-700">
              {["Agenda, pacientes e equipe", "Relatórios e financeiro", "Comprovantes organizados", "Suporte para acompanhar a operação"].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-sky-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div id="checkout" className="grid gap-4 md:grid-cols-2">
            <article className="flex flex-col rounded-md border border-sky-200 bg-white p-6 shadow-sm">
              <div className="mb-5 h-1 rounded-full bg-sky-700" />
              <CreditCard className="h-10 w-10 rounded-md bg-sky-50 p-2 text-sky-700" />
              <h3 className="mt-5 text-2xl font-bold text-slate-950">Cartão de crédito</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Pagamento online mensal. O acesso continua automaticamente após a confirmação.
              </p>
              <button
                type="button"
                onClick={() => openCheckout("CREDIT_CARD")}
                className="mt-auto inline-flex h-12 items-center justify-center gap-2 rounded-md bg-sky-700 px-5 text-sm font-bold text-white transition hover:bg-sky-800"
              >
                Assinar com cartão
                <ArrowRight className="h-4 w-4" />
              </button>
            </article>
            <article className="flex flex-col rounded-md border border-sky-200 bg-white p-6 shadow-sm">
              <div className="mb-5 h-1 rounded-full bg-sky-500" />
              <FileText className="h-10 w-10 rounded-md bg-sky-50 p-2 text-sky-700" />
              <h3 className="mt-5 text-2xl font-bold text-slate-950">Boleto bancário</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Gere o boleto e pague com tranquilidade. Após a confirmação, a assinatura fica ativa.
              </p>
              <button
                type="button"
                onClick={() => openCheckout("BOLETO")}
                className="mt-auto inline-flex h-12 items-center justify-center gap-2 rounded-md border border-sky-200 bg-white px-5 text-sm font-bold text-sky-900 transition hover:border-sky-400"
              >
                Gerar boleto
                <ArrowRight className="h-4 w-4" />
              </button>
            </article>
          </div>
        </div>
      </section>

      {checkoutOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-sky-900/35 p-4 backdrop-blur-sm" onMouseDown={() => setCheckoutOpen(false)} role="presentation">
          <section
            aria-modal="true"
            role="dialog"
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-md bg-white shadow-2xl shadow-slate-950/30"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-sky-100 bg-white px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-sky-700">{billingType === "BOLETO" ? "Boleto bancário" : "Cartão de crédito"}</p>
                <h2 className="mt-1 text-2xl font-bold text-slate-950">
                  {billingType === "BOLETO" ? "Gerar boleto da assinatura" : "Assinar o Dr. Agenda"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">Plano mensal de {formatMoney(9990)} para manter sua clínica completa.</p>
              </div>
              <button type="button" onClick={() => setCheckoutOpen(false)} className="rounded-md border border-sky-100 p-2 text-slate-500 transition hover:text-slate-900" aria-label="Fechar">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <InputField label="Nome" value={form.name} onChange={(value) => update("name", value)} />
                <InputField label="Email" value={form.email} onChange={(value) => update("email", value)} />
                <InputField label="CPF/CNPJ" value={form.cpfCnpj} onChange={(value) => update("cpfCnpj", value)} />
                <InputField label="Telefone" value={form.phone} onChange={(value) => update("phone", value)} />
                <InputField label="CEP" value={form.postalCode} onChange={(value) => update("postalCode", value)} />
                <InputField label="Número" value={form.addressNumber} onChange={(value) => update("addressNumber", value)} />
              </div>

              {billingType === "CREDIT_CARD" ? (
                <div className="grid gap-3 rounded-md border border-sky-100 bg-sky-50/60 p-4 md:grid-cols-3">
                  <InputField label="Nome no cartão" value={form.holderName} onChange={(value) => update("holderName", value)} />
                  <InputField className="md:col-span-2" label="Número do cartão" value={form.number} onChange={(value) => update("number", value)} />
                  <InputField label="Mês" value={form.expiryMonth} onChange={(value) => update("expiryMonth", value)} placeholder="MM" />
                  <InputField label="Ano" value={form.expiryYear} onChange={(value) => update("expiryYear", value)} placeholder="AAAA" />
                  <InputField label="CVV" value={form.ccv} onChange={(value) => update("ccv", value)} />
                </div>
              ) : (
                <div className="rounded-md border border-sky-100 bg-sky-50 p-4 text-sm leading-6 text-sky-900">
                  O boleto será gerado com segurança. Após a confirmação do pagamento, sua assinatura fica ativa.
                </div>
              )}

              <div className="sticky bottom-0 -mx-4 -mb-4 flex flex-col gap-3 border-t border-sky-100 bg-white px-4 py-4 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={submit}
                  disabled={loading}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-sky-700 px-5 text-sm font-bold text-white transition hover:bg-sky-800 disabled:opacity-60"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {billingType === "BOLETO" ? "Gerar boleto" : "Pagar com cartão"}
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCheckoutOpen(false)}
                  disabled={loading}
                  className="inline-flex h-12 items-center justify-center rounded-md border border-sky-100 px-5 text-sm font-semibold text-slate-700 transition hover:border-sky-300"
                >
                  Cancelar
                </button>
                {paymentUrl !== null ? (
                  <a
                    href={paymentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-sky-200 px-5 text-sm font-bold text-sky-900 transition hover:border-sky-400"
                  >
                    Abrir boleto
                    <ArrowRight className="h-4 w-4" />
                  </a>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
};

export default SubscriptionPage;
