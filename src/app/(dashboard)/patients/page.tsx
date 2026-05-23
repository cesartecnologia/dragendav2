"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { PatientCard } from "../../../components/patients/PatientCard";
import { EmptyState } from "../../../components/shared/EmptyState";
import { LoadingSkeleton } from "../../../components/shared/LoadingSkeleton";
import { PageSelector } from "../../../components/shared/PageSelector";
import { PageHeader } from "../../../components/shared/PageHeader";
import { useAuth } from "../../../lib/hooks/useAuth";
import { usePatients } from "../../../lib/hooks/usePatients";

const PatientsPage = (): JSX.Element => {
  const { user } = useAuth();
  const clinicId = user?.clinicId ?? "";
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = usePatients(clinicId, { active: true });
  const patients = data?.data ?? [];
  const pageSize = 9;
  const totalPages = Math.max(1, Math.ceil(patients.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedPatients = useMemo(
    () => patients.slice((safePage - 1) * pageSize, safePage * pageSize),
    [safePage, patients],
  );

  return (
    <div className="grid gap-6">
      <PageHeader title="Pacientes" description="Cadastro, busca e histórico clínico." actionHref="/pacientes/novo" actionLabel="Novo paciente" actionIcon={Plus} />
      {isLoading ? <LoadingSkeleton /> : null}
      {error !== null ? <EmptyState title="Erro ao carregar pacientes" description={error.message} /> : null}
      {!isLoading && error === null && patients.length === 0 ? <EmptyState title="Nenhum paciente" description="Cadastre o primeiro paciente da clínica." actionHref="/pacientes/novo" actionLabel="Novo paciente" /> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{paginatedPatients.map((patient) => <PatientCard key={patient.id} patient={patient} />)}</div>
      <PageSelector
        currentPage={safePage}
        totalPages={totalPages}
        totalItems={patients.length}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </div>
  );
};

export default PatientsPage;
