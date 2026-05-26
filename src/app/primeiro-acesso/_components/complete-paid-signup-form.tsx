"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { Building2, Loader2, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { bootstrapPostgresClinic } from "../../../lib/auth/sessionClient";
import { getAuthErrorCode, loginWithEmail, registerWithEmail } from "../../../lib/firebase/auth";
import { firestoreDb } from "../../../lib/firebase/config";
import { useAuthStore } from "../../../lib/stores/authStore";
import { maskCnpj, onlyNumbers } from "../../../lib/utils/masks";

const schema = z
  .object({
    name: z.string().min(2, "Informe o nome do responsável"),
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

type FormValues = z.infer<typeof schema>;

type CompletePaidSignupFormProps = {
  sessionId: string;
  defaults: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  };
};

const fieldClass =
  "h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100";

export const CompletePaidSignupForm = ({
  sessionId,
  defaults,
}: CompletePaidSignupFormProps): JSX.Element => {
  const router = useRouter();
  const setFirebaseUser = useAuthStore((state) => state.setFirebaseUser);
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaults.name ?? "",
      email: defaults.email ?? "",
      password: "",
      confirmPassword: "",
      clinicName: "",
      cnpj: "",
      phone: defaults.phone ?? "",
      city: "",
      state: "",
    },
  });

  const onSubmit = async (values: FormValues): Promise<void> => {
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
        primaryColor: "#38BDF8",
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
        state: values.state.toUpperCase(),
        checkoutSessionId: sessionId,
      });

      setFirebaseUser(result.user);
      setUser(user);
      setLoading(false);
      router.push("/painel");
    } catch (error: unknown) {
      setError("root", {
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível concluir o cadastro",
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full rounded-[28px] border border-sky-100 bg-white p-6 shadow-[0_24px_80px_rgba(14,165,233,0.12)] sm:p-8"
    >
      <div className="space-y-2">
        <span className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
          Pagamento confirmado
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Cadastro da clínica</h1>
        <p className="text-sm leading-6 text-slate-600">
          Crie o acesso administrador e finalize os dados da clínica para entrar no sistema.
        </p>
      </div>

      <section className="mt-7 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          <UserRound className="h-4 w-4" />
          Responsável
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Nome
            <input {...register("name")} className={fieldClass} />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Email
            <input type="email" {...register("email")} className={fieldClass} />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Senha
            <input type="password" {...register("password")} className={fieldClass} />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Confirmar senha
            <input type="password" {...register("confirmPassword")} className={fieldClass} />
          </label>
        </div>
      </section>

      <section className="mt-7 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          <Building2 className="h-4 w-4" />
          Clínica
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Nome da clínica
            <input {...register("clinicName")} className={fieldClass} />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            CNPJ
            <input
              value={maskCnpj(watch("cnpj"))}
              onChange={(event) => setValue("cnpj", onlyNumbers(event.target.value))}
              className={fieldClass}
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Telefone
            <input {...register("phone")} className={fieldClass} />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Cidade
            <input {...register("city")} className={fieldClass} />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            UF
            <input
              {...register("state")}
              maxLength={2}
              className={`${fieldClass} uppercase`}
              onChange={(event) => setValue("state", event.target.value.toUpperCase())}
            />
          </label>
        </div>
      </section>

      {Object.values(errors).length > 0 ? (
        <p className="mt-5 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
          {errors.root?.message ?? "Revise os campos destacados para continuar."}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 px-5 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:opacity-60"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Finalizar cadastro
      </button>
    </form>
  );
};
