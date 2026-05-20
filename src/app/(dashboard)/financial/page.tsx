"use client";

import { endOfMonth, startOfMonth } from "date-fns";
import { useMemo, useState } from "react";
import { Building2, CreditCard, Filter } from "lucide-react";
import { InsuranceCard } from "../../../components/financial/InsuranceCard";
import { InsuranceForm } from "../../../components/financial/InsuranceForm";
import { FinancialKPIs } from "../../../components/financial/FinancialKPIs";
import { PaymentTable } from "../../../components/financial/PaymentTable";
import { PendingPayments } from "../../../components/financial/PendingPayments";
import { RevenueChart } from "../../../components/financial/RevenueChart";
import { PageHeader } from "../../../components/shared/PageHeader";
import { DateRangePicker } from "../../../components/shared/DateRangePicker";
import { PageSelector } from "../../../components/shared/PageSelector";
import { useAuth } from "../../../lib/hooks/useAuth";
import { usePayments, usePendingPayments, useRevenueCharts, useRevenueSummary } from "../../../lib/hooks/useFinancial";
import { useCreateInsurance, useInsurances } from "../../../lib/hooks/useInsurances";
import { useUiStore } from "../../../lib/stores/uiStore";
import { createDateRange } from "../../../lib/utils/date";
import { paymentMethodLabel } from "../../../lib/utils/labels";
import type { InsuranceFormValues } from "../../../lib/validations/insurance";

const defaultInsuranceValues: InsuranceFormValues = {
  name: "",
  ansCode: "",
  discountPercent: 0,
  active: true,
  coverageRules: [],
};

const FinancialPage = (): JSX.Element => {
  const [tab, setTab] = useState<"overview" | "entries" | "insurances" | "pending">("overview");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [insurancePage, setInsurancePage] = useState(1);
  const { user } = useAuth();
  const clinicId = user?.clinicId ?? "";
  const [dateRange, setDateRange] = useState(() => createDateRange(startOfMonth(new Date()), endOfMonth(new Date())));
  const summary = useRevenueSummary(clinicId, dateRange);
  const charts = useRevenueCharts(clinicId, dateRange);
  const payments = usePayments(clinicId, { dateRange });
  const pending = usePendingPayments(clinicId, 7);
  const insurances = useInsurances(clinicId);
  const createInsurance = useCreateInsurance(clinicId);
  const pushToast = useUiStore((state) => state.pushToast);
  const insurancePageSize = 9;
  const insuranceData = insurances.data ?? [];
  const insuranceTotalPages = Math.max(1, Math.ceil(insuranceData.length / insurancePageSize));
  const safeInsurancePage = Math.min(insurancePage, insuranceTotalPages);
  const paginatedInsurances = useMemo(
    () => insuranceData.slice((safeInsurancePage - 1) * insurancePageSize, safeInsurancePage * insurancePageSize),
    [insuranceData, safeInsurancePage],
  );

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <PageHeader title="Financeiro" description="Receitas reais, lançamentos, convênios e inadimplência." />
        <button
          type="button"
          onClick={() => setFiltersOpen((current) => !current)}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-clinic-border bg-clinic-surface px-4 py-2 text-sm font-medium text-clinic-text"
        >
          <Filter className="h-4 w-4 text-clinic-primary" />
          Filtros
        </button>
      </div>
      {filtersOpen ? (
        <div className="rounded-md border border-clinic-border bg-clinic-surface p-4">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>
      ) : null}
      <div className="grid gap-2 rounded-md border border-clinic-border bg-clinic-surface p-2 sm:grid-cols-4">
        {[["overview", "Visão geral"], ["entries", "Lançamentos"], ["insurances", "Convênios"], ["pending", "Inadimplência"]].map(([value, label]) => (
          <button key={value} type="button" onClick={() => setTab(value as "overview" | "entries" | "insurances" | "pending")} className={`rounded-md px-3 py-2 text-sm ${tab === value ? "bg-clinic-primary text-white" : "text-clinic-muted hover:bg-clinic-bg hover:text-clinic-text"}`}>{label}</button>
        ))}
      </div>
      {tab === "overview" ? (
        <div className="grid gap-6">
          <FinancialKPIs summary={summary.data} isLoading={summary.isLoading} error={summary.error?.message ?? null} />
          <div className="grid gap-4 lg:grid-cols-[1.5fr_0.8fr]">
            <RevenueChart data={charts.data?.byDay ?? []} isLoading={charts.isLoading} error={charts.error?.message ?? null} />
            <div className="rounded-md border border-clinic-border bg-clinic-surface p-5">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-clinic-primary" />
                <h2 className="font-semibold text-clinic-text">Por forma de pagamento</h2>
              </div>
              <div className="mt-4 grid gap-3">
                {(charts.data?.byMethod ?? []).map((item) => (
                  <div key={item.method} className="flex items-center justify-between rounded-md bg-clinic-bg p-3 text-sm">
                    <span>{paymentMethodLabel(item.method)}</span>
                    <strong>{item.count}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <PaymentTable payments={payments.data?.data ?? []} isLoading={payments.isLoading} error={payments.error?.message ?? null} />
        </div>
      ) : null}
      {tab === "entries" ? <PaymentTable payments={payments.data?.data ?? []} isLoading={payments.isLoading} error={payments.error?.message ?? null} /> : null}
      {tab === "insurances" ? (
        <div className="grid gap-5">
          <section className="grid gap-4 rounded-md border border-clinic-border bg-clinic-surface p-5">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-clinic-primary" />
              <h2 className="font-semibold text-clinic-text">Cadastro de convênios</h2>
            </div>
            <InsuranceForm
              defaultValues={defaultInsuranceValues}
              isPending={createInsurance.isPending}
              onSubmit={async (values) => {
                await createInsurance.mutateAsync(values);
                pushToast({ type: "success", title: "Convênio cadastrado", description: "O desconto já estará disponível no agendamento." });
              }}
            />
          </section>
          <section className="grid gap-4 md:grid-cols-3">
            {paginatedInsurances.map((insurance) => <InsuranceCard key={insurance.id} insurance={insurance} />)}
          </section>
          <PageSelector
            currentPage={safeInsurancePage}
            totalPages={insuranceTotalPages}
            totalItems={insuranceData.length}
            pageSize={insurancePageSize}
            onPageChange={setInsurancePage}
          />
        </div>
      ) : null}
      {tab === "pending" ? <PendingPayments payments={pending.data ?? []} isLoading={pending.isLoading} error={pending.error?.message ?? null} /> : null}
    </div>
  );
};

export default FinancialPage;
