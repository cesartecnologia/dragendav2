"use client";

import { Bell, Menu, Search } from "lucide-react";

export const Topbar = (): JSX.Element => {
  return (
    <header className="sticky top-0 z-20 border-b border-clinic-border bg-clinic-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-md border border-clinic-border p-2 text-clinic-muted md:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="hidden rounded-md border border-clinic-border p-2 text-clinic-muted sm:inline-flex"
            aria-label="Pesquisar"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded-md border border-clinic-border p-2 text-clinic-muted"
            aria-label="Notificações"
          >
            <Bell className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
