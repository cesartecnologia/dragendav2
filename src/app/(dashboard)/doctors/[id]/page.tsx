"use client";

import { CalendarDays, Clock3, Edit, Mail, Phone, Stethoscope, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "../../../../components/shared/ConfirmDialog";
import { EmptyState } from "../../../../components/shared/EmptyState";
import { LoadingSkeleton } from "../../../../components/shared/LoadingSkeleton";
import { useAuth } from "../../../../lib/hooks/useAuth";
import { useDeleteDoctor, useDoctor } from "../../../../lib/hooks/useDoctors";
import { useUiStore } from "../../../../lib/stores/uiStore";
import { formatMoney } from "../../../../lib/utils/money";
import { maskPhone } from "../../../../lib/utils/masks";

const DoctorProfilePage = (): JSX.Element => {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { user } = useAuth();
  const clinicId = user?.clinicId ?? "";
  const { data, isLoading, error } = useDoctor(clinicId, params.id);
  const deleteDoctor = useDeleteDoctor(clinicId, { active: true });
  const pushToast = useUiStore((state) => state.pushToast);

  if (isLoading) {
    return <LoadingSkeleton count={1} variant="card" />;
  }

  if (error !== null) {
    return <EmptyState title="Erro ao carregar médico" description={error.message} />;
  }

  if (data === null || data === undefined) {
    notFound();
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-md border border-clinic-border bg-clinic-surface p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-md bg-clinic-primary/10 text-clinic-primary">
              {data.photoUrl.length > 0 ? (
                <img src={data.photoUrl} alt={data.name} className="h-full w-full object-cover" />
              ) : (
                <Stethoscope className="h-7 w-7" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-clinic-text">{data.name}</h1>
              <p className="mt-1 text-sm text-clinic-muted">{data.specialty} · CRM {data.crm}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/medicos/${data.id}/agenda`} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-clinic-primary px-4 text-sm font-medium text-white">
              <CalendarDays className="h-4 w-4" />
              Agenda
            </Link>
            <Link href={`/medicos/${data.id}/editar`} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-clinic-border bg-clinic-surface px-4 text-sm font-medium text-clinic-text">
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
            <p className="text-sm text-clinic-muted">Valor da consulta</p>
            <p className="mt-2 text-2xl font-semibold text-clinic-text">{formatMoney(data.consultationPrice)}</p>
          </div>
          <div className="rounded-md bg-clinic-bg p-4">
            <p className="text-sm text-clinic-muted">Períodos cadastrados</p>
            <p className="mt-2 text-2xl font-semibold text-clinic-text">{data.periods.length}</p>
          </div>
          <div className="rounded-md bg-clinic-bg p-4">
            <p className="text-sm text-clinic-muted">Status</p>
            <p className="mt-2 text-2xl font-semibold text-clinic-text">{data.active ? "Ativo" : "Inativo"}</p>
          </div>
        </div>
      </section>
      <section className="grid gap-3 rounded-md border border-clinic-border bg-clinic-surface p-5">
        <h2 className="font-semibold text-clinic-text">Dados profissionais</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="flex gap-3 rounded-md border border-clinic-border p-3">
            <Phone className="h-5 w-5 text-clinic-primary" />
            <div><p className="text-xs text-clinic-muted">Telefone</p><p className="text-sm text-clinic-text">{maskPhone(data.phone)}</p></div>
          </div>
          <div className="flex gap-3 rounded-md border border-clinic-border p-3">
            <Mail className="h-5 w-5 text-clinic-primary" />
            <div><p className="text-xs text-clinic-muted">Email</p><p className="text-sm text-clinic-text">{data.email || "-"}</p></div>
          </div>
          <div className="flex gap-3 rounded-md border border-clinic-border p-3">
            <Clock3 className="h-5 w-5 text-clinic-primary" />
            <div><p className="text-xs text-clinic-muted">Atendimento</p><p className="text-sm text-clinic-text">{data.periods[0]?.startTime ?? "--:--"} às {data.periods[0]?.endTime ?? "--:--"}</p></div>
          </div>
        </div>
      </section>
      <ConfirmDialog
        open={deleteOpen}
        title="Excluir médico"
        description="O médico será desativado e não aparecerá nas novas agendas."
        confirmLabel="Excluir"
        isPending={deleteDoctor.isPending}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() =>
          deleteDoctor.mutate(data.id, {
            onSuccess: () => {
              pushToast({ type: "success", title: "Médico excluído", description: "Cadastro desativado com sucesso." });
              router.push("/medicos");
            },
            onError: () => pushToast({ type: "error", title: "Erro ao excluir", description: "Não foi possível excluir o médico." }),
          })
        }
      />
    </div>
  );
};

export default DoctorProfilePage;
