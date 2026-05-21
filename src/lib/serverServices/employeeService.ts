import { and, asc, eq, ne } from "drizzle-orm";
import { getDb } from "../db";
import { employeeFromRow } from "../db/mappers";
import { users } from "../db/schema";
import type { Employee } from "../types";

export type EmployeeCreateInput = Omit<
  Employee,
  "id" | "clinicId" | "createdAt"
> & {
  firebaseUid?: string;
};

export const createEmployee = async (
  clinicId: string,
  data: EmployeeCreateInput,
): Promise<Employee> => {
  const firebaseUid = data.firebaseUid ?? crypto.randomUUID();
  const row = (
    await getDb()
      .insert(users)
      .values({
        firebaseUid,
        clinicId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        active: data.active,
      })
      .returning()
  )[0];

  if (row === undefined) {
    throw new Error("Não foi possível criar funcionário");
  }

  return employeeFromRow(row);
};

export const updateEmployee = async (
  clinicId: string,
  id: string,
  data: Partial<Employee>,
): Promise<void> => {
  await getDb()
    .update(users)
    .set({
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      active: data.active,
      updatedAt: new Date(),
    })
    .where(and(eq(users.clinicId, clinicId), eq(users.firebaseUid, id)));
};

export const getEmployees = async (clinicId: string): Promise<Employee[]> => {
  const rows = await getDb()
    .select()
    .from(users)
    .where(and(eq(users.clinicId, clinicId), ne(users.role, "OWNER")))
    .orderBy(asc(users.name));

  return rows.map(employeeFromRow);
};
