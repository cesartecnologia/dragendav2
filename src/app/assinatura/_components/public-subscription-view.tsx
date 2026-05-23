import {
  CheckCircle2,
  CreditCard,
  FileText,
  HeartPulse,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import Link from "next/link";
import { AppLogo } from "../../../components/layout/AppLogo";
import { PublicCheckoutButton } from "./public-checkout-button";

type PublicSubscriptionViewProps = {
  source?: "subscription" | "login";
};

const features = [
  "Agenda, pacientes e equipe em um só lugar.",
  "Cadastros e agendamentos sem limite.",
  "Relatórios e financeiro para acompanhar a clínica.",
  "Acesso liberado após a confirmação do pagamento.",
] as const;

const methods = [
  {
    title: "Cartão de crédito",
    description: "Assinatura online com confirmação rápida.",
    buttonLabel: "Pagar com cartão",
    icon: CreditCard,
    buttonVariant: "default" as const,
    accent: "bg-sky-500",
    iconBg: "bg-sky-100 text-sky-700",
    paymentMethod: "credit_card" as const,
  },
  {
    title: "Boleto bancário",
    description: "Gere o boleto pelo Asaas e finalize com segurança.",
    buttonLabel: "Gerar boleto",
    icon: FileText,
    buttonVariant: "outline" as const,
    accent: "bg-amber-500",
    iconBg: "bg-amber-100 text-amber-700",
    paymentMethod: "boleto" as const,
  },
] as const;

export const PublicSubscriptionView = ({
  source = "subscription",
}: PublicSubscriptionViewProps): JSX.Element => {
  const description =
    source === "login"
      ? "Assine o plano e finalize o cadastro da clínica com pagamento seguro pelo Asaas."
      : "Escolha a forma de pagamento e conclua sua assinatura pelo Asaas.";

  return (
    <div className="w-full">
      <div className="mx-auto flex w-full flex-col gap-4 sm:gap-6">
        <header className="flex items-center justify-between rounded-3xl border border-white/80 bg-white/95 px-4 py-3 shadow-[0_18px_50px_rgba(14,116,144,0.08)] backdrop-blur sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <AppLogo className="h-10 w-10" />
            <span className="text-lg font-bold tracking-tight text-slate-950">Dr. Agenda</span>
          </Link>

          <Link
            href="/login"
            className="rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-900 transition hover:bg-sky-50"
          >
            Área do cliente
          </Link>
        </header>

        <section className="overflow-hidden rounded-[30px] border border-sky-100 bg-white shadow-[0_28px_90px_rgba(14,116,144,0.12)]">
          <div className="relative overflow-hidden bg-gradient-to-br from-sky-50 via-white to-cyan-50 px-6 py-8 sm:px-8 sm:py-10">
            <div className="absolute right-6 top-6 hidden h-20 w-20 items-center justify-center rounded-[24px] bg-sky-500/15 text-sky-600 lg:flex">
              <HeartPulse className="h-10 w-10" />
            </div>
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-bold text-sky-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                Assinatura mensal
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl">Plano Premium Dr. Agenda</h1>
                <p className="mx-auto max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">{description}</p>
              </div>
              <div className="pt-1">
                <div className="flex flex-wrap items-end justify-center gap-2 text-slate-950">
                  <span className="text-5xl font-bold tracking-tight sm:text-7xl">R$ 99,90</span>
                  <span className="pb-2 text-sm font-medium text-slate-500 sm:text-base">/mês</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8 px-6 py-8 sm:px-8">
            <div className="grid gap-3 rounded-3xl border border-sky-100 bg-sky-50/70 p-4 sm:p-6 md:grid-cols-2">
              {features.map((feature) => (
                <div key={feature} className="flex min-h-[74px] items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_10px_24px_rgba(14,116,144,0.06)]">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-sky-500" />
                  <p className="text-sm leading-6 text-slate-700">{feature}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {methods.map((method) => {
                const Icon = method.icon;

                return (
                  <div
                    key={method.title}
                    className="flex h-full flex-col rounded-[28px] border border-sky-100 bg-white p-5 shadow-[0_18px_50px_rgba(14,116,144,0.08)] sm:p-6"
                  >
                    <div className={`h-1 w-full rounded-full ${method.accent}`} />
                    <div className="mt-5 flex flex-1 flex-col">
                      <div className="flex min-h-[104px] items-start gap-4">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${method.iconBg}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="space-y-1.5">
                          <h2 className="text-lg font-semibold tracking-tight text-slate-950">{method.title}</h2>
                          <p className="text-sm leading-6 text-slate-600">{method.description}</p>
                        </div>
                      </div>

                      <div className="mt-5 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm leading-6 text-slate-600">
                        Você será direcionado para o checkout seguro do Asaas para concluir a assinatura.
                      </div>

                      <div className="mt-6 flex flex-1 items-end">
                        <PublicCheckoutButton
                          paymentMethod={method.paymentMethod}
                          label={method.buttonLabel}
                          variant={method.buttonVariant}
                          className="h-12 w-full text-sm"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <div className="mx-auto flex items-center gap-2 text-sm text-slate-500">
          <Stethoscope className="h-4 w-4" />
          Gestão profissional para clínicas e consultórios, com pagamento protegido pelo Asaas.
        </div>
      </div>
    </div>
  );
};
