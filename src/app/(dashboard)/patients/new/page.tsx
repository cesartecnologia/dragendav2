"use client";

import { useRouter } from "next/navigation";
import { PatientForm } from "../../../../components/patients/PatientForm";
import { PageHeader } from "../../../../components/shared/PageHeader";
import { useAuth } from "../../../../lib/hooks/useAuth";
import { useCreatePatient } from "../../../../lib/hooks/usePatients";
import type { PatientFormValues } from "../../../../lib/validations/patient";

const defaultValues: PatientFormValues = {
  name: "",
  cpf: "",
  birthDate: "",
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
  gender: "O",
  healthInsurance: "",
  notes: "",
  active: true,
};

const NewPatientPage = (): JSX.Element => {
  const router = useRouter();
  const { user } = useAuth();
  const clinicId = user?.clinicId ?? "";
  const mutation = useCreatePatient(clinicId, { active: true });

  return (
    <div className="grid gap-6">
      <PageHeader title="Novo paciente" description="Cadastre dados pessoais, contato e endereço." />
      <PatientForm defaultValues={defaultValues} isPending={mutation.isPending} onSubmit={async (values) => { await mutation.mutateAsync({ ...values, healthInsurance: "" }); router.push("/patients"); }} />
    </div>
  );
};

export default NewPatientPage;
