"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CalendarDays, CheckCircle2, HeartPulse, Loader2, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AppLogo } from "../../../components/layout/AppLogo";
import { getAuthErrorMessage, loginWithEmail } from "../../../lib/firebase/auth";
import { useAuthStore } from "../../../lib/stores/authStore";

const schema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Informe a senha"),
});

type LoginFormValues = z.infer<typeof schema>;

const LoginPage = (): JSX.Element => {
  const router = useRouter();
  const setFirebaseUser = useAuthStore((state) => state.setFirebaseUser);
  const setLoading = useAuthStore((state) => state.setLoading);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues): Promise<void> => {
    try {
      const result = await loginWithEmail(values);
      setFirebaseUser(result.user);
      setLoading(false);
      const params = new URLSearchParams(window.location.search);
      router.push(params.get("redirect") ?? "/dashboard");
    } catch (error: unknown) {
      setError("root", { message: getAuthErrorMessage(error) });
    }
  };

  return (
    <main className="min-h-screen bg-[#f5fbff] px-4 py-4 text-slate-950 sm:px-6 sm:py-6">
      <div className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-6xl flex-col gap-5">
        <header className="flex items-center justify-between rounded-[28px] border border-white/70 bg-white/95 px-4 py-3 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <AppLogo className="h-10 w-10" />
            <span className="text-lg font-bold tracking-tight text-slate-950">Dr. Agenda</span>
          </Link>
          <Link
            href="/assinatura"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Assinatura
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="hidden lg:block">
            <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.06)]">
              <div className="rounded-[26px] border border-sky-100 bg-sky-50/80 p-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white px-3 py-1 text-xs font-semibold text-sky-800">
                  <HeartPulse className="h-3.5 w-3.5" />
                  Rotina da clínica
                </div>
                <h1 className="mt-5 max-w-lg text-5xl font-bold leading-tight tracking-tight text-slate-950">
                  Acesse sua clínica com tudo no lugar.
                </h1>
                <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
                  Agenda, pacientes, médicos e financeiro em uma experiência simples para a equipe inteira trabalhar melhor.
                </p>

                <div className="mt-7 grid gap-3">
                  {[
                    "Agenda do dia com visão clara",
                    "Atendimentos organizados por status",
                    "Dados da clínica sempre à mão",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
                      <CheckCircle2 className="h-5 w-5 text-sky-500" />
                      <span className="text-sm font-medium text-slate-700">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-7 rounded-[24px] border border-sky-100 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-600">Próximos atendimentos</p>
                      <p className="mt-1 text-3xl font-bold text-slate-950">12 confirmados</p>
                    </div>
                    <CalendarDays className="h-12 w-12 rounded-2xl bg-sky-50 p-3 text-sky-700" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mx-auto w-full max-w-md rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] md:p-8"
          >
            <div className="mb-8 flex flex-col items-center text-center">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                <LockKeyhole className="h-6 w-6" />
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800">
                <Sparkles className="h-3.5 w-3.5" />
                Área do cliente
              </div>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">Entrar na clínica</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Use seu email e senha para continuar seus atendimentos.
              </p>
            </div>

            <div className="grid gap-4">
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Email
                <input
                  type="email"
                  {...register("email")}
                  className="h-11 rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                />
                {errors.email?.message !== undefined ? (
                  <span className="text-xs text-clinic-danger">
                    {errors.email.message}
                  </span>
                ) : null}
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Senha
                <input
                  type="password"
                  {...register("password")}
                  className="h-11 rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                />
                {errors.password?.message !== undefined ? (
                  <span className="text-xs text-clinic-danger">
                    {errors.password.message}
                  </span>
                ) : null}
              </label>
            </div>

            {errors.root?.message !== undefined ? (
              <p className="mt-4 rounded-2xl bg-clinic-danger/10 p-3 text-sm text-clinic-danger">
                {errors.root.message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 text-sm font-bold text-white shadow-lg shadow-sky-900/15 transition hover:bg-sky-700 disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Entrar
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="mt-5 flex items-center justify-between text-sm">
              <Link href="/forgot-password" className="font-medium text-sky-700 hover:text-sky-900">
                Esqueci minha senha
              </Link>
              <Link href="/register" className="font-medium text-sky-700 hover:text-sky-900">
                Criar conta
              </Link>
            </div>

            <div className="mt-7 flex items-center gap-2 rounded-2xl border border-sky-100 bg-sky-50 p-3 text-xs font-medium text-sky-900">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              Ambiente protegido para a equipe da clínica.
            </div>
          </form>
        </section>
      </div>
    </main>
  );
};

export default LoginPage;
