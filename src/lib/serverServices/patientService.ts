import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
import { getDb } from "../db";
import { appointmentFromRow, nullLastDoc, patientFromRow } from "../db/mappers";
import { appointments, patients } from "../db/schema";
import type {
  Appointment,
  PaginatedResult,
  Patient,
  PatientFilters,
} from "../types";
import type { QueryDocumentSnapshot } from "firebase/firestore";

export type PatientCreateInput = Omit<Patient, "id" | "clinicId" | "createdAt">;

const cleanDigits = (value: string): string => value.replace(/\D/g, "");

export const createPatient = async (
  clinicId: string,
  data: PatientCreateInput,
): Promise<Patient> => {
  const row = (
    await getDb()
      .insert(patients)
      .values({
        clinicId,
        name: data.name,
        cpf: data.cpf,
        birthDate: data.birthDate,
        phone: data.phone,
        email: data.email,
        address: data.address,
        gender: data.gender,
        healthInsurance: data.healthInsurance,
        notes: data.notes,
        active: data.active,
      })
      .returning()
  )[0];

  if (row === undefined) {
    throw new Error("Não foi possível criar paciente");
  }

  return patientFromRow(row);
};

export const updatePatient = async (
  clinicId: string,
  id: string,
  data: Partial<Patient>,
): Promise<void> => {
  await getDb()
    .update(patients)
    .set({
      name: data.name,
      cpf: data.cpf,
      birthDate: data.birthDate,
      phone: data.phone,
      email: data.email,
      address: data.address,
      gender: data.gender,
      healthInsurance: data.healthInsurance,
      notes: data.notes,
      active: data.active,
      updatedAt: new Date(),
    })
    .where(and(eq(patients.clinicId, clinicId), eq(patients.id, id)));
};

export const softDeletePatient = async (
  clinicId: string,
  id: string,
): Promise<void> => {
  await updatePatient(clinicId, id, { active: false });
};

export const searchPatients = async (
  clinicId: string,
  search: string,
): Promise<Patient[]> => {
  const normalized = search.trim();

  if (normalized.length === 0) {
    return [];
  }

  const digits = cleanDigits(normalized);
  const searchConditions = [
    ilike(patients.name, `%${normalized}%`),
    ilike(patients.email, `%${normalized}%`),
  ];

  if (digits.length > 0) {
    searchConditions.push(ilike(patients.cpf, `%${digits}%`));
    searchConditions.push(ilike(patients.phone, `%${digits}%`));
  }

  const rows = await getDb()
    .select()
    .from(patients)
    .where(and(eq(patients.clinicId, clinicId), or(...searchConditions)))
    .orderBy(asc(patients.name))
    .limit(15);

  return rows.map(patientFromRow);
};

export const getPatientsPaginated = async (
  clinicId: string,
  filters: PatientFilters,
  _lastDoc: QueryDocumentSnapshot<Patient> | null = null,
): Promise<PaginatedResult<Patient>> => {
  const conditions = [eq(patients.clinicId, clinicId)];

  if (filters.active !== undefined) {
    conditions.push(eq(patients.active, filters.active));
  }

  if (filters.healthInsurance !== undefined) {
    conditions.push(eq(patients.healthInsurance, filters.healthInsurance));
  }

  if (filters.search !== undefined && filters.search.trim().length > 0) {
    const found = await searchPatients(clinicId, filters.search);
    return {
      data: found,
      lastDoc: nullLastDoc<Patient>(),
      hasMore: false,
    };
  }

  const rows = await getDb()
    .select()
    .from(patients)
    .where(and(...conditions))
    .orderBy(desc(patients.createdAt))
    .limit(16);

  return {
    data: rows.slice(0, 15).map(patientFromRow),
    lastDoc: nullLastDoc<Patient>(),
    hasMore: rows.length > 15,
  };
};

export const getPatientById = async (
  clinicId: string,
  id: string,
): Promise<Patient | null> => {
  const row = (
    await getDb()
      .select()
      .from(patients)
      .where(and(eq(patients.clinicId, clinicId), eq(patients.id, id)))
      .limit(1)
  )[0];

  return row === undefined ? null : patientFromRow(row);
};

export const getPatientAppointments = async (
  clinicId: string,
  patientId: string,
): Promise<Appointment[]> => {
  const rows = await getDb()
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.clinicId, clinicId),
        eq(appointments.patientId, patientId),
      ),
    )
    .orderBy(desc(appointments.date), asc(appointments.time));

  return rows.map(appointmentFromRow);
};
