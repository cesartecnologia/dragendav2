"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AppLogo } from "../../components/layout/AppLogo";
import { bootstrapMasterAccess } from "../../lib/auth/sessionClient";
import {
  getAuthErrorMessage,
  loginWithEmail,
  registerWithEmail,
} from "../../lib/firebase/auth";
import { useAuthStore } from "../../lib/stores/authStore";

const schema = z.object({
  name: z.string().min(2, "Informe seu nome"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  clinicName: z.string().min(2, "Informe a clínica"),
  accessCode: z.string().optional(),
});

type MasterFormValues = z.infer<typeof schema>;

const fieldClass =
  "h-11 rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100";

const isEmailAlreadyInUse = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === "auth/email-already-in-use";

const MasterPage = (): JSX.Element => {
  const router = useRouter();
  const setFirebaseUser = useAuthStore((state) => state.setFirebaseUser);
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<MasterFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      clinicName: "Clínica Master",
      accessCode: "",
    },
  });

  const onSubmit = async (values: MasterFormValues): Promise<void> => {
    try {
      let authResult;

      try {
        authResult = await registerWithEmail({
          name: values.name,
          email: values.email,
          password: values.password,
        });
      } catch (error: unknown) {
        if (!isEmailAlreadyInUse(error)) {
          throw error;
        }

        authResult = await loginWithEmail({
          email: values.email,
          password: values.password,
        });
      }

      const user = await bootstrapMasterAccess(authResult.user, {
        clinicId: crypto.randomUUID(),
        ownerName: values.name,
        ownerEmail: values.email,
        clinicName: values.clinicName,
        accessCode: values.accessCode?.trim() === "" ? undefined : values.accessCode,
      });

      setFirebaseUser(authResult.user);
      setUser(user);
      setLoading(false);
      router.push("/painel");
    } catch (error: unknown) {
      setError("root", {
        message:
          error instanceof Error
            ? error.message
            : getAuthErrorMessage(error),
      });
    }
  };

  return (
    <main className="min-h-screen bg-[#f5fbff] px-4 py-4 text-slate-950 sm:px-6 sm:py-6">
      <div className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-5xl flex-col gap-5">
        <header className="flex items-center justify-between rounded-[28px] border border-white/70 bg-white/95 px-4 py-3 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <AppLogo className="h-10 w-10" />
            <span className="text-lg font-bold tracking-tight text-slate-950">Dr. Agenda</span>
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Login
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[30px] border border-sky-100 bg-white p-6 shadow-[0_24px_80px_rgba(14,165,233,0.08)] md:p-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-950">
              Acesso master
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Entrada interna para testes e suporte, sem passar pelo checkout do Asaas.
            </p>
            <div className="mt-7 rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sm leading-6 text-sky-950">
              Somente emails configurados como master no servidor conseguem concluir este acesso.
            </div>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mx-auto w-full max-w-md rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] md:p-8"
          >
            <div className="mb-7 text-center">
              <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                <KeyRound className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-950">Entrar como master</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Use o email master e a senha de acesso.
              </p>
            </div>

            <div className="grid gap-4">
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Nome
                <input {...register("name")} className={fieldClass} />
                {errors.name?.message !== undefined ? <span className="text-xs text-clinic-danger">{errors.name.message}</span> : null}
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Email master
                <input type="email" {...register("email")} className={fieldClass} />
                {errors.email?.message !== undefined ? <span className="text-xs text-clinic-danger">{errors.email.message}</span> : null}
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Senha
                <input type="password" {...register("password")} className={fieldClass} />
                {errors.password?.message !== undefined ? <span className="text-xs text-clinic-danger">{errors.password.message}</span> : null}
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Clínica de teste
                <input {...register("clinicName")} className={fieldClass} />
                {errors.clinicName?.message !== undefined ? <span className="text-xs text-clinic-danger">{errors.clinicName.message}</span> : null}
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Código master
                <input type="password" {...register("accessCode")} className={fieldClass} />
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
              Acessar sistema
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </section>
      </div>
    </main>
  );
};

export default MasterPage;
