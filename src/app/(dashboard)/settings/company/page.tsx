"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { PageHeader } from "../../../../components/shared/PageHeader";
import { CepInput } from "../../../../components/shared/CepInput";
import { ImageUpload } from "../../../../components/shared/ImageUpload";
import { PhoneInput } from "../../../../components/shared/PhoneInput";
import { useAuth } from "../../../../lib/hooks/useAuth";
import { useClinic, useUpdateClinic } from "../../../../lib/hooks/useClinic";
import { fetchAddressByCep } from "../../../../lib/utils/cep";
import { maskCnpj, onlyNumbers } from "../../../../lib/utils/masks";
import {
  companySettingsSchema,
  type CompanySettingsFormValues,
} from "../../../../lib/validations/settings";

const companyDefaults: CompanySettingsFormValues = {
  name: "",
  cnpj: "",
  phone: "",
  email: "",
  address: {
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  },
  logoUrl: "",
  logoPublicId: "",
  primaryColor: "#6B8CAE",
};

const CompanySettingsPage = (): JSX.Element => {
  const { user } = useAuth();
  const clinicId = user?.clinicId ?? "";
  const clinic = useClinic(clinicId);
  const updateClinic = useUpdateClinic(clinicId);
  const companyForm = useForm<CompanySettingsFormValues>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: companyDefaults,
  });

  useEffect(() => {
    if (clinic.data !== undefined && clinic.data !== null) {
      companyForm.reset({
        name: clinic.data.name,
        cnpj: clinic.data.cnpj,
        phone: clinic.data.phone,
        email: clinic.data.email,
        address: clinic.data.address,
        logoUrl: clinic.data.logoUrl,
        logoPublicId: clinic.data.logoPublicId,
        primaryColor: clinic.data.primaryColor,
      });
    }
  }, [clinic.data, companyForm]);

  const loadCep = async (): Promise<void> => {
    try {
      const address = await fetchAddressByCep(companyForm.watch("address.cep"));
      companyForm.setValue("address.street", address.street ?? "");
      companyForm.setValue("address.neighborhood", address.neighborhood ?? "");
      companyForm.setValue("address.city", address.city ?? "");
      companyForm.setValue("address.state", address.state ?? "");
    } catch {
      return;
    }
  };

  return (
    <div className="grid gap-6">
      <PageHeader title="Clínica" description="Dados cadastrais, logo e cor principal." />
      <form
        onSubmit={companyForm.handleSubmit(async (values) => {
          await updateClinic.mutateAsync(values);
        })}
        className="grid gap-5 rounded-md border border-clinic-border bg-clinic-surface p-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            Nome da clínica
            <input {...companyForm.register("name")} className="rounded-md border px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm">
            CNPJ
            <input
              value={maskCnpj(companyForm.watch("cnpj"))}
              onChange={(event) =>
                companyForm.setValue("cnpj", onlyNumbers(event.target.value), {
                  shouldValidate: true,
                })
              }
              className="rounded-md border px-3 py-2"
            />
          </label>
          <PhoneInput
            id="clinic-phone"
            label="Telefone"
            value={companyForm.watch("phone")}
            onChange={(value) => companyForm.setValue("phone", value)}
            error={companyForm.formState.errors.phone?.message}
          />
          <label className="grid gap-1 text-sm">
            Email
            <input type="email" {...companyForm.register("email")} className="rounded-md border px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm">
            Cor principal
            <input type="color" {...companyForm.register("primaryColor")} className="h-10 rounded-md border px-2 py-1" />
          </label>
        </div>
        <ImageUpload
          label="Logo da clínica"
          folder={`clinics/${clinicId}/logos`}
          value={companyForm.watch("logoUrl")}
          onUploaded={(result) => {
            companyForm.setValue("logoUrl", result.url);
            companyForm.setValue("logoPublicId", result.publicId);
          }}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CepInput
            id="clinic-cep"
            label="CEP"
            value={companyForm.watch("address.cep")}
            onChange={(value) => companyForm.setValue("address.cep", value)}
            onBlur={loadCep}
          />
          <label className="grid gap-1 text-sm sm:col-span-2">Rua<input {...companyForm.register("address.street")} className="rounded-md border px-3 py-2" /></label>
          <label className="grid gap-1 text-sm">Número<input {...companyForm.register("address.number")} className="rounded-md border px-3 py-2" /></label>
          <label className="grid gap-1 text-sm">Complemento<input {...companyForm.register("address.complement")} className="rounded-md border px-3 py-2" /></label>
          <label className="grid gap-1 text-sm">Bairro<input {...companyForm.register("address.neighborhood")} className="rounded-md border px-3 py-2" /></label>
          <label className="grid gap-1 text-sm">Cidade<input {...companyForm.register("address.city")} className="rounded-md border px-3 py-2" /></label>
          <label className="grid gap-1 text-sm">UF<input {...companyForm.register("address.state")} className="rounded-md border px-3 py-2 uppercase" /></label>
        </div>
        <button
          type="submit"
          disabled={updateClinic.isPending}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-clinic-primary px-4 py-2 text-white disabled:opacity-60"
        >
          {updateClinic.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Salvar clínica
        </button>
      </form>
    </div>
  );
};

export default CompanySettingsPage;
