"use client";

import { useMemo, useState } from "react";
import { InsuranceCard } from "../../../../components/financial/InsuranceCard";
import { InsuranceForm } from "../../../../components/financial/InsuranceForm";
import { EmptyState } from "../../../../components/shared/EmptyState";
import { PageSelector } from "../../../../components/shared/PageSelector";
import { PageHeader } from "../../../../components/shared/PageHeader";
import { useAuth } from "../../../../lib/hooks/useAuth";
import { useCreateInsurance, useInsurances } from "../../../../lib/hooks/useInsurances";
import type { InsuranceFormValues } from "../../../../lib/validations/insurance";

const defaultValues: InsuranceFormValues = {
  name: "",
  ansCode: "",
  discountPercent: 0,
  active: true,
  coverageRules: [],
};

const InsurancesSettingsPage = (): JSX.Element => {
  const { user } = useAuth();
  const clinicId = user?.clinicId ?? "";
  const [page, setPage] = useState(1);
  const { data = [], isLoading, error } = useInsurances(clinicId);
  const create = useCreateInsurance(clinicId);
  const pageSize = 9;
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedInsurances = useMemo(
    () => data.slice((safePage - 1) * pageSize, safePage * pageSize),
    [data, safePage],
  );

  return (
    <div className="grid gap-6">
      <PageHeader title="Convênios" description="Planos, ANS e regras por especialidade." />
      <InsuranceForm
        defaultValues={defaultValues}
        isPending={create.isPending}
        onSubmit={async (values) => {
          await create.mutateAsync(values);
        }}
      />
      {isLoading ? <div className="h-32 animate-pulse rounded-md bg-clinic-border" /> : null}
      {error !== null ? <EmptyState title="Erro ao carregar convênios" description={error.message} /> : null}
      {!isLoading && error === null && data.length === 0 ? <EmptyState title="Nenhum convênio" description="Cadastre os convênios atendidos pela clínica." /> : null}
      <div className="grid gap-4 md:grid-cols-3">{paginatedInsurances.map((insurance) => <InsuranceCard key={insurance.id} insurance={insurance} />)}</div>
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

export default InsurancesSettingsPage;
