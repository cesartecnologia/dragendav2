import { asc, eq, and } from "drizzle-orm";
import { getDb } from "../db";
import { insuranceFromRow } from "../db/mappers";
import { insurances } from "../db/schema";
import type { Insurance, InsuranceCoverageRule } from "../types";

export type InsuranceCreateInput = Omit<
  Insurance,
  "id" | "clinicId" | "createdAt"
>;

export const createInsurance = async (
  clinicId: string,
  data: InsuranceCreateInput,
): Promise<Insurance> => {
  const row = (
    await getDb()
      .insert(insurances)
      .values({
        clinicId,
        name: data.name,
        ansCode: data.ansCode,
        discountPercent: data.discountPercent,
        active: data.active,
        coverageRules: data.coverageRules,
      })
      .returning()
  )[0];

  if (row === undefined) {
    throw new Error("Não foi possível criar convênio");
  }

  return insuranceFromRow(row);
};

export const updateInsurance = async (
  clinicId: string,
  id: string,
  data: Partial<Insurance>,
): Promise<void> => {
  await getDb()
    .update(insurances)
    .set({
      name: data.name,
      ansCode: data.ansCode,
      discountPercent: data.discountPercent,
      active: data.active,
      coverageRules: data.coverageRules,
      updatedAt: new Date(),
    })
    .where(and(eq(insurances.clinicId, clinicId), eq(insurances.id, id)));
};

export const deleteInsurance = async (
  clinicId: string,
  id: string,
): Promise<void> => {
  await getDb()
    .delete(insurances)
    .where(and(eq(insurances.clinicId, clinicId), eq(insurances.id, id)));
};

export const getInsurances = async (clinicId: string): Promise<Insurance[]> => {
  const rows = await getDb()
    .select()
    .from(insurances)
    .where(eq(insurances.clinicId, clinicId))
    .orderBy(asc(insurances.name));

  return rows.map(insuranceFromRow);
};

export const getCoverageRule = async (
  clinicId: string,
  insuranceId: string,
  specialty: string,
): Promise<InsuranceCoverageRule | null> => {
  const insurance = (await getInsurances(clinicId)).find(
    (item) => item.id === insuranceId,
  );

  return (
    insurance?.coverageRules.find((item) => item.specialty === specialty) ?? null
  );
};
