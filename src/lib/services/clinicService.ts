import type { Clinic } from "../types";
import { callDataService } from "./rpcClient";

export type ClinicUpdateInput = Omit<Clinic, "id" | "createdAt">;

export const getClinicById = async (clinicId: string): Promise<Clinic | null> =>
  await callDataService<Clinic | null>("clinics", "getClinicById", [clinicId]);

export const updateClinic = async (
  clinicId: string,
  data: Partial<ClinicUpdateInput>,
): Promise<void> => {
  await callDataService<void>("clinics", "updateClinic", [clinicId, data]);
};
