import { z } from "zod";
import { isValidCpf } from "../utils/cpf";

export const addressSchema = z.object({
  cep: z.string().min(8, "Informe o CEP"),
  street: z.string().min(1, "Informe a rua"),
  number: z.string().min(1, "Informe o número"),
  complement: z.string(),
  neighborhood: z.string().min(1, "Informe o bairro"),
  city: z.string().min(1, "Informe a cidade"),
  state: z.string().length(2, "Informe a UF"),
});

const optionalPhoneSchema = z
  .string()
  .refine(
    (value) => value.length === 0 || value.length >= 10,
    "Informe um telefone válido",
  );

const patientAddressSchema = z.object({
  cep: z.string(),
  street: z.string(),
  number: z.string(),
  complement: z.string(),
  neighborhood: z.string(),
  city: z.string(),
  state: z
    .string()
    .refine((value) => value.length === 0 || value.length === 2, "Informe a UF"),
});

export const patientSchema = z.object({
  name: z.string().min(2, "Informe o nome completo"),
  cpf: z.string().refine(isValidCpf, "CPF inválido"),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida"),
  phone: optionalPhoneSchema,
  email: z.string().email("Email inválido").or(z.literal("")),
  address: patientAddressSchema,
  gender: z.union([z.literal("M"), z.literal("F"), z.literal("O")], {
    errorMap: () => ({ message: "Selecione o gênero" }),
  }),
  healthInsurance: z.string(),
  notes: z.string().max(2000, "Use no máximo 2000 caracteres"),
  active: z.boolean(),
});

export type PatientFormValues = z.infer<typeof patientSchema>;
