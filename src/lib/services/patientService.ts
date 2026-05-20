import {
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import {
  addTypedDoc,
  appointmentsCollection,
  getPaginatedDocs,
  getTypedDoc,
  patientsCollection,
  updateTypedDoc,
} from "../firebase/firestore";
import type {
  Appointment,
  PaginatedResult,
  Patient,
  PatientFilters,
} from "../types";

export type PatientCreateInput = Omit<Patient, "id" | "clinicId" | "createdAt">;

const buildPatientConstraints = (
  clinicId: string,
  filters: PatientFilters,
): QueryConstraint[] => {
  const constraints: QueryConstraint[] = [where("clinicId", "==", clinicId)];

  if (filters.active !== undefined) {
    constraints.push(where("active", "==", filters.active));
  }

  if (filters.healthInsurance !== undefined) {
    constraints.push(where("healthInsurance", "==", filters.healthInsurance));
  }

  constraints.push(orderBy("createdAt", "desc"));
  return constraints;
};

export const createPatient = async (
  clinicId: string,
  data: PatientCreateInput,
): Promise<Patient> => {
  return await addTypedDoc(patientsCollection(clinicId), {
    ...data,
    clinicId,
    createdAt: serverTimestamp(),
  } as Omit<Patient, "id">);
};

export const updatePatient = async (
  clinicId: string,
  id: string,
  data: Partial<Patient>,
): Promise<void> => {
  await updateTypedDoc(doc(patientsCollection(clinicId), id), data);
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

  const snapshot = await getDocs(
    query(
      patientsCollection(clinicId),
      where("clinicId", "==", clinicId),
      orderBy("name", "asc"),
    ),
  );
  const lowerSearch = normalized.toLowerCase();

  return snapshot.docs
    .map((item) => ({ ...item.data(), id: item.id }))
    .filter((patient) => {
      return (
        patient.name.toLowerCase().includes(lowerSearch) ||
        patient.cpf.includes(normalized.replace(/\D/g, "")) ||
        patient.phone.includes(normalized.replace(/\D/g, ""))
      );
    })
    .slice(0, 15);
};

export const getPatientsPaginated = async (
  clinicId: string,
  filters: PatientFilters,
  lastDoc: QueryDocumentSnapshot<Patient> | null,
): Promise<PaginatedResult<Patient>> => {
  return await getPaginatedDocs(
    patientsCollection(clinicId),
    buildPatientConstraints(clinicId, filters),
    15,
    lastDoc,
  );
};

export const getPatientById = async (
  clinicId: string,
  id: string,
): Promise<Patient | null> => {
  return await getTypedDoc(doc(patientsCollection(clinicId), id));
};

export const getPatientAppointments = async (
  clinicId: string,
  patientId: string,
): Promise<Appointment[]> => {
  const snapshot = await getDocs(
    query(
      appointmentsCollection(clinicId),
      where("clinicId", "==", clinicId),
      where("patientId", "==", patientId),
      orderBy("date", "desc"),
    ),
  );
  return snapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
};

