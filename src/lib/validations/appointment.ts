import { z } from "zod";
import { APPOINTMENT_STATUS, APPOINTMENT_TYPE, PAYMENT_METHOD, PAYMENT_STATUS } from "../types";
import { isPastBrazilDateTime } from "../utils/date";

const appointmentBaseSchema = z.object({
  patientId: z.string().min(1, "Selecione um paciente"),
  patientName: z.string().min(1, "Informe o paciente"),
  doctorId: z.string().min(1, "Selecione um médico"),
  doctorName: z.string().min(1, "Informe o médico"),
  specialty: z.string().min(1, "Informe a especialidade"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Informe um horário válido"),
  duration: z.coerce.number().min(5, "Duração mínima de 5 minutos"),
  status: z.nativeEnum(APPOINTMENT_STATUS, {
    errorMap: () => ({ message: "Status inválido" }),
  }),
  paymentStatus: z.nativeEnum(PAYMENT_STATUS, {
    errorMap: () => ({ message: "Status de pagamento inválido" }),
  }),
  type: z.nativeEnum(APPOINTMENT_TYPE, {
    errorMap: () => ({ message: "Tipo inválido" }),
  }),
  examType: z.string().nullable(),
  notes: z.string().max(1000, "Use no máximo 1000 caracteres"),
  whatsappSent: z.boolean(),
  insuranceId: z.string().nullable(),
  insuranceName: z.string().nullable(),
  discountPercent: z.coerce.number().min(0, "Desconto inválido").max(100, "Desconto máximo de 100%"),
  amount: z.coerce.number().min(0, "Valor inválido"),
  paymentMethod: z.nativeEnum(PAYMENT_METHOD, {
    errorMap: () => ({ message: "Forma de pagamento inválida" }),
  }).nullable(),
});

export const appointmentSchema = appointmentBaseSchema.refine((values) => !isPastBrazilDateTime(values.date, values.time), {
  path: ["time"],
  message: "Selecione uma data e horário futuros",
});

export const appointmentCreateSchema = appointmentBaseSchema.omit({
  status: true,
  paymentStatus: true,
  whatsappSent: true,
}).refine((values) => !isPastBrazilDateTime(values.date, values.time), {
  path: ["time"],
  message: "Selecione uma data e horário futuros",
});

export const appointmentUpdateSchema = appointmentBaseSchema.partial();

export type AppointmentFormValues = z.infer<typeof appointmentSchema>;
export type AppointmentCreateValues = z.infer<typeof appointmentCreateSchema>;
export type AppointmentUpdateValues = z.infer<typeof appointmentUpdateSchema>;
