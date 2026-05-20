import { doc, getDoc, updateDoc } from "firebase/firestore";
import { firestoreDb } from "../firebase/config";
import { clinicDoc } from "../firebase/firestore";
import type { Clinic } from "../types";

export type ClinicUpdateInput = Omit<Clinic, "id" | "createdAt">;

export const getClinicById = async (clinicId: string): Promise<Clinic | null> => {
  const snapshot = await getDoc(clinicDoc(clinicId));
  return snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } : null;
};

export const updateClinic = async (
  clinicId: string,
  data: Partial<ClinicUpdateInput>,
): Promise<void> => {
  await updateDoc(doc(firestoreDb, "clinics", clinicId), data);
};

