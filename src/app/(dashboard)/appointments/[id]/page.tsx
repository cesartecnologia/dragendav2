"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "../../../../components/shared/PageHeader";

const AppointmentDetailPage = (): JSX.Element => {
  const params = useParams<{ id: string }>();

  return (
    <div className="grid gap-6">
      <PageHeader title="Detalhe do agendamento" description={`Agendamento ${params.id}`} />
      <div className="rounded-md border border-clinic-border bg-clinic-surface p-4 text-clinic-muted">Carregando dados do agendamento...</div>
    </div>
  );
};

export default AppointmentDetailPage;

