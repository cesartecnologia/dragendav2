import {
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import {
  addTypedDoc,
  deleteTypedDoc,
  insurancesCollection,
  updateTypedDoc,
} from "../firebase/firestore";
import type { Insurance, InsuranceCoverageRule } from "../types";

export type InsuranceCreateInput = Omit<
  Insurance,
  "id" | "clinicId" | "createdAt"
>;

export const createInsurance = async (
  clinicId: string,
  data: InsuranceCreateInput,
): Promise<Insurance> => {
  return await addTypedDoc(insurancesCollection(clinicId), {
    ...data,
    clinicId,
    createdAt: serverTimestamp(),
  } as Omit<Insurance, "id">);
};

export const updateInsurance = async (
  clinicId: string,
  id: string,
  data: Partial<Insurance>,
): Promise<void> => {
  await updateTypedDoc(doc(insurancesCollection(clinicId), id), data);
};

export const deleteInsurance = async (
  clinicId: string,
  id: string,
): Promise<void> => {
  await deleteTypedDoc(doc(insurancesCollection(clinicId), id));
};

export const getInsurances = async (clinicId: string): Promise<Insurance[]> => {
  const snapshot = await getDocs(
    query(
      insurancesCollection(clinicId),
      where("clinicId", "==", clinicId),
      orderBy("name", "asc"),
    ),
  );
  return snapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
};

export const getCoverageRule = async (
  clinicId: string,
  insuranceId: string,
  specialty: string,
): Promise<InsuranceCoverageRule | null> => {
  const insurances = await getInsurances(clinicId);
  const insurance = insurances.find((item) => item.id === insuranceId);
  return (
    insurance?.coverageRules.find((item) => item.specialty === specialty) ?? null
  );
};

