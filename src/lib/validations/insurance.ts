import { z } from "zod";

export const insuranceCoverageRuleSchema = z.object({
  specialty: z.string().min(1, "Informe a especialidade"),
  coveredAmount: z.coerce.number().min(0, "Informe a cobertura"),
  copayAmount: z.coerce.number().min(0, "Informe a coparticipação"),
});

export const insuranceSchema = z.object({
  name: z.string().min(2, "Informe o nome do convênio"),
  ansCode: z.string(),
  discountPercent: z.coerce
    .number()
    .min(0, "Desconto mínimo de 0%")
    .max(100, "Desconto máximo de 100%"),
  active: z.boolean(),
  coverageRules: z.array(insuranceCoverageRuleSchema),
});

export type InsuranceFormValues = z.infer<typeof insuranceSchema>;
export type InsuranceCoverageRuleFormValues = z.infer<
  typeof insuranceCoverageRuleSchema
>;
