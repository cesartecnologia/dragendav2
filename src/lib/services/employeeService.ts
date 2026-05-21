import type { Employee } from "../types";
import { callDataService } from "./rpcClient";

export type EmployeeCreateInput = Omit<
  Employee,
  "id" | "clinicId" | "createdAt"
> & {
  firebaseUid?: string;
};

export const createEmployee = async (
  clinicId: string,
  data: EmployeeCreateInput,
): Promise<Employee> =>
  await callDataService<Employee>("employees", "createEmployee", [clinicId, data]);

export const updateEmployee = async (
  clinicId: string,
  id: string,
  data: Partial<Employee>,
): Promise<void> => {
  await callDataService<void>("employees", "updateEmployee", [clinicId, id, data]);
};

export const getEmployees = async (clinicId: string): Promise<Employee[]> =>
  await callDataService<Employee[]>("employees", "getEmployees", [clinicId]);
