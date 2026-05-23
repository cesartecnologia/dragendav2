"use client";

import { useRouter } from "next/navigation";
import { DoctorForm } from "../../../../components/doctors/DoctorForm";
import { PageHeader } from "../../../../components/shared/PageHeader";
import { useAuth } from "../../../../lib/hooks/useAuth";
import { useCreateDoctor } from "../../../../lib/hooks/useDoctors";
import { useSpecialties } from "../../../../lib/hooks/useSpecialties";
import type { DoctorFormValues } from "../../../../lib/validations/doctor";

const defaultValues: DoctorFormValues = {
  name: "",
  crm: "",
  specialty: "",
  phone: "",
  email: "",
  photoUrl: "",
  photoPublicId: "",
  consultationPrice: 0,
  active: true,
  workDays: [],
  workDates: [],
  periods: [],
  vacations: [],
};

const NewDoctorPage = (): JSX.Element => {
  const router = useRouter();
  const { user } = useAuth();
  const clinicId = user?.clinicId ?? "";
  const mutation = useCreateDoctor(clinicId, { active: true });
  const specialties = useSpecialties(clinicId);

  return (
    <div className="grid gap-6">
      <PageHeader title="Novo médico" description="Cadastre dados profissionais e contato." />
      <DoctorForm clinicId={clinicId} specialties={specialties.data?.map((item) => item.name) ?? []} defaultValues={defaultValues} isPending={mutation.isPending} onSubmit={async (values) => { await mutation.mutateAsync(values); router.push("/medicos"); }} />
    </div>
  );
};

export default NewDoctorPage;
