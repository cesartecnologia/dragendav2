"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarPlus, Edit, Mail, MapPin, Phone, Trash2, UserRound } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { PatientTimeline } from "../../../../components/patients/PatientTimeline";
import { ConfirmDialog } from "../../../../components/shared/ConfirmDialog";
import { EmptyState } from "../../../../components/shared/EmptyState";
import { LoadingSkeleton } from "../../../../components/shared/LoadingSkeleton";
import { useAuth } from "../../../../lib/hooks/useAuth";
import { useDeletePatient } from "../../../../lib/hooks/usePatients";
import { getPatientAppointments, getPatientById } from "../../../../lib/services/patientService";
import { useUiStore } from "../../../../lib/stores/uiStore";
import { formatDateBR } from "../../../../lib/utils/date";
import { formatMoney } from "../../../../lib/utils/money";
import { maskCpf, maskPhone } from "../../../../lib/utils/masks";

const PatientProfilePage = (): JSX.Element => {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { user } = useAuth();
  const clinicId = user?.clinicId ?? "";
  const deletePatient = useDeletePatient(clinicId, { active: true });
  const pushToast = useUiStore((state) => state.pushToast);
  const patient = useQuery({ queryKey: ["patient", clinicId, params.id], queryFn: () => getPatientById(clinicId, params.id), enabled: clinicId.length > 0 });
  const appointments = useQuery({ queryKey: ["patient-appointments", clinicId, params.id], queryFn: () => getPatientAppointments(clinicId, params.id), enabled: clinicId.length > 0 });

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
  const appointmentData = appointments.data ?? [];
  const totalSpent = appointmentData.reduce((total, appointment) => total + appointment.amount, 0);
  const lastVisit = appointmentData[0]?.date;
  const address = [
    patientData.address.street,
    patientData.address.number,
    patientData.address.neighborhood,
    patientData.address.city,
    patientData.address.state,
  ].filter((item) => item.trim().length > 0).join(", ");

  return (
    <div className="grid gap-5">
      <section className="rounded-md border border-clinic-border bg-clinic-surface p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-md bg-clinic-primary/10 text-clinic-primary">
              <UserRound className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-clinic-text">{patientData.name}</h1>
              <p className="mt-1 text-sm text-clinic-muted">
                CPF {maskCpf(patientData.cpf)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/agendamentos?modal=new" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-clinic-primary px-4 text-sm font-medium text-white">
              <CalendarPlus className="h-4 w-4" />
              Novo agendamento
            </Link>
            <Link href={`/pacientes/${patientData.id}/editar`} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-clinic-border bg-clinic-surface px-4 text-sm font-medium text-clinic-text">
              <Edit className="h-4 w-4" />
              Editar
            </Link>
            <button type="button" onClick={() => setDeleteOpen(true)} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-clinic-danger/30 bg-clinic-danger/10 px-4 text-sm font-medium text-clinic-danger">
              <Trash2 className="h-4 w-4" />
              Excluir
            </button>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-md bg-clinic-bg p-4">
            <p className="text-sm text-clinic-muted">Total de consultas</p>
            <p className="mt-2 text-2xl font-semibold text-clinic-text">{appointmentData.length}</p>
          </div>
          <div className="rounded-md bg-clinic-bg p-4">
            <p className="text-sm text-clinic-muted">Última visita</p>
            <p className="mt-2 text-2xl font-semibold text-clinic-text">{lastVisit !== undefined ? formatDateBR(lastVisit) : "-"}</p>
          </div>
          <div className="rounded-md bg-clinic-bg p-4">
            <p className="text-sm text-clinic-muted">Total gasto</p>
            <p className="mt-2 text-2xl font-semibold text-clinic-text">{formatMoney(totalSpent)}</p>
          </div>
        </div>
      </section>
      <section className="grid gap-3 rounded-md border border-clinic-border bg-clinic-surface p-5">
        <h2 className="font-semibold text-clinic-text">Dados de contato</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="flex gap-3 rounded-md border border-clinic-border p-3">
            <Phone className="h-5 w-5 text-clinic-primary" />
            <div><p className="text-xs text-clinic-muted">Telefone</p><p className="text-sm text-clinic-text">{maskPhone(patientData.phone)}</p></div>
          </div>
          <div className="flex gap-3 rounded-md border border-clinic-border p-3">
            <Mail className="h-5 w-5 text-clinic-primary" />
            <div><p className="text-xs text-clinic-muted">Email</p><p className="text-sm text-clinic-text">{patientData.email || "-"}</p></div>
          </div>
          <div className="flex gap-3 rounded-md border border-clinic-border p-3">
            <MapPin className="h-5 w-5 text-clinic-primary" />
            <div><p className="text-xs text-clinic-muted">Endereço</p><p className="text-sm text-clinic-text">{address || "-"}</p></div>
          </div>
        </div>
      </section>
      <PatientTimeline appointments={appointmentData} isLoading={appointments.isLoading} error={appointments.error?.message ?? null} />
      <ConfirmDialog
        open={deleteOpen}
        title="Excluir paciente"
        description="O paciente será desativado e removido das buscas de novos agendamentos."
        confirmLabel="Excluir"
        isPending={deletePatient.isPending}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() =>
          deletePatient.mutate(patientData.id, {
            onSuccess: () => {
              pushToast({ type: "success", title: "Paciente excluído", description: "Cadastro desativado com sucesso." });
              router.push("/pacientes");
            },
            onError: () => pushToast({ type: "error", title: "Erro ao excluir", description: "Não foi possível excluir o paciente." }),
          })
        }
      />
    </div>
  );
};

export default PatientProfilePage;
