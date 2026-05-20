"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PeriodEditor } from "../../../../../components/doctors/PeriodEditor";
import { VacationEditor } from "../../../../../components/doctors/VacationEditor";
import { PageHeader } from "../../../../../components/shared/PageHeader";
import { useAuth } from "../../../../../lib/hooks/useAuth";
import { useDoctor, useRegenerateSchedules, useUpdateDoctor } from "../../../../../lib/hooks/useDoctors";
import type { ConsultationPeriod, Vacation } from "../../../../../lib/types";

const DoctorSchedulePage = (): JSX.Element => {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const clinicId = user?.clinicId ?? "";
  const [periods, setPeriods] = useState<ConsultationPeriod[]>([]);
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const doctor = useDoctor(clinicId, params.id);
  const update = useUpdateDoctor(clinicId);
  const regenerate = useRegenerateSchedules(clinicId);

  useEffect(() => {
    if (doctor.data !== undefined && doctor.data !== null) {
      setPeriods(doctor.data.periods ?? []);
      setVacations(doctor.data.vacations ?? []);
    }
  }, [doctor.data]);

  const save = async (): Promise<void> => {
    await update.mutateAsync({ id: params.id, data: { periods, vacations } });
    await regenerate.mutateAsync(params.id);
  };

  return (
    <div className="grid gap-6">
      <PageHeader title="Agenda do médico" description="Configure períodos de atendimento, duração das consultas, férias e gere os próximos 60 dias." />
      {doctor.isLoading ? <div className="h-24 animate-pulse rounded-md bg-clinic-border" /> : null}
      {doctor.error !== null ? <p className="rounded-md bg-clinic-danger/10 p-4 text-clinic-danger">{doctor.error.message}</p> : null}
      <section className="grid gap-3 rounded-md border bg-clinic-surface p-4"><h2 className="font-semibold">Períodos de atendimento</h2><PeriodEditor value={periods} onChange={setPeriods} /></section>
      <section className="grid gap-3 rounded-md border bg-clinic-surface p-4"><h2 className="font-semibold">Férias</h2><VacationEditor value={vacations} onChange={setVacations} /></section>
      <button type="button" disabled={update.isPending || regenerate.isPending} onClick={save} className="rounded-md bg-clinic-primary px-4 py-2 text-white disabled:opacity-60">Salvar agenda</button>
    </div>
  );
};

export default DoctorSchedulePage;
