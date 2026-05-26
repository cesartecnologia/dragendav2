"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { bootstrapPostgresClinic } from "../../../lib/auth/sessionClient";
import { getAuthErrorCode, loginWithEmail, registerWithEmail } from "../../../lib/firebase/auth";
import { firestoreDb } from "../../../lib/firebase/config";
import { useAuthStore } from "../../../lib/stores/authStore";
import { maskCnpj, onlyNumbers } from "../../../lib/utils/masks";

const schema = z
  .object({
    name: z.string().min(2, "Informe seu nome"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z.string().min(6, "Confirme a senha"),
    clinicName: z.string().min(2, "Informe o nome da clínica"),
    cnpj: z.string().min(14, "Informe um CNPJ válido"),
    phone: z.string().min(10, "Informe o telefone"),
    city: z.string().min(2, "Informe a cidade"),
    state: z.string().length(2, "Informe a UF"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não conferem",
  });

type RegisterFormValues = z.infer<typeof schema>;

const RegisterPage = (): JSX.Element => {
  const router = useRouter();
  const setFirebaseUser = useAuthStore((state) => state.setFirebaseUser);
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);
  const [step, setStep] = useState(1);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      clinicName: "",
      cnpj: "",
      phone: "",
      city: "",
      state: "",
    },
  });

  const onSubmit = async (values: RegisterFormValues): Promise<void> => {
    try {
      const result = await registerWithEmail({
        name: values.name,
        email: values.email,
        password: values.password,
      }).catch(async (error: unknown) => {
        if (getAuthErrorCode(error) !== "auth/email-already-in-use") {
          throw error;
        }

        return await loginWithEmail({
          email: values.email,
          password: values.password,
        });
      });
      const clinicId = crypto.randomUUID();
      await setDoc(doc(firestoreDb, "clinics", clinicId), {
        name: values.clinicName,
        cnpj: values.cnpj,
        phone: values.phone,
        email: values.email,
        address: {
          cep: "",
          street: "",
          number: "",
          complement: "",
          neighborhood: "",
          city: values.city,
          state: values.state,
        },
        logoUrl: "",
        logoPublicId: "",
        primaryColor: "#6B8CAE",
        whatsappToken: "",
        whatsappPhone: "",
        whatsappApiUrl: "",
        plan: "starter",
        active: true,
        createdAt: serverTimestamp(),
      });
      await setDoc(doc(firestoreDb, "users", result.user.uid), {
        clinicId,
        role: "OWNER",
        name: values.name,
        email: values.email,
        active: true,
        createdAt: serverTimestamp(),
      });
      const user = await bootstrapPostgresClinic(result.user, {
        clinicId,
        ownerName: values.name,
        ownerEmail: values.email,
        clinicName: values.clinicName,
        cnpj: values.cnpj,
        phone: values.phone,
        city: values.city,
        state: values.state,
      });
      setFirebaseUser(result.user);
      setUser(user);
      setLoading(false);
      router.push("/painel");
    } catch (error: unknown) {
      setError("root", {
        message:
          error instanceof Error ? error.message : "Erro ao criar conta",
      });
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-clinic-bg p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-2xl rounded-md border border-clinic-border bg-clinic-surface p-6 shadow-sm"
      >
        <h1 className="text-2xl font-semibold text-clinic-text">Criar conta</h1>
        <p className="mt-1 text-sm text-clinic-muted">Etapa {step} de 3</p>
        {step === 1 ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="grid gap-1 text-sm">Nome<input {...register("name")} className="rounded-md border px-3 py-2" /></label>
            <label className="grid gap-1 text-sm">Email<input type="email" {...register("email")} className="rounded-md border px-3 py-2" /></label>
            <label className="grid gap-1 text-sm">Senha<input type="password" {...register("password")} className="rounded-md border px-3 py-2" /></label>
            <label className="grid gap-1 text-sm">Confirmar senha<input type="password" {...register("confirmPassword")} className="rounded-md border px-3 py-2" /></label>
          </div>
        ) : null}
        {step === 2 ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="grid gap-1 text-sm">Clínica<input {...register("clinicName")} className="rounded-md border px-3 py-2" /></label>
            <label className="grid gap-1 text-sm">CNPJ<input value={maskCnpj(watch("cnpj"))} onChange={(event) => setValue("cnpj", onlyNumbers(event.target.value))} className="rounded-md border px-3 py-2" /></label>
            <label className="grid gap-1 text-sm">Telefone<input {...register("phone")} className="rounded-md border px-3 py-2" /></label>
            <label className="grid gap-1 text-sm">Cidade<input {...register("city")} className="rounded-md border px-3 py-2" /></label>
            <label className="grid gap-1 text-sm">UF<input {...register("state")} maxLength={2} className="rounded-md border px-3 py-2 uppercase" /></label>
          </div>
        ) : null}
        {step === 3 ? (
          <div className="mt-6 rounded-md bg-clinic-bg p-4 text-sm text-clinic-text">
            <p>Confirme os dados para criar sua conta e clínica.</p>
            <p className="mt-2 font-medium">{watch("clinicName")}</p>
            <p>{watch("email")}</p>
          </div>
        ) : null}
        {Object.values(errors).length > 0 ? (
          <p className="mt-4 rounded-md bg-clinic-danger/10 p-3 text-sm text-clinic-danger">
            {errors.root?.message ?? "Revise os campos destacados"}
          </p>
        ) : null}
        <div className="mt-6 flex justify-between gap-3">
          <button type="button" disabled={step === 1 || isSubmitting} onClick={() => setStep(Math.max(1, step - 1))} className="rounded-md border px-4 py-2 disabled:opacity-60">Voltar</button>
          {step < 3 ? (
            <button type="button" onClick={() => setStep(Math.min(3, step + 1))} className="rounded-md bg-clinic-primary px-4 py-2 text-white">Continuar</button>
          ) : (
            <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-md bg-clinic-primary px-4 py-2 text-white disabled:opacity-60">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Criar conta
            </button>
          )}
        </div>
      </form>
    </main>
  );
};

export default RegisterPage;
