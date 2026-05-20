import {
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { firestoreDb } from "../firebase/config";
import {
  addTypedDoc,
  specialtiesCollection,
  updateTypedDoc,
} from "../firebase/firestore";
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
  const currentSnapshot = await getDocs(
    query(specialtiesCollection(clinicId), where("clinicId", "==", clinicId)),
  );

  const existingNames = new Set(
    currentSnapshot.docs.map((item) => {
      const data = item.data();
      return data.name.trim().toLowerCase();
    }),
  );
  const missingSpecialties = defaultSpecialties.filter(
    (name) => !existingNames.has(name.trim().toLowerCase()),
  );

  if (missingSpecialties.length === 0) {
    return;
  }

  const batch = writeBatch(firestoreDb);

  missingSpecialties.forEach((name, index) => {
    const reference = doc(specialtiesCollection(clinicId));
    batch.set(reference, {
      id: reference.id,
      clinicId,
      name,
      active: true,
      order: currentSnapshot.size + index,
      createdAt: serverTimestamp(),
    });
  });

  await batch.commit();
};

export const createSpecialty = async (
  clinicId: string,
  data: SpecialtyCreateInput,
): Promise<Specialty> => {
  return await addTypedDoc(specialtiesCollection(clinicId), {
    ...data,
    clinicId,
    createdAt: serverTimestamp(),
  } as Omit<Specialty, "id">);
};

export const updateSpecialty = async (
  clinicId: string,
  id: string,
  data: Partial<Specialty>,
): Promise<void> => {
  await updateTypedDoc(doc(specialtiesCollection(clinicId), id), data);
};

export const getSpecialties = async (
  clinicId: string,
  activeOnly = true,
): Promise<Specialty[]> => {
  const constraints = [where("clinicId", "==", clinicId)];

  if (activeOnly) {
    constraints.push(where("active", "==", true));
  }

  const snapshot = await getDocs(
    query(specialtiesCollection(clinicId), ...constraints, orderBy("order", "asc")),
  );

  return snapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
};
