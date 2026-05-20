import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  where,
  writeBatch,
  type CollectionReference,
  type DocumentData,
  type DocumentReference,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  type Timestamp,
} from "firebase/firestore";
import { firestoreDb } from "./config";
import { converter, stripUndefined } from "./converters";
import type {
  Appointment,
  CashFlow,
  Clinic,
  Doctor,
  Employee,
  ExamType,
  Insurance,
  PaginatedResult,
  Patient,
  Payment,
  Schedule,
  Specialty,
  User,
} from "../types";

export type FirestoreCollectionName =
  | "doctors"
  | "patients"
  | "appointments"
  | "schedules"
  | "payments"
  | "insurances"
  | "cashFlow"
  | "specialties"
  | "employees"
  | "examTypes";

export type WithCreatedAt<T> = Omit<T, "id" | "clinicId" | "createdAt"> & {
  createdAt?: Timestamp;
};

export const createdAtServerTimestamp = (): ReturnType<typeof serverTimestamp> =>
  serverTimestamp();

export const clinicDoc = (clinicId: string): DocumentReference<Clinic> => {
  return doc(firestoreDb, "clinics", clinicId).withConverter(
    converter<Clinic>(),
  );
};

export const userDoc = (uid: string): DocumentReference<User> => {
  return doc(firestoreDb, "users", uid).withConverter(converter<User>());
};

export const clinicCollection = <T extends object>(
  clinicId: string,
  name: FirestoreCollectionName,
): CollectionReference<T> => {
  return collection(firestoreDb, "clinics", clinicId, name).withConverter(
    converter<T>(),
  );
};

export const doctorsCollection = (
  clinicId: string,
): CollectionReference<Doctor> => clinicCollection<Doctor>(clinicId, "doctors");

export const patientsCollection = (
  clinicId: string,
): CollectionReference<Patient> =>
  clinicCollection<Patient>(clinicId, "patients");

export const appointmentsCollection = (
  clinicId: string,
): CollectionReference<Appointment> =>
  clinicCollection<Appointment>(clinicId, "appointments");

export const schedulesCollection = (
  clinicId: string,
): CollectionReference<Schedule> =>
  clinicCollection<Schedule>(clinicId, "schedules");

export const paymentsCollection = (
  clinicId: string,
): CollectionReference<Payment> =>
  clinicCollection<Payment>(clinicId, "payments");

export const insurancesCollection = (
  clinicId: string,
): CollectionReference<Insurance> =>
  clinicCollection<Insurance>(clinicId, "insurances");

export const cashFlowCollection = (
  clinicId: string,
): CollectionReference<CashFlow> =>
  clinicCollection<CashFlow>(clinicId, "cashFlow");

export const specialtiesCollection = (
  clinicId: string,
): CollectionReference<Specialty> =>
  clinicCollection<Specialty>(clinicId, "specialties");

export const employeesCollection = (
  clinicId: string,
): CollectionReference<Employee> =>
  clinicCollection<Employee>(clinicId, "employees");

export const examTypesCollection = (
  clinicId: string,
): CollectionReference<ExamType> =>
  clinicCollection<ExamType>(clinicId, "examTypes");

export const assertAuthenticated = (uid: string | null | undefined): string => {
  if (uid === undefined || uid === null || uid.trim().length === 0) {
    throw new Error("Usuário não autenticado");
  }

  return uid;
};

export const getTypedDoc = async <T extends { id: string }>(
  reference: DocumentReference<T>,
): Promise<T | null> => {
  try {
    const snapshot = await getDoc(reference);

    if (!snapshot.exists()) {
      return null;
    }

    return { ...snapshot.data(), id: snapshot.id };
  } catch (error: unknown) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Erro ao buscar documento no Firestore",
    );
  }
};

export const addTypedDoc = async <T extends { id: string }>(
  reference: CollectionReference<T>,
  data: Omit<T, "id">,
): Promise<T> => {
  try {
    const cleanData = stripUndefined(data as Record<string, unknown>);
    const docRef = await addDoc(reference, cleanData as Omit<T, "id">);
    return { ...(cleanData as Omit<T, "id">), id: docRef.id } as T;
  } catch (error: unknown) {
    throw new Error(
      error instanceof Error ? error.message : "Erro ao criar documento",
    );
  }
};

export const setTypedDoc = async <T extends { id: string }>(
  reference: DocumentReference<T>,
  data: T,
): Promise<void> => {
  try {
    const cleanData = stripUndefined(data as Record<string, unknown>);
    await setDoc(reference, cleanData as T);
  } catch (error: unknown) {
    throw new Error(
      error instanceof Error ? error.message : "Erro ao salvar documento",
    );
  }
};

export const updateTypedDoc = async <T extends object>(
  reference: DocumentReference<T>,
  data: Partial<T>,
): Promise<void> => {
  try {
    const cleanData = stripUndefined(data as Record<string, unknown>);
    await updateDoc(
      reference as DocumentReference<DocumentData>,
      cleanData as DocumentData,
    );
  } catch (error: unknown) {
    throw new Error(
      error instanceof Error ? error.message : "Erro ao atualizar documento",
    );
  }
};

export const deleteTypedDoc = async <T extends object>(
  reference: DocumentReference<T>,
): Promise<void> => {
  try {
    await deleteDoc(reference as DocumentReference<DocumentData>);
  } catch (error: unknown) {
    throw new Error(
      error instanceof Error ? error.message : "Erro ao remover documento",
    );
  }
};

export const getPaginatedDocs = async <T extends { id: string }>(
  reference: CollectionReference<T>,
  constraints: QueryConstraint[],
  pageSize: number,
  lastDoc: QueryDocumentSnapshot<T> | null,
): Promise<PaginatedResult<T>> => {
  try {
    const pageQuery =
      lastDoc === null
        ? query(reference, ...constraints, limit(pageSize + 1))
        : query(reference, ...constraints, startAfter(lastDoc), limit(pageSize + 1));
    const snapshot = await getDocs(pageQuery);
    const docs = snapshot.docs.slice(0, pageSize);

    return {
      data: docs.map((item) => ({ ...item.data(), id: item.id })),
      lastDoc: docs.at(-1) ?? null,
      hasMore: snapshot.docs.length > pageSize,
    };
  } catch (error: unknown) {
    throw new Error(
      error instanceof Error ? error.message : "Erro ao paginar documentos",
    );
  }
};

export const commonConstraints = {
  clinic: (clinicId: string): QueryConstraint => where("clinicId", "==", clinicId),
  active: (active: boolean): QueryConstraint => where("active", "==", active),
  dateAsc: (): QueryConstraint => orderBy("date", "asc"),
  createdAtDesc: (): QueryConstraint => orderBy("createdAt", "desc"),
  createdAtAsc: (): QueryConstraint => orderBy("createdAt", "asc"),
};

export { writeBatch };
export type { DocumentData, QueryConstraint, QueryDocumentSnapshot };
