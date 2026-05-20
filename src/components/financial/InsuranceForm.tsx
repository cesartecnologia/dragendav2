"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { insuranceSchema, type InsuranceFormValues } from "../../lib/validations/insurance";

export type InsuranceFormProps = {
  defaultValues: InsuranceFormValues;
  isPending: boolean;
  onSubmit: (values: InsuranceFormValues) => Promise<void>;
};

export const InsuranceForm = ({ defaultValues, isPending, onSubmit }: InsuranceFormProps): JSX.Element => {
  const { register, handleSubmit, formState: { errors } } = useForm<InsuranceFormValues>({
    resolver: zodResolver(insuranceSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 rounded-md border border-clinic-border bg-clinic-surface p-4">
      <label className="grid gap-1 text-sm">Nome<input {...register("name")} className="rounded-md border px-3 py-2" /></label>
      <label className="grid gap-1 text-sm">Código ANS opcional<input {...register("ansCode")} className="rounded-md border px-3 py-2" /></label>
      <input type="hidden" value={0} {...register("discountPercent")} />
      {Object.values(errors).length > 0 ? <p className="text-sm text-clinic-danger">Revise os campos</p> : null}
      <button type="submit" disabled={isPending} className="inline-flex items-center justify-center gap-2 rounded-md bg-clinic-primary px-4 py-2 text-white disabled:opacity-60">
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Salvar convênio
      </button>
    </form>
  );
};
