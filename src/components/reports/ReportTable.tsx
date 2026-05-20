"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { ReportRow } from "../../lib/types";
import { sentenceCase } from "../../lib/utils/labels";
import { formatMoney } from "../../lib/utils/money";
import { DataTable } from "../shared/DataTable";

export type ReportTableProps = {
  rows: ReportRow[];
  isLoading: boolean;
  error: string | null;
};

export const ReportTable = ({ rows, isLoading, error }: ReportTableProps): JSX.Element => {
  const keys = Object.keys(rows[0] ?? { mensagem: "Sem dados" });
  const columns: ColumnDef<ReportRow>[] = keys.map((key) => ({
    accessorKey: key,
    header: sentenceCase(key),
    cell: ({ row }) => {
      const value = row.original[key];
      return typeof value === "number" && ["total", "receita", "ticketMedio", "cobertura", "copay"].includes(key)
        ? formatMoney(value)
        : String(value ?? "");
    },
  }));

  return <DataTable data={rows} columns={columns} isLoading={isLoading} error={error} emptyTitle="Sem dados" emptyDescription="Ajuste os filtros para visualizar o relatório." />;
};
