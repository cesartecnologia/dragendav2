"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, FileSpreadsheet, Filter, TrendingUp } from "lucide-react";
import { ExportButton } from "../../../components/reports/ExportButton";
import { ReportChart } from "../../../components/reports/ReportChart";
import { ReportFilters } from "../../../components/reports/ReportFilters";
import { ReportTable } from "../../../components/reports/ReportTable";
import { PageHeader } from "../../../components/shared/PageHeader";
import { useAuth } from "../../../lib/hooks/useAuth";
import { useClinic } from "../../../lib/hooks/useClinic";
import { getDoctorProductionReport, getFinancialReport, getInsuranceReport } from "../../../lib/services/reportService";
import { generateReportPDF } from "../../../lib/services/pdfService";
import { createDateRange } from "../../../lib/utils/date";
import type { ReportData, ReportRow } from "../../../lib/types";

const downloadBlob = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

const rowValueToCsv = (value: string | number | boolean | null): string => {
  const text = typeof value === "number" ? String(value) : String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
};

const reportToCsv = (data: ReportData): string => {
  const columns = Object.keys(data.rows[0] ?? { mensagem: "Sem dados" });
  const rows = data.rows.length > 0 ? data.rows : [{ mensagem: "Sem dados" } as ReportRow];
  return [columns.join(","), ...rows.map((row) => columns.map((column) => rowValueToCsv(row[column])).join(","))].join("\n");
};

const ReportsPage = (): JSX.Element => {
  const { user } = useAuth();
  const clinicId = user?.clinicId ?? "";
  const [dateRange, setDateRange] = useState(() => createDateRange(new Date(), new Date()));
  const [type, setType] = useState<"financial" | "doctors" | "insurances">("financial");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filters = useMemo(() => ({ dateRange }), [dateRange]);
  const clinic = useClinic(clinicId);
  const report = useQuery({
    queryKey: ["report", clinicId, type, filters],
    queryFn: () => {
      if (type === "doctors") {
        return getDoctorProductionReport(clinicId, filters);
      }

      if (type === "insurances") {
        return getInsuranceReport(clinicId, filters);
      }

      return getFinancialReport(clinicId, filters);
    },
    enabled: clinicId.length > 0,
  });

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <PageHeader title="Relatórios" description="Indicadores reais por período, médico, convênio e financeiro." />
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
        <ReportFilters dateRange={dateRange} onDateRangeChange={setDateRange} />
        </div>
      ) : null}
      <div className="grid gap-3 rounded-md border border-clinic-border bg-clinic-surface p-3 md:grid-cols-3">
        {[
          { value: "financial", label: "Financeiro", icon: TrendingUp },
          { value: "doctors", label: "Produção médica", icon: BarChart3 },
          { value: "insurances", label: "Convênios", icon: FileSpreadsheet },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.value} type="button" onClick={() => setType(item.value as "financial" | "doctors" | "insurances")} className={`flex items-center gap-3 rounded-md border px-4 py-3 text-left text-sm ${type === item.value ? "border-clinic-primary bg-clinic-primary/10 text-clinic-primary" : "border-clinic-border text-clinic-text"}`}>
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="grid gap-3 rounded-md border border-clinic-border bg-clinic-surface p-4 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="text-sm text-clinic-muted">Relatório</p>
          <p className="text-lg font-semibold text-clinic-text">{report.data?.title ?? "-"}</p>
        </div>
        <div className="flex gap-2 md:justify-end">
          <ExportButton
            label="Exportar PDF"
            isPending={false}
            onClick={() => {
              void generateReportPDF(clinic.data ?? null, type, report.data ?? { title: "Relatório", rows: [], totals: {} }, filters).then((blob) => downloadBlob(blob, `relatorio-${type}.pdf`));
            }}
          />
          <ExportButton
            label="Exportar CSV"
            isPending={false}
            onClick={() => {
              const blob = new Blob([reportToCsv(report.data ?? { title: "Relatório", rows: [], totals: {} })], { type: "text/csv;charset=utf-8" });
              downloadBlob(blob, `relatorio-${type}.csv`);
            }}
          />
        </div>
      </div>
      <ReportChart data={report.data?.rows ?? []} isLoading={report.isLoading} error={report.error?.message ?? null} />
      <ReportTable rows={report.data?.rows ?? []} isLoading={report.isLoading} error={report.error?.message ?? null} />
    </div>
  );
};

export default ReportsPage;
