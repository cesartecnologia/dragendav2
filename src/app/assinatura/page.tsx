import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  HeartPulse,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { AppLogo } from "../../components/layout/AppLogo";
import { formatMoney } from "../../lib/utils/money";

const benefits = [
  {
    title: "Agenda inteligente",
    description: "Organize consultas, retornos, exames e procedimentos em uma visão clara.",
    icon: CalendarDays,
  },
  {
    title: "Pacientes e médicos",
    description: "Cadastros completos para acompanhar atendimentos com mais controle.",
    icon: UsersRound,
  },
  {
    title: "Equipe conectada",
    description: "Recepção, administração e profissionais trabalhando no mesmo fluxo.",
    icon: UserRoundCheck,
  },
  {
    title: "Gestão financeira",
    description: "Acompanhe recebimentos, status de pagamento e resultados da clínica.",
    icon: ClipboardList,
  },
] as const;

const included = [
  "7 dias grátis para testar com sua própria clínica.",
  "Agenda, pacientes, médicos e equipe em um só lugar.",
  "Cadastros e agendamentos sem limite.",
  "Seus dados continuam salvos quando você assinar.",
] as const;

const SubscriptionPage = (): JSX.Element => {
  return (
    <main className="min-h-screen overflow-hidden bg-[#eefaff] text-slate-950">
      <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,#baeaff_0%,rgba(186,234,255,0.55)_32%,rgba(238,250,255,0)_68%)]" />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6">
        <header className="flex items-center justify-between rounded-[28px] border border-white/80 bg-white/90 px-4 py-3 shadow-[0_18px_50px_rgba(14,116,144,0.10)] backdrop-blur sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <AppLogo className="h-10 w-10" />
            <span className="text-lg font-bold tracking-tight text-slate-950">Dr. Agenda</span>
          </Link>

          <Link
            href="/login"
            className="rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-800 transition hover:border-sky-300 hover:bg-sky-50"
          >
            Área do cliente
          </Link>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
          <div className="rounded-[34px] border border-white/80 bg-white/95 p-6 shadow-[0_24px_90px_rgba(14,116,144,0.14)] sm:p-8 lg:p-10">
            <div className="flex h-full flex-col justify-between gap-8">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-800">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Plano Premium
                </div>

                <div className="space-y-4">
                  <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-slate-950 sm:text-6xl">
                    Sua clínica organizada desde o primeiro atendimento
                  </h1>
                  <p className="max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
                    Comece com 7 dias grátis, cadastre sua equipe e mantenha tudo salvo ao continuar no plano mensal.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {included.map((item) => (
                    <div key={item} className="flex min-h-[70px] items-center gap-3 rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-sky-500" />
                      <p className="text-sm leading-6 text-slate-700">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex h-14 min-h-14 items-center justify-center gap-2 rounded-2xl bg-sky-600 px-7 py-4 text-sm font-bold text-white shadow-lg shadow-sky-900/20 transition hover:bg-sky-700"
                >
                  <Sparkles className="h-4 w-4" />
                  Começar teste grátis
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/register"
                  className="inline-flex h-14 min-h-14 items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-white px-7 py-4 text-sm font-bold text-sky-800 transition hover:border-sky-300 hover:bg-sky-50"
                >
                  Assinar depois do cadastro
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          <aside className="rounded-[34px] border border-sky-100 bg-white p-5 shadow-[0_24px_90px_rgba(14,116,144,0.12)] sm:p-6">
            <div className="rounded-[28px] bg-gradient-to-br from-sky-500 to-cyan-400 p-5 text-white shadow-[0_20px_50px_rgba(14,165,233,0.28)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-sky-50">Assinatura mensal</p>
                  <div className="mt-3 flex flex-wrap items-end gap-2">
                    <span className="text-5xl font-bold tracking-tight">{formatMoney(9990)}</span>
                    <span className="pb-1 text-sm font-semibold text-sky-50">/mês</span>
                  </div>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                  <HeartPulse className="h-7 w-7" />
                </div>
              </div>

              <div className="mt-7 space-y-3">
                <div className="rounded-2xl bg-white/20 p-4">
                  <p className="text-sm font-semibold text-sky-50">Agenda de hoje</p>
                  <p className="mt-1 text-3xl font-bold">18 consultas</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white/20 p-4">
                    <p className="text-sm font-semibold text-sky-50">Confirmados</p>
                    <p className="mt-2 text-3xl font-bold">92%</p>
                  </div>
                  <div className="rounded-2xl bg-white/20 p-4">
                    <p className="text-sm font-semibold text-sky-50">Recebimentos</p>
                    <p className="mt-2 text-3xl font-bold">R$ 8,4k</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;

                return (
                  <div key={benefit.title} className="flex items-start gap-4 rounded-2xl border border-sky-100 bg-sky-50/60 p-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-sky-700 shadow-sm">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-950">{benefit.title}</h2>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{benefit.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        </section>

        <div className="mx-auto flex items-center gap-2 text-sm font-medium text-slate-500">
          <Stethoscope className="h-4 w-4" />
          Gestão profissional para clínicas e consultórios.
          <BadgeCheck className="h-4 w-4 text-sky-500" />
        </div>
      </div>
    </main>
  );
};

export default SubscriptionPage;
