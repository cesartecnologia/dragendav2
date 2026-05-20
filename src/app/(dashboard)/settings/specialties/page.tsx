"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { PageHeader } from "../../../../components/shared/PageHeader";
import { EmptyState } from "../../../../components/shared/EmptyState";
import { useAuth } from "../../../../lib/hooks/useAuth";
import { useCreateSpecialty, useSpecialties, useUpdateSpecialty } from "../../../../lib/hooks/useSpecialties";
import { useUiStore } from "../../../../lib/stores/uiStore";
import { getSpecialtyColor } from "../../../../lib/utils/specialtyColor";

const SpecialtiesSettingsPage = (): JSX.Element => {
  const { user } = useAuth();
  const clinicId = user?.clinicId ?? "";
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const specialties = useSpecialties(clinicId);
  const create = useCreateSpecialty(clinicId);
  const update = useUpdateSpecialty(clinicId);
  const pushToast = useUiStore((state) => state.pushToast);
  const filteredSpecialties = (specialties.data ?? []).filter((specialty) =>
    specialty.name.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const visibleSpecialties = search.trim().length > 0 ? filteredSpecialties : filteredSpecialties.slice(0, 12);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader title="Especialidades" description="Gerencie as especialidades disponíveis para médicos e agendamentos." />
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          disabled={create.isPending}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-clinic-primary px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          Nova especialidade
        </button>
      </div>
      <div className="rounded-md border border-clinic-border bg-clinic-surface p-4">
        <label className="grid gap-1 text-sm text-clinic-text">
          Buscar especialidade
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="rounded-md border border-clinic-border px-3 py-2"
            placeholder="Digite para filtrar a lista"
          />
        </label>
        <p className="mt-2 text-xs text-clinic-muted">
          {search.trim().length > 0
            ? `${visibleSpecialties.length} resultado${visibleSpecialties.length === 1 ? "" : "s"} encontrado${visibleSpecialties.length === 1 ? "" : "s"}`
            : "Exibindo as principais especialidades. Use a busca para encontrar outras."}
        </p>
      </div>
      {specialties.isLoading ? (
        <div className="h-32 animate-pulse rounded-md bg-clinic-border" />
      ) : null}
      {specialties.error !== null ? (
        <EmptyState
          title="Erro ao carregar especialidades"
          description={specialties.error.message}
        />
      ) : null}
      {!specialties.isLoading && specialties.data?.length === 0 ? (
        <EmptyState
          title="Nenhuma especialidade"
          description="As especialidades comuns serão criadas automaticamente."
        />
      ) : null}
      <div className="grid gap-2">
        {visibleSpecialties.map((specialty) => (
          (() => {
            const color = getSpecialtyColor(specialty.name);
            return (
          <div
            key={specialty.id}
            className="flex items-center justify-between rounded-md border border-clinic-border bg-clinic-surface p-3"
          >
            <span
              className="rounded-md border px-3 py-1 text-sm font-medium"
              style={{ backgroundColor: color.background, borderColor: color.border, color: color.text }}
            >
              {specialty.name}
            </span>
            <button
              type="button"
              disabled={update.isPending}
              onClick={() =>
                update.mutate(
                  {
                    id: specialty.id,
                    data: { active: !specialty.active },
                  },
                  {
                    onSuccess: () => pushToast({ type: "success", title: "Especialidade atualizada", description: "Status alterado com sucesso." }),
                    onError: () => pushToast({ type: "error", title: "Erro ao atualizar", description: "Não foi possível alterar a especialidade." }),
                  },
                )
              }
              className="rounded-md border border-clinic-border px-3 py-1 text-sm"
            >
              {specialty.active ? "Desativar" : "Ativar"}
            </button>
          </div>
            );
          })()
        ))}
        {!specialties.isLoading && specialties.error === null && visibleSpecialties.length === 0 ? (
          <EmptyState
            title="Nenhuma especialidade encontrada"
            description="Tente buscar por outro nome ou cadastre uma nova especialidade."
          />
        ) : null}
      </div>
      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={() => setModalOpen(false)}
          role="presentation"
        >
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              if (name.trim().length === 0) {
                return;
              }
              try {
                await create.mutateAsync({
                  name: name.trim(),
                  active: true,
                  order: specialties.data?.length ?? 0,
                });
                setName("");
                setModalOpen(false);
                pushToast({ type: "success", title: "Especialidade adicionada", description: "A lista foi atualizada com sucesso." });
              } catch {
                pushToast({ type: "error", title: "Erro ao adicionar", description: "Não foi possível salvar a especialidade." });
              }
            }}
            onMouseDown={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-md bg-clinic-surface p-5 shadow-xl"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-clinic-text">Nova especialidade</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-md border border-clinic-border p-2 text-clinic-muted" aria-label="Fechar">
                <X className="h-4 w-4" />
              </button>
            </div>
            <label className="mt-4 grid gap-1 text-sm text-clinic-text">
              Nome da especialidade
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="rounded-md border border-clinic-border px-3 py-2"
                placeholder="Ex.: Cardiologia"
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} disabled={create.isPending} className="rounded-md border border-clinic-border px-4 py-2 text-sm">
                Cancelar
              </button>
              <button type="submit" disabled={create.isPending} className="rounded-md bg-clinic-primary px-4 py-2 text-sm text-white disabled:opacity-60">
                Salvar
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
};

export default SpecialtiesSettingsPage;
