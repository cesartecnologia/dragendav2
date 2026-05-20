"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ConfirmDialog } from "../../../../components/shared/ConfirmDialog";
import { EmptyState } from "../../../../components/shared/EmptyState";
import { MoneyInput } from "../../../../components/shared/MoneyInput";
import { PageHeader } from "../../../../components/shared/PageHeader";
import { PageSelector } from "../../../../components/shared/PageSelector";
import { useAuth } from "../../../../lib/hooks/useAuth";
import {
  createExamType,
  getExamTypes,
  updateExamType,
} from "../../../../lib/services/examTypeService";
import { useUiStore } from "../../../../lib/stores/uiStore";
import type { ExamType } from "../../../../lib/types";
import { formatMoney } from "../../../../lib/utils/money";

const examSchema = z.object({
  name: z.string().min(2, "Informe o nome do exame"),
  type: z.string().min(2, "Informe o tipo do exame"),
  amount: z.coerce.number().min(0, "Informe um valor válido"),
  laboratory: z.string().min(2, "Informe o laboratório responsável"),
  active: z.boolean(),
});

type ExamFormValues = z.infer<typeof examSchema>;

const defaultExamValues: ExamFormValues = {
  name: "",
  type: "",
  amount: 0,
  laboratory: "",
  active: true,
};

const permissionMessage =
  "Seu usuário não tem permissão para alterar exames desta clínica.";

const isPermissionError = (error: unknown): boolean => {
  return error instanceof Error && error.message.toLowerCase().includes("permission");
};

