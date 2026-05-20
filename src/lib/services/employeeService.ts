import { doc, getDocs, orderBy, query, serverTimestamp, where } from "firebase/firestore";
import {
  addTypedDoc,
  employeesCollection,
  updateTypedDoc,
} from "../firebase/firestore";
import type { Employee } from "../types";

export type EmployeeCreateInput = Omit<
  Employee,
  "id" | "clinicId" | "createdAt"
>;

export const createEmployee = async (
  clinicId: string,
  data: EmployeeCreateInput,
): Promise<Employee> => {
  return await addTypedDoc(employeesCollection(clinicId), {
    ...data,
    clinicId,
    createdAt: serverTimestamp(),
  } as Omit<Employee, "id">);
};

export const updateEmployee = async (
  clinicId: string,
  id: string,
  data: Partial<Employee>,
): Promise<void> => {
  await updateTypedDoc(doc(employeesCollection(clinicId), id), data);
};

export const getEmployees = async (clinicId: string): Promise<Employee[]> => {
  const snapshot = await getDocs(
    query(
      employeesCollection(clinicId),
      where("clinicId", "==", clinicId),
      orderBy("name", "asc"),
    ),
  );

  return snapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
};
