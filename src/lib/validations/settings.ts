import { z } from "zod";
import { addressSchema } from "./patient";

export const companySettingsSchema = z.object({
  name: z.string().min(2, "Informe o nome da clínica"),
  cnpj: z.string().min(14, "Informe um CNPJ válido"),
  phone: z.string().min(10, "Informe um telefone válido"),
  email: z.string().email("Email inválido"),
  address: addressSchema,
  logoUrl: z.string().url("URL do logo inválida").or(z.literal("")),
  logoPublicId: z.string(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida"),
});

export const whatsappSettingsSchema = z.object({
  whatsappApiUrl: z.string().url("URL inválida"),
  whatsappToken: z.string().min(1, "Informe o token"),
  whatsappPhone: z.string().min(10, "Informe o número"),
});

export const specialtySchema = z.object({
  name: z.string().min(2, "Informe a especialidade"),
});

export const userSettingsSchema = z.object({
  name: z.string().min(2, "Informe o nome"),
  email: z.string().email("Email inválido"),
  role: z.union([
    z.literal("OWNER"),
    z.literal("ADMIN"),
    z.literal("RECEPTIONIST"),
  ]),
  active: z.boolean(),
});

export type CompanySettingsFormValues = z.infer<typeof companySettingsSchema>;
export type WhatsappSettingsFormValues = z.infer<typeof whatsappSettingsSchema>;
export type SpecialtyFormValues = z.infer<typeof specialtySchema>;
export type UserSettingsFormValues = z.infer<typeof userSettingsSchema>;

