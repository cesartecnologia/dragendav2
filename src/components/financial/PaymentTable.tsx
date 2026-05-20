"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Payment } from "../../lib/types";
import { formatDateBR } from "../../lib/utils/date";
import { formatMoney } from "../../lib/utils/money";
import { paymentMethodLabel } from "../../lib/utils/labels";
import { DataTable } from "../shared/DataTable";
import { StatusBadge } from "../shared/StatusBadge";

export type PaymentTableProps = {
  payments: Payment[];
  isLoading: boolean;
  error: string | null;
};

const columns: ColumnDef<Payment>[] = [
  { accessorKey: "date", header: "Data", cell: ({ row }) => formatDateBR(row.original.date) },
  { accessorKey: "patientName", header: "Paciente" },
  { accessorKey: "doctorName", header: "Médico" },
  { accessorKey: "specialty", header: "Especialidade" },
  { accessorKey: "insuranceName", header: "Convênio", cell: ({ row }) => row.original.insuranceName ?? "Particular" },
  { accessorKey: "paymentMethod", header: "Forma", cell: ({ row }) => paymentMethodLabel(row.original.paymentMethod) },
  { accessorKey: "amount", header: "Valor", cell: ({ row }) => <span className="block text-right">{formatMoney(row.original.amount)}</span> },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
];

export const PaymentTable = ({ payments, isLoading, error }: PaymentTableProps): JSX.Element => {
  return <DataTable data={payments} columns={columns} isLoading={isLoading} error={error} emptyTitle="Nenhum pagamento" emptyDescription="Não há lançamentos no período selecionado." />;
};
