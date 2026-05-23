"use client";

import { useParams, useRouter } from "next/navigation";
import { EmptyState } from "../../../../../components/shared/EmptyState";
import { LoadingSkeleton } from "../../../../../components/shared/LoadingSkeleton";
import { PageHeader } from "../../../../../components/shared/PageHeader";
import { PatientForm } from "../../../../../components/patients/PatientForm";
import { useAuth } from "../../../../../lib/hooks/useAuth";
import { useUpdatePatient } from "../../../../../lib/hooks/usePatients";
import { useQuery } from "@tanstack/react-query";
import { getPatientById } from "../../../../../lib/services/patientService";
import { useUiStore } from "../../../../../lib/stores/uiStore";

const PatientEditPage = (): JSX.Element => {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const clinicId = user?.clinicId ?? "";
  const patient = useQuery({ queryKey: ["patient", clinicId, params.id], queryFn: () => getPatientById(clinicId, params.id), enabled: clinicId.length > 0 });
  const updatePatient = useUpdatePatient(clinicId, { active: true });
  const pushToast = useUiStore((state) => state.pushToast);

  if (patient.isLoading) {
    return <LoadingSkeleton count={1} variant="card" />;
  }

  if (patient.error !== null) {
    return <EmptyState title="Erro ao carregar paciente" description={patient.error.message} />;
  }

  if (patient.data === null || patient.data === undefined) {
    return <EmptyState title="Paciente não encontrado" description="O cadastro solicitado não existe." />;
  }

  const patientData = patient.data;

  return (
    <div className="grid gap-6">
      <PageHeader title="Editar paciente" description={patientData.name} />
      <PatientForm
        defaultValues={patientData}
        isPending={updatePatient.isPending}
        onSubmit={async (values) => {
          await updatePatient.mutateAsync({ id: patientData.id, data: { ...values, healthInsurance: "" } });
          pushToast({ type: "success", title: "Paciente atualizado", description: "Dados salvos com sucesso." });
          router.push(`/pacientes/${patientData.id}`);
        }}
      />
    </div>
  );
};

export default PatientEditPage;
