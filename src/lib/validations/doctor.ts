import { z } from "zod";

export const workDaySchema = z.object({
  weekday: z.union([
    z.literal(0),
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6),
  ]),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Informe o início"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Informe o fim"),
  slotMin: z.coerce.number().min(5, "Mínimo de 5 minutos"),
  maxPatients: z.coerce.number().min(1, "Informe pelo menos 1 paciente"),
});

export const workDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Informe o início"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Informe o fim"),
  slotMin: z.coerce.number().min(5, "Mínimo de 5 minutos"),
});

export const consultationPeriodSchema = z.object({
  id: z.string().min(1, "Identificador obrigatório"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data inicial"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data final"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Informe o início"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Informe o fim"),
  slotMin: z.coerce.number().min(5, "Mínimo de 5 minutos"),
  maxPatients: z.coerce.number().min(1, "Informe pelo menos 1 paciente"),
});

export const vacationSchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe o início"),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe o fim"),
});

export const doctorSchema = z.object({
  name: z.string().min(2, "Informe o nome do médico"),
  crm: z.string().min(4, "Informe um CRM válido"),
  specialty: z.string().min(1, "Selecione a especialidade"),
  phone: z.string().min(10, "Informe um telefone válido"),
  email: z.string().email("Email inválido").or(z.literal("")),
  photoUrl: z.string().url("URL da foto inválida").or(z.literal("")),
  photoPublicId: z.string(),
  consultationPrice: z.coerce.number().min(0, "Informe o valor da consulta"),
  active: z.boolean(),
  workDays: z.array(workDaySchema),
  workDates: z.array(workDateSchema),
  periods: z.array(consultationPeriodSchema).min(1, "Informe pelo menos um período"),
  vacations: z.array(vacationSchema),
});

export type DoctorFormValues = z.infer<typeof doctorSchema>;
export type WorkDayFormValues = z.infer<typeof workDaySchema>;
export type WorkDateFormValues = z.infer<typeof workDateSchema>;
export type ConsultationPeriodFormValues = z.infer<typeof consultationPeriodSchema>;
export type VacationFormValues = z.infer<typeof vacationSchema>;
