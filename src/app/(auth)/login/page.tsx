"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
    <main className="flex min-h-screen items-center justify-center bg-clinic-bg p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-md rounded-md border border-clinic-border bg-clinic-surface p-6 shadow-sm"
      >
        <h1 className="text-2xl font-semibold text-clinic-text">Entrar</h1>
        <p className="mt-1 text-sm text-clinic-muted">
          Acesse sua clínica para gerenciar agenda, pacientes e financeiro.
        </p>
        <div className="mt-6 grid gap-4">
          <label className="grid gap-1 text-sm text-clinic-text">
            Email
            <input
              type="email"
              {...register("email")}
              className="rounded-md border border-clinic-border px-3 py-2"
            />
            {errors.email?.message !== undefined ? (
              <span className="text-xs text-clinic-danger">
                {errors.email.message}
              </span>
            ) : null}
          </label>
          <label className="grid gap-1 text-sm text-clinic-text">
            Senha
            <input
              type="password"
              {...register("password")}
              className="rounded-md border border-clinic-border px-3 py-2"
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
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-clinic-primary px-4 py-2 font-medium text-white disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Entrar
        </button>
        <div className="mt-4 flex items-center justify-between text-sm">
          <Link href="/forgot-password" className="text-clinic-primary">
            Esqueci minha senha
          </Link>
          <Link href="/register" className="text-clinic-primary">
            Criar conta
          </Link>
        </div>
      </form>
    </main>
  );
};

export default LoginPage;
