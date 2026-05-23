"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { Doctor, ExamType, Insurance, Patient, Slot } from "../../lib/types";
import { formatDateBR, isPastBrazilDateTime, todayISO } from "../../lib/utils/date";
import { formatMoney } from "../../lib/utils/money";
import { MoneyInput } from "../shared/MoneyInput";
import {
  appointmentCreateSchema,
  type AppointmentCreateValues,
} from "../../lib/validations/appointment";

export type AppointmentModalProps = {
  open: boolean;
  isPending: boolean;
  patients: Patient[];
  doctors: Doctor[];
  insurances: Insurance[];
  examTypes: ExamType[];
  slots: Slot[];
  slotsLoading: boolean;
  initialDate: string;
  initialTime: string;
  onDoctorDateChange: (doctorId: string, date: string) => void;
  onClose: () => void;
  onSubmit: (values: AppointmentCreateValues & { patientPhone: string }) => Promise<void>;
};

export const AppointmentModal = ({
  open,
  isPending,
  patients,
  doctors,
  insurances,
  examTypes,
  slots,
  slotsLoading,
  initialDate,
  initialTime,
  onDoctorDateChange,
  onClose,
  onSubmit,
}: AppointmentModalProps): JSX.Element | null => {
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [discountValue, setDiscountValue] = useState(0);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AppointmentCreateValues>({
    resolver: zodResolver(appointmentCreateSchema),
    defaultValues: {
      patientId: "",
      patientName: "",
      doctorId: "",
      doctorName: "",
      specialty: "",
      date: "",
      time: "",
      duration: 30,
      type: "consultation",
      examType: null,
      notes: "",
      insuranceId: null,
      insuranceName: null,
      discountPercent: 0,
      amount: 0,
      paymentMethod: null,
    },
  });
  const doctorId = watch("doctorId");
  const date = watch("date");
  const insuranceId = watch("insuranceId");
  const appointmentType = watch("type");
  const examTypeName = watch("examType");
  const patientSearch = watch("patientName");
  const doctorSearch = watch("doctorName");
  const filteredPatients = useMemo(() => {
    const search = patientSearch.trim().toLowerCase();
    if (search.length < 2) {
      return [];
    }

    return patients
      .filter((patient) => patient.name.toLowerCase().includes(search) || patient.cpf.includes(search.replace(/\D/g, "")))
      .slice(0, 8);
  }, [patientSearch, patients]);
  const filteredDoctors = useMemo(() => {
    const search = doctorSearch.trim().toLowerCase();
    if (search.length < 2) {
      return [];
    }

    return doctors
      .filter((doctor) => doctor.name.toLowerCase().includes(search) || doctor.specialty.toLowerCase().includes(search))
      .slice(0, 8);
  }, [doctorSearch, doctors]);
  const selectedDoctor = useMemo(
    () => doctors.find((doctor) => doctor.id === doctorId),
    [doctorId, doctors],
  );
  const selectedInsurance = useMemo(
    () => insurances.find((insurance) => insurance.id === insuranceId),
    [insurances, insuranceId],
  );
  const selectedExamType = useMemo(
    () => examTypes.find((examType) => examType.name === examTypeName),
    [examTypeName, examTypes],
  );
  const baseAmount =
    appointmentType === "exam"
      ? selectedExamType?.amount ?? 0
      : selectedDoctor?.consultationPrice ?? 0;
  const availableSlots = useMemo(
    () => slots.filter((slot) => !isPastBrazilDateTime(date, slot.time)),
    [date, slots],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    reset({
      patientId: "",
      patientName: "",
      doctorId: "",
      doctorName: "",
      specialty: "",
      date: initialDate,
      time: initialTime,
      duration: 30,
      type: "consultation",
      examType: null,
      notes: "",
      insuranceId: null,
      insuranceName: null,
      discountPercent: 0,
      amount: 0,
      paymentMethod: null,
    });
  }, [initialDate, initialTime, open, reset]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  useEffect(() => {
    if (selectedDoctor !== undefined) {
      setValue("doctorName", selectedDoctor.name);
      setValue("specialty", selectedDoctor.specialty);
      setValue("amount", selectedDoctor.consultationPrice);
    }
  }, [selectedDoctor, setValue]);

  useEffect(() => {
    if (doctorId.length > 0 && date.length > 0) {
      onDoctorDateChange(doctorId, date);
    }
  }, [date, doctorId, onDoctorDateChange]);

  useEffect(() => {
    setValue("discountPercent", 0);
    setValue("amount", appointmentType === "return" ? 0 : baseAmount);
    setValue("insuranceName", selectedInsurance?.name ?? null);
    if (appointmentType === "return") {
      setValue("paymentMethod", null);
      setValue("insuranceId", null);
      setValue("insuranceName", null);
    }
  }, [appointmentType, baseAmount, selectedInsurance, setValue]);

  useEffect(() => {
    setDiscountValue(0);
  }, [baseAmount, insuranceId]);

  if (!open) {
    return null;
  }

  const submit = async (values: AppointmentCreateValues): Promise<void> => {
    if (isPastBrazilDateTime(values.date, values.time)) {
      setValue("time", "", { shouldValidate: true });
      return;
    }

    const patient = patients.find((item) => item.id === values.patientId);
    await onSubmit({ ...values, patientPhone: patient?.phone ?? "" });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onMouseDown={onClose}
      role="presentation"
    >
      <form
        onSubmit={handleSubmit(submit)}
        onMouseDown={(event) => event.stopPropagation()}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-lg bg-clinic-surface p-4 shadow-xl sm:rounded-md sm:p-5"
      >
        <h2 className="text-lg font-semibold text-clinic-text">Novo agendamento</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            Buscar paciente
            <input
              value={watch("patientName")}
              onChange={(event) => {
                setValue("patientName", event.target.value, { shouldValidate: true });
                setValue("patientId", "");
              }}
              className="rounded-md border px-3 py-2"
              placeholder="Digite nome ou CPF"
            />
            {watch("patientId").length === 0 && filteredPatients.length > 0 ? (
              <div className="max-h-40 overflow-auto rounded-md border border-clinic-border bg-white">
                {filteredPatients.map((patient) => (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => {
                      setValue("patientId", patient.id, { shouldValidate: true });
                      setValue("patientName", patient.name, { shouldValidate: true });
                    }}
                    className="block w-full px-3 py-2 text-left hover:bg-clinic-bg"
                  >
                    {patient.name}
                  </button>
                ))}
              </div>
            ) : null}
          </label>
          <label className="grid gap-1 text-sm">
            Buscar médico
            <input
              value={watch("doctorName")}
              onChange={(event) => {
                setValue("doctorName", event.target.value, { shouldValidate: true });
                setValue("doctorId", "");
                setValue("time", "");
              }}
              className="rounded-md border px-3 py-2"
              placeholder="Digite nome ou especialidade"
            />
            {watch("doctorId").length === 0 && filteredDoctors.length > 0 ? (
              <div className="max-h-40 overflow-auto rounded-md border border-clinic-border bg-white">
                {filteredDoctors.map((doctor) => (
                  <button
                    key={doctor.id}
                    type="button"
                    onClick={() => {
                      setValue("doctorId", doctor.id, { shouldValidate: true });
                      setValue("doctorName", doctor.name, { shouldValidate: true });
                      setValue("specialty", doctor.specialty, { shouldValidate: true });
                      setValue("time", "");
                    }}
                    className="block w-full px-3 py-2 text-left hover:bg-clinic-bg"
                  >
                    {doctor.name} · {doctor.specialty}
                  </button>
                ))}
              </div>
            ) : null}
          </label>
          <label className="grid gap-1 text-sm">
            Data
            <input type="date" min={todayISO()} {...register("date")} className="rounded-md border px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm">
            Horário
            <select {...register("time")} disabled={slotsLoading || availableSlots.length === 0} className="rounded-md border px-3 py-2 disabled:opacity-60">
              <option value="">{slotsLoading ? "Carregando..." : availableSlots.length === 0 ? "Sem horários futuros" : "Selecione"}</option>
              {availableSlots.map((slot) => (
                <option key={slot.time} value={slot.time}>
                  {slot.time}
                </option>
              ))}
            </select>
            {errors.time?.message !== undefined ? (
              <span className="text-xs text-clinic-danger">{errors.time.message}</span>
            ) : null}
          </label>
          {appointmentType !== "return" ? (
          <label className="grid gap-1 text-sm">
            Convênio
            <select
              value={watch("insuranceId") ?? ""}
              onChange={(event) => {
                const value = event.target.value.length > 0 ? event.target.value : null;
                setValue("insuranceId", value);
                if (value !== null) {
                  setDiscountModalOpen(true);
                } else {
                  setValue("amount", baseAmount, { shouldValidate: true });
                  setValue("discountPercent", 0);
                }
              }}
              className="rounded-md border px-3 py-2"
            >
              <option value="">Particular</option>
              {insurances.map((insurance) => (
                <option key={insurance.id} value={insurance.id}>
                  {insurance.name}
                </option>
              ))}
            </select>
          </label>
          ) : null}
          <label className="grid gap-1 text-sm">
            Tipo
            <select
              {...register("type")}
              onChange={(event) => {
                setValue("type", event.target.value as AppointmentCreateValues["type"], { shouldValidate: true });
                if (event.target.value !== "exam") {
                  setValue("examType", null);
                }
              }}
              className="rounded-md border px-3 py-2"
            >
              <option value="consultation">Consulta</option>
              <option value="return">Retorno</option>
              <option value="exam">Exame</option>
              <option value="procedure">Procedimento</option>
            </select>
          </label>
          {appointmentType === "exam" ? (
            <label className="grid gap-1 text-sm">
              Tipo de exame
              <select
                value={watch("examType") ?? ""}
                onChange={(event) => setValue("examType", event.target.value.length > 0 ? event.target.value : null, { shouldValidate: true })}
                className="rounded-md border px-3 py-2"
              >
                <option value="">Selecione</option>
                {examTypes.map((examType) => (
                  <option key={examType.id} value={examType.name}>
                    {examType.name} · {examType.type ?? "Tipo não informado"} · {formatMoney(examType.amount ?? 0)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {appointmentType !== "return" ? (
          <label className="grid gap-1 text-sm">
            Pagamento
            <select
              value={watch("paymentMethod") ?? ""}
              onChange={(event) =>
                setValue(
                  "paymentMethod",
                  event.target.value.length > 0
                    ? (event.target.value as AppointmentCreateValues["paymentMethod"])
                    : null,
                )
              }
              className="rounded-md border px-3 py-2"
            >
              <option value="">Pagar depois</option>
              <option value="debit">Débito</option>
              <option value="credit">Crédito</option>
              <option value="pix">Pix</option>
              <option value="cash">Dinheiro</option>
            </select>
          </label>
          ) : null}
        </div>
        <div className="mt-4 rounded-md bg-clinic-bg p-3 text-sm text-clinic-text">
          <p>Especialidade: {watch("specialty") || "-"}</p>
          {appointmentType === "exam" && selectedExamType !== undefined ? (
            <p>Laboratório: {selectedExamType.laboratory ?? "Não informado"}</p>
          ) : null}
          {appointmentType !== "return" ? <p>Valor base: {formatMoney(baseAmount)}</p> : null}
          <p className="font-semibold">{appointmentType === "return" ? "Retorno sem cobrança" : `Valor final: ${formatMoney(watch("amount"))}`}</p>
          {date.length > 0 ? <p>Data selecionada: {formatDateBR(date)}</p> : null}
        </div>
        <label className="mt-3 grid gap-1 text-sm">
          Observações
          <textarea {...register("notes")} className="rounded-md border px-3 py-2" />
        </label>
        {Object.values(errors).length > 0 ? (
          <p className="mt-3 text-sm text-clinic-danger">Revise os campos obrigatórios</p>
        ) : null}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-md border px-4 py-2"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-md bg-clinic-primary px-4 py-2 text-white disabled:opacity-60"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Agendar
          </button>
        </div>
        {discountModalOpen ? (
          <div
            className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
            onMouseDown={() => setDiscountModalOpen(false)}
            role="presentation"
          >
            <div
              className="w-full max-w-md rounded-t-lg bg-clinic-surface p-4 shadow-xl sm:rounded-md sm:p-5"
              onMouseDown={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-clinic-text">Desconto do convênio</h3>
                <button type="button" onClick={() => setDiscountModalOpen(false)} className="rounded-md border border-clinic-border p-2 text-clinic-muted" aria-label="Fechar">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 text-sm text-clinic-muted">
                Informe o valor do desconto para este agendamento.
              </p>
              <div className="mt-4 grid gap-3">
                <p className="rounded-md bg-clinic-bg p-3 text-sm text-clinic-text">
                  Valor base: <strong>{formatMoney(baseAmount)}</strong>
                </p>
                <MoneyInput
                  id="appointment-discount"
                  label="Valor do desconto"
                  value={discountValue}
                  onChange={(value) => setDiscountValue(Math.min(value, baseAmount))}
                />
                <p className="rounded-md bg-clinic-bg p-3 text-sm text-clinic-text">
                  Valor final: <strong>{formatMoney(Math.max(baseAmount - discountValue, 0))}</strong>
                </p>
              </div>
              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setDiscountModalOpen(false)} className="rounded-md border border-clinic-border px-4 py-2 text-sm">
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const finalAmount = Math.max(baseAmount - discountValue, 0);
                    setValue("amount", finalAmount, { shouldValidate: true });
                    setValue("discountPercent", baseAmount > 0 ? Math.round((discountValue / baseAmount) * 100) : 0);
                    setDiscountModalOpen(false);
                  }}
                  className="rounded-md bg-clinic-primary px-4 py-2 text-sm text-white"
                >
                  Aplicar desconto
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </form>
    </div>
  );
};
