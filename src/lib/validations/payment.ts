import { z } from "zod";
import { PAYMENT_METHOD, PAYMENT_STATUS } from "../types";

export const paymentSchema = z.object({
  appointmentId: z.string().min(1, "Selecione o agendamento"),
  patientId: z.string().min(1, "Informe o paciente"),
  patientName: z.string().min(1, "Informe o paciente"),
  doctorId: z.string().min(1, "Informe o médico"),
  doctorName: z.string().min(1, "Informe o médico"),
  specialty: z.string().min(1, "Informe a especialidade"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida"),
  amount: z.coerce.number().min(0, "Informe um valor válido"),
  paymentMethod: z.nativeEnum(PAYMENT_METHOD, {
    errorMap: () => ({ message: "Forma de pagamento inválida" }),
  }),
  status: z.nativeEnum(PAYMENT_STATUS, {
    errorMap: () => ({ message: "Status inválido" }),
  }),
  insuranceId: z.string().nullable(),
  insuranceName: z.string().nullable(),
  insuranceCoverage: z.coerce.number().min(0, "Informe uma cobertura válida"),
  patientCopay: z.coerce.number().min(0, "Informe uma coparticipação válida"),
  notes: z.string().max(1000, "Use no máximo 1000 caracteres"),
});

export const paymentUpdateSchema = paymentSchema.partial();

export type PaymentFormValues = z.infer<typeof paymentSchema>;
export type PaymentUpdateValues = z.infer<typeof paymentUpdateSchema>;

