"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, UserPlus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { EmptyState } from "../../../components/shared/EmptyState";
import { PageHeader } from "../../../components/shared/PageHeader";
import { createSecondaryAuthUser, getAuthErrorMessage } from "../../../lib/firebase/auth";
import { useAuth } from "../../../lib/hooks/useAuth";
import { useCreateEmployee, useEmployees, useUpdateEmployee } from "../../../lib/hooks/useEmployees";
import { useUiStore } from "../../../lib/stores/uiStore";
import { ROLES, type Role } from "../../../lib/types";

const employeeSchema = z.object({
  name: z.string().min(2, "Informe o nome"),
  email: z.string().email("Informe um email válido"),
  phone: z.string().min(10, "Informe o telefone"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  role: z.enum([ROLES.ADMIN, ROLES.RECEPTIONIST], {
    errorMap: () => ({ message: "Selecione o perfil" }),
  }),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

const roleLabels: Record<Role, string> = {
  OWNER: "Proprietário",
  ADMIN: "Administrador",
  RECEPTIONIST: "Recepção",
};

const UsersPage = (): JSX.Element => {
  const [createOpen, setCreateOpen] = useState(false);
  const { user } = useAuth();
  const clinicId = user?.clinicId ?? "";
  const employees = useEmployees(clinicId);
  const createEmployee = useCreateEmployee(clinicId);
  const updateEmployee = useUpdateEmployee(clinicId);
  const pushToast = useUiStore((state) => state.pushToast);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      role: ROLES.RECEPTIONIST,
    },
  });

  const onSubmit = async (values: EmployeeFormValues): Promise<void> => {
    try {
      const credential = await createSecondaryAuthUser({
        email: values.email,
        password: values.password,
      });

      await createEmployee.mutateAsync({
        firebaseUid: credential.user.uid,
        name: values.name,
        email: values.email,
        phone: values.phone,
        role: values.role,
        active: true,
      });

      reset();
      setCreateOpen(false);
      pushToast({ type: "success", title: "Funcionário cadastrado", description: "O acesso foi criado para a clínica atual." });
    } catch (error: unknown) {
      setError("root", { message: getAuthErrorMessage(error) });
      pushToast({ type: "error", title: "Erro ao cadastrar", description: getAuthErrorMessage(error) });
    }
  };

  useEffect(() => {
    if (!createOpen) {
      return undefined;
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setCreateOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [createOpen]);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader title="Funcionários" description="Gerencie os acessos da equipe à clínica." />
        <button
          type="button"
          onClick={() => {
            reset();
            setCreateOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-clinic-primary px-4 py-2 text-sm font-medium text-white"
        >
          <UserPlus className="h-4 w-4" />
          Novo funcionário
        </button>
      </div>
      {employees.isLoading ? <div className="h-32 animate-pulse rounded-md bg-clinic-border" /> : null}
      {employees.error !== null ? <EmptyState title="Erro ao carregar funcionários" description={employees.error.message} /> : null}
      {!employees.isLoading && employees.data?.length === 0 ? <EmptyState title="Nenhum funcionário" description="Cadastre o primeiro funcionário para liberar o acesso." /> : null}
      <div className="grid gap-3">
        {(employees.data ?? []).map((employee) => (
          <div key={employee.id} className="flex flex-col gap-3 rounded-md border border-clinic-border bg-clinic-surface p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-clinic-text">{employee.name}</p>
              <p className="text-sm text-clinic-muted">{employee.email} · {roleLabels[employee.role]}</p>
            </div>
            <button
              type="button"
              disabled={updateEmployee.isPending}
              onClick={() =>
                updateEmployee.mutate(
                  { id: employee.id, data: { active: !employee.active } },
                  {
                    onSuccess: () => pushToast({ type: "success", title: "Funcionário atualizado", description: "Status alterado com sucesso." }),
                    onError: () => pushToast({ type: "error", title: "Erro ao atualizar", description: "Não foi possível alterar o funcionário." }),
                  },
                )
              }
              className="rounded-md border border-clinic-border px-3 py-2 text-sm"
            >
              {employee.active ? "Desativar" : "Ativar"}
            </button>
          </div>
        ))}
      </div>
      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onMouseDown={() => setCreateOpen(false)} role="presentation">
          <form
            onSubmit={handleSubmit(onSubmit)}
            onMouseDown={(event) => event.stopPropagation()}
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-lg bg-clinic-surface p-4 shadow-xl sm:rounded-md sm:p-5"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-clinic-text">Novo funcionário</h2>
                <p className="mt-1 text-sm text-clinic-muted">Crie o acesso com email, senha inicial e perfil.</p>
              </div>
              <button type="button" onClick={() => setCreateOpen(false)} className="rounded-md border border-clinic-border p-2 text-clinic-muted" aria-label="Fechar">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 text-sm text-clinic-text">
                Nome
                <input {...register("name")} className="rounded-md border border-clinic-border px-3 py-2" />
                {errors.name !== undefined ? <span className="text-xs text-clinic-danger">{errors.name.message}</span> : null}
              </label>
              <label className="grid gap-1 text-sm text-clinic-text">
                Email
                <input type="email" {...register("email")} className="rounded-md border border-clinic-border px-3 py-2" />
                {errors.email !== undefined ? <span className="text-xs text-clinic-danger">{errors.email.message}</span> : null}
              </label>
              <label className="grid gap-1 text-sm text-clinic-text">
                Telefone
                <input {...register("phone")} className="rounded-md border border-clinic-border px-3 py-2" />
                {errors.phone !== undefined ? <span className="text-xs text-clinic-danger">{errors.phone.message}</span> : null}
              </label>
              <label className="grid gap-1 text-sm text-clinic-text">
                Senha inicial
                <input type="password" {...register("password")} className="rounded-md border border-clinic-border px-3 py-2" />
                {errors.password !== undefined ? <span className="text-xs text-clinic-danger">{errors.password.message}</span> : null}
              </label>
              <label className="grid gap-1 text-sm text-clinic-text">
                Perfil
                <select {...register("role")} className="rounded-md border border-clinic-border px-3 py-2">
                  <option value={ROLES.RECEPTIONIST}>Recepção</option>
                  <option value={ROLES.ADMIN}>Administrador</option>
                </select>
              </label>
            </div>
            {errors.root !== undefined ? <p className="mt-4 text-sm text-clinic-danger">{errors.root.message}</p> : null}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setCreateOpen(false)} disabled={isSubmitting || createEmployee.isPending} className="rounded-md border border-clinic-border px-4 py-2 text-sm">
                Cancelar
              </button>
              <button type="submit" disabled={isSubmitting || createEmployee.isPending} className="inline-flex items-center justify-center gap-2 rounded-md bg-clinic-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
                {isSubmitting || createEmployee.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Criar funcionário
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
};

export default UsersPage;
