import { and, asc, eq } from "drizzle-orm";
import { getDb } from "../db";
import { examTypeFromRow } from "../db/mappers";
import { examTypes } from "../db/schema";
import type { ExamType } from "../types";

export type ExamTypeCreateInput = Omit<ExamType, "id" | "clinicId" | "createdAt">;

export const defaultExamTypes: string[] = [
  "Hemograma completo",
  "Glicemia",
  "Colesterol total e frações",
  "Triglicerídeos",
  "TSH",
  "Eletrocardiograma",
  "Ultrassonografia",
  "Raio-X",
  "Ecocardiograma",
  "Mapa 24h",
  "Holter 24h",
  "Teste ergométrico",
];

export const seedDefaultExamTypes = async (clinicId: string): Promise<void> => {
  const db = getDb();
  const rows = await db
    .select({ name: examTypes.name })
    .from(examTypes)
    .where(eq(examTypes.clinicId, clinicId));
  const current = new Set(rows.map((item) => item.name.trim().toLowerCase()));
  const missing = defaultExamTypes.filter(
    (name) => !current.has(name.trim().toLowerCase()),
  );

  if (missing.length === 0) {
    return;
  }

  await db.insert(examTypes).values(
    missing.map((name) => ({
      clinicId,
      name,
      type: "Laboratorial",
      amount: 0,
      laboratory: "",
      active: true,
    })),
  );
};

export const getExamTypes = async (
  clinicId: string,
  activeOnly = true,
): Promise<ExamType[]> => {
  const rows = await getDb()
    .select()
    .from(examTypes)
    .where(
      activeOnly
        ? and(eq(examTypes.clinicId, clinicId), eq(examTypes.active, true))
        : eq(examTypes.clinicId, clinicId),
    )
    .orderBy(asc(examTypes.name));

  return rows.map(examTypeFromRow);
};

export const createExamType = async (
  clinicId: string,
  data: ExamTypeCreateInput,
): Promise<ExamType> => {
  const row = (
    await getDb()
      .insert(examTypes)
      .values({
        clinicId,
        name: data.name,
        type: data.type,
        amount: data.amount,
        laboratory: data.laboratory,
        active: data.active,
      })
      .returning()
  )[0];

  if (row === undefined) {
    throw new Error("Não foi possível criar exame");
  }

  return examTypeFromRow(row);
};

export const updateExamType = async (
  clinicId: string,
  id: string,
  data: Partial<ExamType>,
): Promise<void> => {
  await getDb()
    .update(examTypes)
    .set({
      name: data.name,
      type: data.type,
      amount: data.amount,
      laboratory: data.laboratory,
      active: data.active,
      updatedAt: new Date(),
    })
    .where(and(eq(examTypes.clinicId, clinicId), eq(examTypes.id, id)));
};

export const deleteExamType = async (
  clinicId: string,
  id: string,
): Promise<void> => {
  await getDb()
    .delete(examTypes)
    .where(and(eq(examTypes.clinicId, clinicId), eq(examTypes.id, id)));
};
