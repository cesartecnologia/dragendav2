import type { Specialty } from "../types";
import { callDataService } from "./rpcClient";

export type SpecialtyCreateInput = Omit<
  Specialty,
  "id" | "clinicId" | "createdAt"
>;

export const seedDefaultSpecialties = async (
  clinicId: string,
): Promise<void> => {
  await callDataService<void>("specialties", "seedDefaultSpecialties", [clinicId]);
};

export const createSpecialty = async (
  clinicId: string,
  data: SpecialtyCreateInput,
): Promise<Specialty> =>
  await callDataService<Specialty>("specialties", "createSpecialty", [clinicId, data]);

export const updateSpecialty = async (
  clinicId: string,
  id: string,
  data: Partial<Specialty>,
): Promise<void> => {
  await callDataService<void>("specialties", "updateSpecialty", [clinicId, id, data]);
};

export const getSpecialties = async (
  clinicId: string,
  activeOnly = true,
): Promise<Specialty[]> =>
  await callDataService<Specialty[]>("specialties", "getSpecialties", [clinicId, activeOnly]);
