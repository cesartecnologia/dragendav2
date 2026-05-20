"use client";

import { useParams, useRouter } from "next/navigation";
import { DoctorForm } from "../../../../../components/doctors/DoctorForm";
import { EmptyState } from "../../../../../components/shared/EmptyState";
import { LoadingSkeleton } from "../../../../../components/shared/LoadingSkeleton";
import { PageHeader } from "../../../../../components/shared/PageHeader";
import { useAuth } from "../../../../../lib/hooks/useAuth";
import { useDoctor, useUpdateDoctor } from "../../../../../lib/hooks/useDoctors";
import { useSpecialties } from "../../../../../lib/hooks/useSpecialties";
import { useUiStore } from "../../../../../lib/stores/uiStore";

const DoctorEditPage = (): JSX.Element => {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const clinicId = user?.clinicId ?? "";
  const doctor = useDoctor(clinicId, params.id);
  const specialties = useSpecialties(clinicId);
  const updateDoctor = useUpdateDoctor(clinicId, { active: true });
  const pushToast = useUiStore((state) => state.pushToast);

  if (doctor.isLoading) {
    return <LoadingSkeleton count={1} variant="card" />;
  }

  if (doctor.error !== null) {
    return <EmptyState title="Erro ao carregar médico" description={doctor.error.message} />;
  }

  if (doctor.data === null || doctor.data === undefined) {
    return <EmptyState title="Médico não encontrado" description="O cadastro solicitado não existe." />;
  }

  const doctorData = doctor.data;

  return (
    <div className="grid gap-6">
      <PageHeader title="Editar médico" description={`${doctorData.name} · CRM ${doctorData.crm}`} />
      <DoctorForm
        clinicId={clinicId}
        specialties={specialties.data?.map((item) => item.name) ?? []}
        defaultValues={doctorData}
        isPending={updateDoctor.isPending}
        onSubmit={async (values) => {
          await updateDoctor.mutateAsync({ id: doctorData.id, data: values });
          pushToast({ type: "success", title: "Médico atualizado", description: "Dados salvos com sucesso." });
          router.push(`/doctors/${doctorData.id}`);
        }}
      />
    </div>
  );
};

export default DoctorEditPage;
