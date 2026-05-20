import { doc, getDocs, query, serverTimestamp, where, writeBatch } from "firebase/firestore";
import { firestoreDb } from "../firebase/config";
import {
  addTypedDoc,
  deleteTypedDoc,
  examTypesCollection,
  updateTypedDoc,
} from "../firebase/firestore";
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
  const snapshot = await getDocs(query(examTypesCollection(clinicId), where("clinicId", "==", clinicId)));
  const current = new Set(snapshot.docs.map((item) => item.data().name.trim().toLowerCase()));
  const missing = defaultExamTypes.filter((name) => !current.has(name.trim().toLowerCase()));

  if (missing.length === 0) {
    return;
  }

  const batch = writeBatch(firestoreDb);
  missing.forEach((name) => {
    const reference = doc(examTypesCollection(clinicId));
    batch.set(reference, {
      id: reference.id,
      clinicId,
      name,
      type: "Laboratorial",
      amount: 0,
      laboratory: "",
      active: true,
      createdAt: serverTimestamp(),
    });
  });
  await batch.commit();
};

export const getExamTypes = async (
  clinicId: string,
  activeOnly = true,
): Promise<ExamType[]> => {
  const constraints = [where("clinicId", "==", clinicId)];

  if (activeOnly) {
    constraints.push(where("active", "==", true));
  }

  const snapshot = await getDocs(
    query(
      examTypesCollection(clinicId),
      ...constraints,
    ),
  );

  return snapshot.docs.map((item) => ({ ...item.data(), id: item.id })).sort((a, b) => a.name.localeCompare(b.name));
};

export const createExamType = async (
  clinicId: string,
  data: ExamTypeCreateInput,
): Promise<ExamType> => {
  return await addTypedDoc(examTypesCollection(clinicId), {
    ...data,
    clinicId,
    createdAt: serverTimestamp(),
  } as Omit<ExamType, "id">);
};

export const updateExamType = async (
  clinicId: string,
  id: string,
  data: Partial<ExamType>,
): Promise<void> => {
  await updateTypedDoc(doc(examTypesCollection(clinicId), id), data);
};

export const deleteExamType = async (
  clinicId: string,
  id: string,
): Promise<void> => {
  await deleteTypedDoc(doc(examTypesCollection(clinicId), id));
};