const ExamsSettingsPage = (): JSX.Element => {
  const { user } = useAuth();
  const clinicId = user?.clinicId ?? "";
  const canManageExams =
    user?.role === "OWNER" || user?.role === "ADMIN" || user?.role === "RECEPTIONIST";
  const [exams, setExams] = useState<ExamType[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<ExamType | null>(null);
  const [deleteExam, setDeleteExam] = useState<ExamType | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const pushToast = useUiStore((state) => state.pushToast);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema),
    defaultValues: defaultExamValues,
  });

  const filteredExams = useMemo(() => {
    const term = search.trim().toLowerCase();
    return exams.filter((exam) =>
      `${exam.name} ${exam.type} ${exam.laboratory}`.toLowerCase().includes(term),
    );
  }, [exams, search]);
  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filteredExams.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleExams = useMemo(
    () => filteredExams.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredExams, safePage],
  );

  useEffect(() => {
    if (clinicId.length === 0) {
      return;
    }

    let active = true;
    setLoading(true);
    setLoadError(null);

    void getExamTypes(clinicId, true)
      .then((data) => {
        if (!active) {
          return;
        }

        setExams(data);
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        setLoadError(isPermissionError(error) ? permissionMessage : "Não foi possível carregar os exames.");
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [clinicId]);

  useEffect(() => {
    if (!modalOpen) {
      return undefined;
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape" && !actionPending) {
        setModalOpen(false);
        setEditingExam(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [actionPending, modalOpen]);

  const openCreateModal = (): void => {
    setEditingExam(null);
    reset(defaultExamValues);
    setModalOpen(true);
  };

  const openEditModal = (exam: ExamType): void => {
    setEditingExam(exam);
    reset({
      name: exam.name,
      type: exam.type,
      amount: exam.amount,
      laboratory: exam.laboratory,
      active: true,
    });
    setModalOpen(true);
  };

  const closeModal = (): void => {
    if (actionPending) {
      return;
    }

    setEditingExam(null);
    setModalOpen(false);
  };

  const submitExam = async (values: ExamFormValues): Promise<void> => {
    if (!canManageExams || clinicId.length === 0) {
      pushToast({
        type: "error",
        title: "Permissão insuficiente",
        description: permissionMessage,
      });
      return;
    }

    setActionPending(true);

    try {
      if (editingExam === null) {
        const created = await createExamType(clinicId, values);
        setExams((current) => [created, ...current].sort((a, b) => a.name.localeCompare(b.name)));
        pushToast({
          type: "success",
          title: "Exame adicionado",
          description: "O exame já está disponível nos agendamentos.",
        });
      } else {
        await updateExamType(clinicId, editingExam.id, values);
        setExams((current) =>
          current
            .map((exam) => (exam.id === editingExam.id ? { ...exam, ...values } : exam))
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
        pushToast({
          type: "success",
          title: "Exame atualizado",
          description: "As alterações foram salvas com sucesso.",
        });
      }

      reset(defaultExamValues);
      setEditingExam(null);
      setModalOpen(false);
    } catch (error: unknown) {
      pushToast({
        type: "error",
        title: editingExam === null ? "Erro ao adicionar" : "Erro ao atualizar",
        description: isPermissionError(error) ? permissionMessage : "Não foi possível salvar o exame.",
      });
    } finally {
      setActionPending(false);
    }
  };

  const confirmDeleteExam = async (): Promise<void> => {
    if (deleteExam === null || clinicId.length === 0 || actionPending) {
      return;
    }

    setActionPending(true);

    try {
      await updateExamType(clinicId, deleteExam.id, { active: false });
      setExams((current) => current.filter((exam) => exam.id !== deleteExam.id));
      setDeleteExam(null);
      pushToast({
        type: "success",
        title: "Exame excluído",
        description: "O exame foi removido da lista.",
      });
    } catch (error: unknown) {
      pushToast({
        type: "error",
        title: "Erro ao excluir",
        description: isPermissionError(error) ? permissionMessage : "Não foi possível excluir o exame.",
      });
    } finally {
      setActionPending(false);
    }
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Exames"
          description="Cadastre os exames disponíveis para agendamento."
        />
        <button
          type="button"
          onClick={openCreateModal}
          disabled={actionPending || !canManageExams}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-clinic-primary px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          Novo exame
        </button>
      </div>
      {!canManageExams ? (
        <div className="rounded-md border border-clinic-warning/30 bg-clinic-warning/10 p-4 text-sm text-clinic-text">
          Você pode consultar os exames cadastrados, mas não pode alterar esta lista.
        </div>
      ) : null}
      <div className="rounded-md border border-clinic-border bg-clinic-surface p-4">
        <label className="grid gap-1 text-sm text-clinic-text">
          Buscar exame
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="rounded-md border border-clinic-border px-3 py-2"
            placeholder="Digite para filtrar a lista"
          />
        </label>
        <p className="mt-2 text-xs text-clinic-muted">
          {search.trim().length > 0
            ? `${filteredExams.length} resultado${filteredExams.length === 1 ? "" : "s"} encontrado${filteredExams.length === 1 ? "" : "s"}`
            : "Exibindo os principais exames. Use a busca para encontrar outros."}
        </p>
      </div>
      {loading ? <div className="h-32 animate-pulse rounded-md bg-clinic-border" /> : null}
      {!loading && loadError !== null ? (
        <EmptyState title="Erro ao carregar exames" description={loadError} />
      ) : null}
      {!loading && loadError === null && exams.length === 0 ? (
        <EmptyState
          title="Nenhum exame"
          description="Clique em Novo exame para cadastrar o primeiro exame."
        />
      ) : null}
      <div className="grid gap-2">
        {visibleExams.map((exam) => (
          <div
            key={exam.id}
            className="flex flex-col gap-3 rounded-md border border-clinic-border bg-clinic-surface p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm font-medium text-clinic-text">{exam.name}</p>
              <p className="text-xs text-clinic-muted">
                {exam.type} · {exam.laboratory} · {formatMoney(exam.amount)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={actionPending || !canManageExams}
                onClick={() => openEditModal(exam)}
                className="inline-flex items-center gap-1 rounded-md border border-clinic-border px-3 py-1 text-sm disabled:opacity-60"
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </button>
              <button
                type="button"
                disabled={actionPending || !canManageExams}
                onClick={() => setDeleteExam(exam)}
                className="inline-flex items-center gap-1 rounded-md border border-clinic-danger/30 px-3 py-1 text-sm text-clinic-danger disabled:opacity-60"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Excluir
              </button>
            </div>
          </div>
        ))}
        {!loading && loadError === null && filteredExams.length === 0 && exams.length > 0 ? (
          <EmptyState
            title="Nenhum exame encontrado"
            description="Tente buscar por outro nome, tipo ou laboratório."
          />
        ) : null}
      </div>
      <PageSelector
        currentPage={safePage}
        totalPages={totalPages}
        totalItems={filteredExams.length}
        pageSize={pageSize}
        onPageChange={setPage}
      />
      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={closeModal}
          role="presentation"
        >
          <form
            onSubmit={handleSubmit(submitExam)}
            onMouseDown={(event) => event.stopPropagation()}
            className="w-full max-w-lg rounded-md bg-clinic-surface p-5 shadow-xl"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-clinic-text">
                {editingExam === null ? "Novo exame" : "Editar exame"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                disabled={actionPending}
                className="rounded-md border border-clinic-border p-2 text-clinic-muted disabled:opacity-60"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 grid gap-3">
              <label className="grid gap-1 text-sm text-clinic-text">
                Nome do exame
                <input
                  {...register("name")}
                  className="rounded-md border border-clinic-border px-3 py-2"
                  placeholder="Ex.: Hemograma completo"
                />
                {errors.name?.message !== undefined ? (
                  <span className="text-xs text-clinic-danger">{errors.name.message}</span>
                ) : null}
              </label>
              <label className="grid gap-1 text-sm text-clinic-text">
                Tipo
                <input
                  {...register("type")}
                  className="rounded-md border border-clinic-border px-3 py-2"
                  placeholder="Ex.: Laboratorial, imagem, cardiológico"
                />
                {errors.type?.message !== undefined ? (
                  <span className="text-xs text-clinic-danger">{errors.type.message}</span>
                ) : null}
              </label>
              <MoneyInput
                id="exam-amount"
                label="Valor do exame"
                value={watch("amount")}
                disabled={actionPending}
                onChange={(value) => setValue("amount", value, { shouldValidate: true })}
                error={errors.amount?.message}
              />
              <label className="grid gap-1 text-sm text-clinic-text">
                Laboratório responsável
                <input
                  {...register("laboratory")}
                  className="rounded-md border border-clinic-border px-3 py-2"
                  placeholder="Nome do laboratório"
                />
                {errors.laboratory?.message !== undefined ? (
                  <span className="text-xs text-clinic-danger">{errors.laboratory.message}</span>
                ) : null}
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                disabled={actionPending}
                className="rounded-md border border-clinic-border px-4 py-2 text-sm text-clinic-text disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={actionPending}
                className="inline-flex items-center gap-2 rounded-md bg-clinic-primary px-4 py-2 text-sm text-white disabled:opacity-60"
              >
                {actionPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {editingExam === null ? "Salvar exame" : "Salvar alterações"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
      <ConfirmDialog
        open={deleteExam !== null}
        title="Excluir exame"
        description={`Deseja excluir ${deleteExam?.name ?? "este exame"}? Esta ação não poderá ser desfeita.`}
        confirmLabel="Excluir"
        isPending={actionPending}
        onCancel={() => {
          if (!actionPending) {
            setDeleteExam(null);
          }
        }}
        onConfirm={() => {
          void confirmDeleteExam();
        }}
      />
    </div>
  );
};

export default ExamsSettingsPage;
