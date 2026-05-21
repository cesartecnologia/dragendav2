import type { ExamType } from "../types";
import { callDataService } from "./rpcClient";

export type ExamTypeCreateInput = Omit<ExamType, "id" | "clinicId" | "createdAt">;

export const seedDefaultExamTypes = async (clinicId: string): Promise<void> => {
  await callDataService<void>("examTypes", "seedDefaultExamTypes", [clinicId]);
};

export const getExamTypes = async (
  clinicId: string,
  activeOnly = true,
): Promise<ExamType[]> =>
  await callDataService<ExamType[]>("examTypes", "getExamTypes", [clinicId, activeOnly]);

export const createExamType = async (
  clinicId: string,
  data: ExamTypeCreateInput,
): Promise<ExamType> =>
  await callDataService<ExamType>("examTypes", "createExamType", [clinicId, data]);

export const updateExamType = async (
  clinicId: string,
  id: string,
  data: Partial<ExamType>,
): Promise<void> => {
  await callDataService<void>("examTypes", "updateExamType", [clinicId, id, data]);
};

export const deleteExamType = async (
  clinicId: string,
  id: string,
): Promise<void> => {
  await callDataService<void>("examTypes", "deleteExamType", [clinicId, id]);
};
