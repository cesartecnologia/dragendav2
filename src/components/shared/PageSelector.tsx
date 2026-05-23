"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export type PageSelectorProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

export const PageSelector = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: PageSelectorProps): JSX.Element | null => {
  if (totalPages <= 1) {
    return null;
  }

  const firstItem = (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col gap-2 rounded-md border border-clinic-border bg-clinic-surface p-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-clinic-muted">
        Mostrando {firstItem} a {lastItem} de {totalItems}
      </p>
      <div className="inline-flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-clinic-border text-clinic-text disabled:opacity-40"
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-16 text-center text-sm font-medium text-clinic-text sm:min-w-20">
          {currentPage} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-clinic-border text-clinic-text disabled:opacity-40"
          aria-label="Próxima página"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
