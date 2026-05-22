"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  CalendarRange,
  KeyRound,
  Loader2,
  LogIn,
  Mail,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AppLogo } from "../../../components/layout/AppLogo";
import { getAuthErrorMessage, loginWithEmail } from "../../../lib/firebase/auth";
import { useAuthStore } from "../../../lib/stores/authStore";

const schema = z.object({
  email: z.string().trim().min(1, "E-mail é obrigatório").email("E-mail inválido"),
  password: z.string().trim().min(1, "Informe a senha"),
});

type LoginFormValues = z.infer<typeof schema>;

const highlights = [
  {
    icon: CalendarRange,
    title: "Agenda mais organizada",
    description: "Controle horários, encaixes e atendimentos com mais clareza.",
  },
  {
    icon: UsersRound,
    title: "Equipe integrada",
    description: "Profissionais conectados em uma rotina simples e profissional.",
  },
  {
    icon: ShieldCheck,
    title: "Acesso seguro",
    description: "Permissões definidas para cada função da clínica.",
  },
] as const;

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
    <main className="min-h-screen bg-[#f5f5f5] px-3 py-4 text-slate-950 sm:px-5 sm:py-6">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6">
        <header className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-5">
          <Link href="/" className="flex items-center gap-3">
            <AppLogo className="h-10 w-10" />
            <span className="text-lg font-bold tracking-tight text-slate-950">Dr. Agenda</span>
          </Link>
          <Link
            href="/assinatura"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <LogIn className="h-4 w-4" />
            Ver plano
          </Link>
        </header>

        <div className="grid gap-5 lg:grid-cols-2 lg:items-stretch">
          <section className="flex h-full min-h-[540px] flex-col rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-6">
            <div className="space-y-2 text-center">
              <h1 className="mx-auto max-w-xl text-[2rem] font-bold tracking-[-0.03em] text-slate-950 sm:text-[2.15rem]">
                Acesse sua conta
              </h1>
              <p className="mx-auto max-w-xl text-sm leading-6 text-slate-600 sm:text-[15px]">
                Entre para acessar o Dr. Agenda com praticidade e segurança.
              </p>
            </div>

            <div className="mt-6 grid flex-1 content-center gap-3">
              {highlights.map(({ icon: Icon, title, description }) => (
                <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-white p-2 text-blue-600 shadow-sm">
                      <Icon className="h-[18px] w-[18px]" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
                      <p className="text-sm leading-5 text-slate-600">{description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="flex h-full items-stretch">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex h-full min-h-[540px] w-full flex-col overflow-hidden rounded-[24px] border border-sky-100 bg-white shadow-[0_24px_80px_rgba(14,165,233,0.10)]"
            >
              <div className="space-y-2 p-6 pb-4">
                <h2 className="text-2xl font-semibold tracking-[-0.02em] text-slate-950">
                  Entrar
                </h2>
                <p className="text-sm leading-6 text-slate-600">
                  Use seu e-mail e senha para entrar na sua conta.
                </p>
              </div>

              <div className="flex-1 space-y-4 px-6">
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  E-mail
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-sky-600" />
                    <input
                      type="email"
                      placeholder="voce@clinica.com"
                      {...register("email")}
                      className="h-12 w-full rounded-xl border border-slate-200 pl-11 pr-3 text-[15px] outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                    />
                  </div>
                  {errors.email?.message !== undefined ? (
                    <span className="text-xs text-clinic-danger">{errors.email.message}</span>
                  ) : null}
                </label>

                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Senha
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-sky-600" />
                    <input
                      type="password"
                      placeholder="Digite sua senha"
                      {...register("password")}
                      className="h-12 w-full rounded-xl border border-slate-200 pl-11 pr-3 text-[15px] outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                    />
                  </div>
                  {errors.password?.message !== undefined ? (
                    <span className="text-xs text-clinic-danger">{errors.password.message}</span>
                  ) : null}
                </label>

                <div className="flex justify-end">
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-sky-700 transition hover:text-sky-800"
                  >
                    Esqueceu sua senha?
                  </Link>
                </div>

                {errors.root?.message !== undefined ? (
                  <p className="rounded-xl bg-clinic-danger/10 p-3 text-sm text-clinic-danger">
                    {errors.root.message}
                  </p>
                ) : null}
              </div>

              <div className="p-6 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 text-sm font-bold text-white transition hover:bg-sky-700 disabled:opacity-60"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  Entrar
                </button>
                <div className="mt-4 text-center text-sm text-slate-600">
                  Ainda não tem acesso?{" "}
                  <Link href="/assinatura" className="font-semibold text-sky-700 hover:text-sky-900">
                    Ver plano
                  </Link>
                </div>
              </div>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
};

export default LoginPage;
