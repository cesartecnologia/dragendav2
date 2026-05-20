"use client";

import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { EmptyState } from "./EmptyState";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { PageSelector } from "./PageSelector";

export type DataTableProps<T extends object> = {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading: boolean;
  error: string | null;
  emptyTitle: string;
  emptyDescription: string;
};

export const DataTable = <T extends object>({
  data,
  columns,
  isLoading,
  error,
  emptyTitle,
  emptyDescription,
}: DataTableProps<T>): JSX.Element => {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedData = useMemo(
    () => data.slice((safePage - 1) * pageSize, safePage * pageSize),
    [data, safePage],
  );
  const table = useReactTable({
    data: paginatedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return <LoadingSkeleton variant="table" />;
  }

  if (error !== null) {
    return (
      <EmptyState
        title="Erro ao carregar"
        description={error}
      />
    );
  }

  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="grid gap-3">
      <div className="overflow-hidden rounded-md border border-clinic-border bg-clinic-surface">
        <table className="hidden w-full border-collapse text-sm md:table">
          <thead className="bg-clinic-bg text-left text-clinic-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 font-medium">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t border-clinic-border">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 text-clinic-text">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="divide-y divide-clinic-border md:hidden">
          {table.getRowModel().rows.map((row) => (
            <div key={row.id} className="space-y-2 p-4">
              {row.getVisibleCells().slice(0, 4).map((cell) => (
                <div key={cell.id} className="text-sm text-clinic-text">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
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
