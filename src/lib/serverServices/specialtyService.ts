import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb } from "../db";
import { specialtyFromRow } from "../db/mappers";
import { specialties } from "../db/schema";
import type { Specialty } from "../types";

export type SpecialtyCreateInput = Omit<
  Specialty,
  "id" | "clinicId" | "createdAt"
>;

export const defaultSpecialties: string[] = [
  "Acupuntura",
  "Alergologia",
  "Angiologia",
  "Biomedicina Estética",
  "Cardiologia",
  "Clínica Geral",
  "Dermatologia",
  "Diagnóstico por Imagem",
  "Endocrinologia",
  "Endodontia",
  "Estética Facial",
  "Fisioterapia",
  "Fonoaudiologia",
  "Gastroenterologia",
  "Geriatria",
  "Ginecologia",
  "Hematologia",
  "Homeopatia",
  "Implantodontia",
  "Imunologia",
  "Infectologia",
  "Mastologia",
  "Medicina da Família",
  "Medicina do Trabalho",
  "Medicina Esportiva",
  "Nefrologia",
  "Neurologia",
  "Nutrição",
  "Nutrologia",
  "Obstetrícia",
  "Odontologia Geral",
  "Odontopediatria",
  "Oftalmologia",
  "Oncologia",
  "Ortopedia",
  "Ortodontia",
  "Otorrinolaringologia",
  "Pediatria",
  "Periodontia",
  "Pneumologia",
  "Proctologia",
  "Psicologia",
  "Psiquiatria",
  "Radiologia",
  "Reumatologia",
  "Terapia Ocupacional",
  "Ultrassonografia",
  "Urologia",
];

export const seedDefaultSpecialties = async (
  clinicId: string,
): Promise<void> => {
  const db = getDb();
  const rows = await db
    .select({ name: specialties.name })
    .from(specialties)
    .where(eq(specialties.clinicId, clinicId));
  const existing = new Set(rows.map((row) => row.name.trim().toLowerCase()));
  const missing = defaultSpecialties.filter(
    (name) => !existing.has(name.trim().toLowerCase()),
  );

  if (missing.length === 0) {
    return;
  }

  await db
    .insert(specialties)
    .values(
      missing.map((name, index) => ({
        clinicId,
        name,
        active: true,
        order: rows.length + index,
      })),
    )
    .onConflictDoNothing({
      target: [specialties.clinicId, specialties.name],
    });
};

export const createSpecialty = async (
  clinicId: string,
  data: SpecialtyCreateInput,
): Promise<Specialty> => {
  const row = (
    await getDb()
      .insert(specialties)
      .values({
        clinicId,
        name: data.name,
        active: data.active,
        order: data.order,
      })
      .returning()
  )[0];

  if (row === undefined) {
    throw new Error("Não foi possível criar especialidade");
  }

  return specialtyFromRow(row);
};

export const updateSpecialty = async (
  clinicId: string,
  id: string,
  data: Partial<Specialty>,
): Promise<void> => {
  await getDb()
    .update(specialties)
    .set({
      name: data.name,
      active: data.active,
      order: data.order,
      updatedAt: new Date(),
    })
    .where(and(eq(specialties.clinicId, clinicId), eq(specialties.id, id)));
};

export const getSpecialties = async (
  clinicId: string,
  activeOnly = true,
): Promise<Specialty[]> => {
  const rows = await getDb()
    .select()
    .from(specialties)
    .where(
      activeOnly
        ? and(eq(specialties.clinicId, clinicId), eq(specialties.active, true))
        : eq(specialties.clinicId, clinicId),
    )
    .orderBy(asc(specialties.order), asc(specialties.name));

  return rows.map(specialtyFromRow);
};

export const deactivateSpecialties = async (
  clinicId: string,
  ids: string[],
): Promise<void> => {
  if (ids.length === 0) {
    return;
  }

  await getDb()
    .update(specialties)
    .set({ active: false, updatedAt: new Date() })
    .where(and(eq(specialties.clinicId, clinicId), inArray(specialties.id, ids)));
};
