import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { clinicFromRow } from "../db/mappers";
import { clinics } from "../db/schema";
import type { Clinic } from "../types";

export type ClinicUpdateInput = Omit<Clinic, "id" | "createdAt">;

export const getClinicById = async (clinicId: string): Promise<Clinic | null> => {
  const row = (
    await getDb()
      .select()
      .from(clinics)
      .where(eq(clinics.id, clinicId))
      .limit(1)
  )[0];

  return row === undefined ? null : clinicFromRow(row);
};

export const updateClinic = async (
  clinicId: string,
  data: Partial<ClinicUpdateInput>,
): Promise<void> => {
  await getDb()
    .update(clinics)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(clinics.id, clinicId));
};
