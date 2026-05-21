import type { QueryDocumentSnapshot } from "firebase/firestore";
import type {
  Appointment,
  PaginatedResult,
  Patient,
  PatientFilters,
} from "../types";
import { callDataService } from "./rpcClient";

export type PatientCreateInput = Omit<Patient, "id" | "clinicId" | "createdAt">;

export const createPatient = async (
  clinicId: string,
  data: PatientCreateInput,
): Promise<Patient> =>
  await callDataService<Patient>("patients", "createPatient", [clinicId, data]);

export const updatePatient = async (
  clinicId: string,
  id: string,
  data: Partial<Patient>,
): Promise<void> => {
  await callDataService<void>("patients", "updatePatient", [clinicId, id, data]);
};

export const softDeletePatient = async (
  clinicId: string,
  id: string,
): Promise<void> => {
  await callDataService<void>("patients", "softDeletePatient", [clinicId, id]);
};

export const searchPatients = async (
  clinicId: string,
  search: string,
): Promise<Patient[]> =>
  await callDataService<Patient[]>("patients", "searchPatients", [clinicId, search]);

export const getPatientsPaginated = async (
  clinicId: string,
  filters: PatientFilters,
  lastDoc: QueryDocumentSnapshot<Patient> | null,
): Promise<PaginatedResult<Patient>> =>
  await callDataService<PaginatedResult<Patient>>("patients", "getPatientsPaginated", [
    clinicId,
    filters,
    lastDoc,
  ]);

export const getPatientById = async (
  clinicId: string,
  id: string,
): Promise<Patient | null> =>
  await callDataService<Patient | null>("patients", "getPatientById", [clinicId, id]);

export const getPatientAppointments = async (
  clinicId: string,
  patientId: string,
): Promise<Appointment[]> =>
  await callDataService<Appointment[]>("patients", "getPatientAppointments", [clinicId, patientId]);
