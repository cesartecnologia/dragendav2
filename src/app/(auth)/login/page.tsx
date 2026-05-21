"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CalendarDays, CheckCircle2, HeartPulse, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
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
    <main className="min-h-screen bg-[#eef7ff] text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[1.02fr_0.98fr]">
        <section className="relative hidden overflow-hidden px-10 py-8 lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(14,165,233,0.24),transparent_34%),radial-gradient(circle_at_80%_70%,rgba(125,211,252,0.28),transparent_36%),linear-gradient(135deg,#f8fcff_0%,#e7f6ff_100%)]" />
          <div className="relative flex h-full flex-col">
            <div className="flex items-center gap-3">
              <AppLogo />
              <span className="text-lg font-bold">Dr. Agenda</span>
            </div>

            <div className="my-auto max-w-xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-sky-100 bg-white px-3 py-2 text-sm font-semibold text-sky-800 shadow-sm">
                <HeartPulse className="h-4 w-4" />
                Clínica no controle, atendimento mais leve
              </div>
              <h1 className="text-5xl font-bold leading-tight tracking-normal">
                Acesse sua rotina médica com tudo no lugar.
              </h1>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                Agenda, pacientes, médicos e financeiro em uma experiência simples para a equipe inteira trabalhar melhor.
              </p>

              <div className="mt-8 grid gap-3">
                {[
                  "Agenda do dia com visão clara",
                  "Confirmações e lembretes organizados",
                  "Dados da clínica sempre à mão",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-md border border-white bg-white/70 p-3 shadow-sm backdrop-blur">
                    <CheckCircle2 className="h-5 w-5 text-sky-600" />
                    <span className="text-sm font-medium text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-white bg-white/80 p-4 shadow-xl shadow-sky-950/10 backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-600">Próximos atendimentos</p>
                  <p className="mt-1 text-2xl font-bold">12 confirmados</p>
                </div>
                <CalendarDays className="h-10 w-10 rounded-md bg-sky-50 p-2 text-sky-700" />
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-8">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="w-full max-w-md rounded-md border border-sky-100 bg-white p-6 shadow-2xl shadow-sky-950/10 md:p-8"
          >
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <AppLogo />
              <span className="text-lg font-bold">Dr. Agenda</span>
            </div>
            <div className="mb-7">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-md bg-sky-50 text-sky-700">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <h1 className="text-3xl font-bold tracking-normal text-slate-950">Entrar na clínica</h1>
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
                  className="h-11 rounded-md border border-sky-100 px-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
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
                  className="h-11 rounded-md border border-sky-100 px-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                />
                {errors.password?.message !== undefined ? (
                  <span className="text-xs text-clinic-danger">
                    {errors.password.message}
                  </span>
                ) : null}
              </label>
            </div>

            {errors.root?.message !== undefined ? (
              <p className="mt-4 rounded-md bg-clinic-danger/10 p-3 text-sm text-clinic-danger">
                {errors.root.message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-sky-600 px-4 text-sm font-bold text-white shadow-lg shadow-sky-900/15 transition hover:bg-sky-700 disabled:opacity-60"
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

            <div className="mt-7 flex items-center gap-2 rounded-md border border-sky-100 bg-sky-50 p-3 text-xs font-medium text-sky-900">
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
