import {
  CalendarCheck,
  CheckCircle2,
  HeartPulse,
  LockKeyhole,
  ShieldCheck,
  Stethoscope,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { AppLogo } from "../../../components/layout/AppLogo";

type PublicSubscriptionViewProps = {
  source?: "subscription" | "login";
};

const features = [
  "Agenda organizada para médicos, pacientes e equipe.",
  "Cadastros e agendamentos ilimitados.",
  "Relatórios e financeiro para acompanhar a operação.",
  "Comprovantes, histórico e rotina da clínica em um só lugar.",
] as const;

export const PublicSubscriptionView = ({
  source = "subscription",
}: PublicSubscriptionViewProps): JSX.Element => {
  const description =
    source === "login"
      ? "Assine o plano e finalize o cadastro da clínica com pagamento seguro pelo Asaas."
      : "Sistema completo para clínicas que precisam controlar agenda, pacientes, equipe e financeiro com mais clareza.";

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

        <section className="overflow-hidden rounded-[32px] border border-sky-100 bg-white shadow-[0_28px_90px_rgba(14,116,144,0.12)]">
          <div className="grid gap-8 bg-gradient-to-br from-sky-50 via-white to-cyan-50 px-6 py-8 sm:px-8 sm:py-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <div className="space-y-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-bold text-sky-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                Assinatura mensal
              </div>

              <div className="space-y-4">
                <h1 className="max-w-xl text-4xl font-bold tracking-tight text-slate-950 sm:text-6xl">
                  Dr. Agenda Premium
                </h1>
                <p className="max-w-xl text-base leading-8 text-slate-600">{description}</p>
              </div>

              <div className="rounded-[28px] border border-sky-100 bg-white p-5 shadow-[0_18px_45px_rgba(14,116,144,0.08)]">
                <p className="text-sm font-semibold text-slate-500">Plano completo</p>
                <div className="mt-2 flex flex-wrap items-end gap-2 text-slate-950">
                  <span className="text-5xl font-bold tracking-tight sm:text-6xl">R$ 99,90</span>
                  <span className="pb-2 text-sm font-medium text-slate-500">/mês</span>
                </div>
                <Link
                  href="/assinatura/iniciar"
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-sky-900/15 transition hover:bg-sky-700"
                >
                  Assinar agora
                  <LockKeyhole className="h-4 w-4" />
                </Link>
                <p className="mt-3 text-center text-xs font-medium text-slate-500">
                  Pagamento seguro pelo Asaas.
                </p>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/90 bg-white p-5 shadow-[0_24px_70px_rgba(14,116,144,0.14)]">
              <div className="rounded-[24px] bg-gradient-to-br from-sky-500 to-cyan-400 p-5 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white/85">Agenda de hoje</p>
                    <p className="mt-2 text-4xl font-bold">18 consultas</p>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                    <HeartPulse className="h-8 w-8" />
                  </div>
                </div>

                <div className="mt-6 grid gap-3">
                  {[
                    ["08:30", "Dra. Helena", "Cardiologia"],
                    ["09:00", "Dr. Marcos", "Dermatologia"],
                    ["09:00", "Dra. Camila", "Pediatria"],
                  ].map(([time, doctor, specialty]) => (
                    <div key={`${time}-${doctor}`} className="flex items-center gap-4 rounded-2xl bg-white/20 px-4 py-3">
                      <span className="rounded-xl bg-white px-3 py-2 text-sm font-bold text-sky-900">{time}</span>
                      <div>
                        <p className="font-bold">{doctor}</p>
                        <p className="text-sm text-white/85">{specialty}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                  <CalendarCheck className="h-5 w-5 text-sky-600" />
                  <p className="mt-3 text-sm font-semibold text-slate-600">Confirmados</p>
                  <p className="mt-1 text-3xl font-bold text-sky-900">92%</p>
                </div>
                <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                  <TrendingUp className="h-5 w-5 text-sky-600" />
                  <p className="mt-3 text-sm font-semibold text-slate-600">Recebimentos</p>
                  <p className="mt-1 text-3xl font-bold text-sky-900">R$ 8,4k</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 border-t border-sky-100 bg-white px-6 py-7 sm:px-8 md:grid-cols-2">
            {features.map((feature) => (
              <div key={feature} className="flex min-h-[72px] items-center gap-3 rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-sky-500" />
                <p className="text-sm leading-6 text-slate-700">{feature}</p>
              </div>
            ))}
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
