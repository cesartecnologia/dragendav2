import type { Doctor, DoctorFilters } from "../types";
import { callDataService } from "./rpcClient";

export type DoctorCreateInput = Omit<Doctor, "id" | "clinicId" | "createdAt">;

export const createDoctor = async (
  clinicId: string,
  data: DoctorCreateInput,
): Promise<Doctor> =>
  await callDataService<Doctor>("doctors", "createDoctor", [clinicId, data]);

export const updateDoctor = async (
  clinicId: string,
  id: string,
  data: Partial<Doctor>,
): Promise<void> => {
  await callDataService<void>("doctors", "updateDoctor", [clinicId, id, data]);
};

export const softDeleteDoctor = async (
  clinicId: string,
  id: string,
): Promise<void> => {
  await callDataService<void>("doctors", "softDeleteDoctor", [clinicId, id]);
};

export const getDoctors = async (
  clinicId: string,
  filters: DoctorFilters = {},
): Promise<Doctor[]> =>
  await callDataService<Doctor[]>("doctors", "getDoctors", [clinicId, filters]);

export const getDoctorById = async (
  clinicId: string,
  id: string,
): Promise<Doctor | null> =>
  await callDataService<Doctor | null>("doctors", "getDoctorById", [clinicId, id]);

export const updateScheduleConfig = async (
  clinicId: string,
  id: string,
  config: Pick<Doctor, "periods" | "vacations">,
): Promise<void> => {
  await callDataService<void>("doctors", "updateScheduleConfig", [clinicId, id, config]);
};

export const regenerateSchedules = async (
  clinicId: string,
  doctorId: string,
  daysAhead = 60,
): Promise<void> => {
  await callDataService<void>("doctors", "regenerateSchedules", [clinicId, doctorId, daysAhead]);
};
