"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { doctorSchema, type DoctorFormValues } from "../../lib/validations/doctor";
import { getSpecialtyColor } from "../../lib/utils/specialtyColor";
import { useUiStore } from "../../lib/stores/uiStore";
import { MoneyInput } from "../shared/MoneyInput";
import { ImageUpload } from "../shared/ImageUpload";
import { PhoneInput } from "../shared/PhoneInput";
import { PeriodEditor } from "./PeriodEditor";

export type DoctorFormProps = {
  defaultValues: DoctorFormValues;
  isPending: boolean;
  clinicId: string;
  specialties: string[];
  onSubmit: (values: DoctorFormValues) => Promise<void>;
};

export const DoctorForm = ({
  defaultValues,
  isPending,
  clinicId,
  specialties,
  onSubmit,
}: DoctorFormProps): JSX.Element => {
  const pushToast = useUiStore((state) => state.pushToast);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DoctorFormValues>({
    resolver: zodResolver(doctorSchema),
    defaultValues,
  });
  const specialtySearch = watch("specialty");
  const filteredSpecialties = useMemo(() => {
    const search = specialtySearch.trim().toLowerCase();
    return specialties
      .filter((specialty) => search.length < 2 || specialty.toLowerCase().includes(search))
      .slice(0, 8);
  }, [specialties, specialtySearch]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid gap-5 rounded-md border border-clinic-border bg-clinic-surface p-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">Nome<input {...register("name")} className="rounded-md border px-3 py-2" /></label>
        <label className="grid gap-1 text-sm">CRM<input {...register("crm")} className="rounded-md border px-3 py-2" /></label>
        <label className="relative grid gap-1 text-sm">
          Buscar especialidade
          <input
            value={watch("specialty")}
            onChange={(event) => setValue("specialty", event.target.value, { shouldValidate: true })}
            className="rounded-md border px-3 py-2"
            placeholder="Digite para buscar"
          />
          {filteredSpecialties.length > 0 && !filteredSpecialties.includes(watch("specialty")) ? (
            <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-auto rounded-md border border-clinic-border bg-white shadow-lg">
              {filteredSpecialties.map((specialty) => (
                (() => {
                  const color = getSpecialtyColor(specialty);
                  return (
                    <button
                      key={specialty}
                      type="button"
                      onClick={() => setValue("specialty", specialty, { shouldValidate: true })}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-clinic-bg"
                    >
                      <span className="h-3 w-3 rounded-full border" style={{ backgroundColor: color.background, borderColor: color.border }} />
                      {specialty}
                    </button>
                  );
                })()
              ))}
            </div>
          ) : null}
        </label>
        <PhoneInput id="doctor-phone" label="Telefone" value={watch("phone")} onChange={(value) => setValue("phone", value)} error={errors.phone?.message} />
        <label className="grid gap-1 text-sm">
          Email (opcional)
          <input type="email" {...register("email")} className="rounded-md border px-3 py-2" />
          {errors.email?.message !== undefined ? <span className="text-xs text-clinic-danger">{errors.email.message}</span> : null}
        </label>
        <MoneyInput
          id="consultationPrice"
          label="Valor da consulta"
          value={watch("consultationPrice")}
          onChange={(value) => setValue("consultationPrice", value)}
          error={errors.consultationPrice?.message}
        />
      </div>
      <ImageUpload
        label="Foto"
        folder={`clinics/${clinicId}/doctors`}
        value={watch("photoUrl")}
        onUploaded={(result) => {
          setValue("photoUrl", result.url, { shouldDirty: true, shouldValidate: true });
          setValue("photoPublicId", result.publicId, { shouldDirty: true, shouldValidate: true });
        }}
        onRemove={() => {
          setValue("photoUrl", "", { shouldDirty: true, shouldValidate: true });
          setValue("photoPublicId", "", { shouldDirty: true, shouldValidate: true });
          pushToast({
            type: "success",
            title: "Foto removida",
            description: "Salve o cadastro para confirmar a alteração.",
          });
        }}
      />
      <section className="grid gap-3">
        <div>
          <h2 className="font-semibold text-clinic-text">Períodos de atendimento</h2>
          <p className="text-sm text-clinic-muted">
            Cadastre os intervalos em que o médico atende e a duração de cada consulta.
          </p>
        </div>
        <PeriodEditor
          value={watch("periods")}
          onChange={(value) => setValue("periods", value, { shouldValidate: true })}
        />
        {errors.periods?.message !== undefined ? (
          <p className="text-sm text-clinic-danger">{errors.periods.message}</p>
        ) : null}
      </section>
      {Object.values(errors).length > 0 ? <p className="text-sm text-clinic-danger">Revise os campos do formulário</p> : null}
      <button type="submit" disabled={isPending} className="inline-flex items-center justify-center gap-2 rounded-md bg-clinic-primary px-4 py-2 text-white disabled:opacity-60">
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Salvar médico
      </button>
    </form>
  );
};
