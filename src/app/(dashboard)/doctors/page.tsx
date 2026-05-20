"use client";

import Link from "next/link";
import { Plus, Tags } from "lucide-react";
import { useMemo, useState } from "react";
import { DoctorCard } from "../../../components/doctors/DoctorCard";
import { EmptyState } from "../../../components/shared/EmptyState";
import { LoadingSkeleton } from "../../../components/shared/LoadingSkeleton";
import { PageSelector } from "../../../components/shared/PageSelector";
import { PageHeader } from "../../../components/shared/PageHeader";
import { useAuth } from "../../../lib/hooks/useAuth";
import { useDoctors } from "../../../lib/hooks/useDoctors";

const DoctorsPage = (): JSX.Element => {
  const { user } = useAuth();
  const clinicId = user?.clinicId ?? "";
  const [page, setPage] = useState(1);
  const { data = [], isLoading, error } = useDoctors(clinicId, { active: true });
  const pageSize = 9;
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedDoctors = useMemo(
    () => data.slice((safePage - 1) * pageSize, safePage * pageSize),
    [data, safePage],
  );

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <PageHeader title="Médicos" description="Equipe médica, CRM, especialidade e agenda." />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href="/settings/specialties" className="inline-flex items-center justify-center gap-2 rounded-md border border-clinic-border bg-clinic-surface px-4 py-2 text-sm font-medium text-clinic-text">
            <Tags className="h-4 w-4 text-clinic-primary" />
            Especialidades
          </Link>
          <Link href="/doctors/new" className="inline-flex items-center justify-center gap-2 rounded-md bg-clinic-primary px-4 py-2 text-sm font-medium text-white">
            <Plus className="h-4 w-4" />
            Novo médico
          </Link>
        </div>
      </div>
      {isLoading ? <LoadingSkeleton variant="card" /> : null}
      {error !== null ? <EmptyState title="Erro ao carregar médicos" description={error.message} /> : null}
      {!isLoading && error === null && data.length === 0 ? <EmptyState title="Nenhum médico" description="Cadastre o primeiro médico da clínica." actionHref="/doctors/new" actionLabel="Novo médico" /> : null}
      <div className="grid gap-4 md:grid-cols-3">{paginatedDoctors.map((doctor) => <DoctorCard key={doctor.id} doctor={doctor} />)}</div>
      <PageSelector
        currentPage={safePage}
        totalPages={totalPages}
        totalItems={data.length}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </div>
  );
};

export default DoctorsPage;
