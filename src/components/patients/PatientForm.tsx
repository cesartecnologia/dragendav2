"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { calculateAge } from "../../lib/utils/date";
import { fetchAddressByCep } from "../../lib/utils/cep";
import { patientSchema, type PatientFormValues } from "../../lib/validations/patient";
import { CepInput } from "../shared/CepInput";
import { CpfInput } from "../shared/CpfInput";
import { PhoneInput } from "../shared/PhoneInput";

export type PatientFormProps = {
  defaultValues: PatientFormValues;
  isPending: boolean;
  onSubmit: (values: PatientFormValues) => Promise<void>;
};

const optionalLabel = (label: string): JSX.Element => (
  <>
    {label}
    <span className="font-normal text-clinic-muted"> (opcional)</span>
  </>
);

export const PatientForm = ({ defaultValues, isPending, onSubmit }: PatientFormProps): JSX.Element => {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues,
  });

  const loadCep = async (): Promise<void> => {
    try {
      const address = await fetchAddressByCep(watch("address.cep"));
      setValue("address.street", address.street ?? "");
      setValue("address.neighborhood", address.neighborhood ?? "");
      setValue("address.city", address.city ?? "");
      setValue("address.state", address.state ?? "");
    } catch {
      return;
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5 rounded-md border border-clinic-border bg-clinic-surface p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm">
          Nome
          <input {...register("name")} className="rounded-md border px-3 py-2" />
          {errors.name?.message !== undefined ? <span className="text-xs text-clinic-danger">{errors.name.message}</span> : null}
        </label>
        <CpfInput id="cpf" label="CPF" value={watch("cpf")} onChange={(value) => setValue("cpf", value)} error={errors.cpf?.message} />
        <label className="grid gap-1 text-sm">
          Nascimento
          <input type="date" {...register("birthDate")} className="rounded-md border px-3 py-2" />
          {errors.birthDate?.message !== undefined ? <span className="text-xs text-clinic-danger">{errors.birthDate.message}</span> : null}
          <span className="text-xs text-clinic-muted">{watch("birthDate").length > 0 ? `${calculateAge(watch("birthDate"))} anos` : ""}</span>
        </label>
        <PhoneInput id="phone" label="Telefone (opcional)" value={watch("phone")} onChange={(value) => setValue("phone", value)} error={errors.phone?.message} />
        <label className="grid gap-1 text-sm">
          {optionalLabel("Email")}
          <input type="email" {...register("email")} className="rounded-md border px-3 py-2" />
          {errors.email?.message !== undefined ? <span className="text-xs text-clinic-danger">{errors.email.message}</span> : null}
        </label>
        <label className="grid gap-1 text-sm">{optionalLabel("Gênero")}<select {...register("gender")} className="rounded-md border px-3 py-2"><option value="M">Masculino</option><option value="F">Feminino</option><option value="O">Outro</option></select></label>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <CepInput id="cep" label="CEP (opcional)" value={watch("address.cep")} onChange={(value) => setValue("address.cep", value)} onBlur={loadCep} error={errors.address?.cep?.message} />
        <label className="grid gap-1 text-sm md:col-span-2">{optionalLabel("Rua")}<input {...register("address.street")} className="rounded-md border px-3 py-2" /></label>
        <label className="grid gap-1 text-sm">{optionalLabel("Número")}<input {...register("address.number")} className="rounded-md border px-3 py-2" /></label>
        <label className="grid gap-1 text-sm">{optionalLabel("Complemento")}<input {...register("address.complement")} className="rounded-md border px-3 py-2" /></label>
        <label className="grid gap-1 text-sm">{optionalLabel("Bairro")}<input {...register("address.neighborhood")} className="rounded-md border px-3 py-2" /></label>
        <label className="grid gap-1 text-sm">{optionalLabel("Cidade")}<input {...register("address.city")} className="rounded-md border px-3 py-2" /></label>
        <label className="grid gap-1 text-sm">
          {optionalLabel("UF")}
          <input {...register("address.state")} className="rounded-md border px-3 py-2 uppercase" />
          {errors.address?.state?.message !== undefined ? <span className="text-xs text-clinic-danger">{errors.address.state.message}</span> : null}
        </label>
      </div>
      <label className="grid gap-1 text-sm">{optionalLabel("Observações")}<textarea {...register("notes")} className="min-h-28 rounded-md border px-3 py-2" /></label>
      {Object.values(errors).length > 0 ? <p className="text-sm text-clinic-danger">Revise os campos do formulário</p> : null}
      <button type="submit" disabled={isPending} className="inline-flex items-center justify-center gap-2 rounded-md bg-clinic-primary px-4 py-2 text-white disabled:opacity-60">
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Salvar paciente
      </button>
    </form>
  );
};
