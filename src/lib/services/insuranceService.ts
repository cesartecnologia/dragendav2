import type { Insurance, InsuranceCoverageRule } from "../types";
import { callDataService } from "./rpcClient";

export type InsuranceCreateInput = Omit<
  Insurance,
  "id" | "clinicId" | "createdAt"
>;

export const createInsurance = async (
  clinicId: string,
  data: InsuranceCreateInput,
): Promise<Insurance> =>
  await callDataService<Insurance>("insurances", "createInsurance", [clinicId, data]);

export const updateInsurance = async (
  clinicId: string,
  id: string,
  data: Partial<Insurance>,
): Promise<void> => {
  await callDataService<void>("insurances", "updateInsurance", [clinicId, id, data]);
};

export const deleteInsurance = async (
  clinicId: string,
  id: string,
): Promise<void> => {
  await callDataService<void>("insurances", "deleteInsurance", [clinicId, id]);
};

export const getInsurances = async (clinicId: string): Promise<Insurance[]> =>
  await callDataService<Insurance[]>("insurances", "getInsurances", [clinicId]);

export const getCoverageRule = async (
  clinicId: string,
  insuranceId: string,
  specialty: string,
): Promise<InsuranceCoverageRule | null> =>
  await callDataService<InsuranceCoverageRule | null>("insurances", "getCoverageRule", [
    clinicId,
    insuranceId,
    specialty,
  ]);
