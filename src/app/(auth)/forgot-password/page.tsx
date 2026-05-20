"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { getAuthErrorMessage, sendResetPasswordEmail } from "../../../lib/firebase/auth";

const schema = z.object({
  email: z.string().email("Email inválido"),
});

type ForgotPasswordFormValues = z.infer<typeof schema>;

const ForgotPasswordPage = (): JSX.Element => {
  const [success, setSuccess] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: ForgotPasswordFormValues): Promise<void> => {
    try {
      await sendResetPasswordEmail(values.email);
      setSuccess("Enviamos um link de recuperação para seu email.");
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
        <h1 className="text-2xl font-semibold text-clinic-text">Recuperar senha</h1>
        <p className="mt-1 text-sm text-clinic-muted">
          Informe seu email para receber o link de recuperação.
        </p>
        <label className="mt-6 grid gap-1 text-sm text-clinic-text">
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
        {errors.root?.message !== undefined ? (
          <p className="mt-4 rounded-md bg-clinic-danger/10 p-3 text-sm text-clinic-danger">
            {errors.root.message}
          </p>
        ) : null}
        {success !== null ? (
          <p className="mt-4 rounded-md bg-clinic-success/10 p-3 text-sm text-clinic-success">
            {success}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-clinic-primary px-4 py-2 font-medium text-white disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Enviar link
        </button>
        <Link href="/login" className="mt-4 block text-sm text-clinic-primary">
          Voltar para login
        </Link>
      </form>
    </main>
  );
};

export default ForgotPasswordPage;

