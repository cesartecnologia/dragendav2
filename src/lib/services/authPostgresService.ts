import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { clinics, users } from "../db/schema";
import type { Address, Role, User } from "../types";

export type ClientUser = Omit<User, "createdAt"> & {
  createdAt: string;
};

export type BootstrapClinicInput = {
  firebaseUid: string;
  ownerName: string;
  ownerEmail: string;
  clinicId: string;
  clinicName: string;
  cnpj: string;
  phone: string;
  city: string;
  state: string;
};

export type SyncFirebaseUserInput = {
  firebaseUid: string;
  clinicId: string;
  role: Role;
  name: string;
  email: string;
  active: boolean;
  clinic: {
    name: string;
    cnpj: string;
    phone: string;
    email: string;
    address: Address;
    logoUrl: string;
    logoPublicId: string;
    primaryColor: string;
    whatsappToken: string;
    whatsappPhone: string;
    whatsappApiUrl: string;
    plan: "starter" | "pro" | "enterprise";
    active: boolean;
  };
};

const emptyAddress = (city: string, state: string): Address => ({
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city,
  state,
});

const toClientUser = (row: typeof users.$inferSelect): ClientUser => ({
  id: row.firebaseUid,
  clinicId: row.clinicId,
  role: row.role as Role,
  name: row.name,
  email: row.email,
  active: row.active,
  createdAt: row.createdAt.toISOString(),
});

export const getUserByFirebaseUid = async (
  firebaseUid: string,
): Promise<ClientUser | null> => {
  const db = getDb();
  const row = (
    await db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, firebaseUid))
      .limit(1)
  )[0];

  return row === undefined ? null : toClientUser(row);
};

export const bootstrapClinicOwner = async (
  input: BootstrapClinicInput,
): Promise<ClientUser> => {
  const existingUser = await getUserByFirebaseUid(input.firebaseUid);

  if (existingUser !== null) {
    return existingUser;
  }

  const db = getDb();
  const createdUser = await db.transaction(async (tx) => {
    await tx
      .insert(clinics)
      .values({
        id: input.clinicId,
        name: input.clinicName,
        cnpj: input.cnpj,
        phone: input.phone,
        email: input.ownerEmail,
        address: emptyAddress(input.city, input.state),
        plan: "starter",
        active: true,
      })
      .onConflictDoNothing({
        target: clinics.id,
      });

    const userRows = await tx
      .insert(users)
      .values({
        firebaseUid: input.firebaseUid,
        clinicId: input.clinicId,
        role: "OWNER",
        name: input.ownerName,
        email: input.ownerEmail,
        active: true,
      })
      .onConflictDoNothing({
        target: users.firebaseUid,
      })
      .returning();

    if (userRows[0] !== undefined) {
      return userRows[0];
    }

    const existingRows = await tx
      .select()
      .from(users)
      .where(eq(users.firebaseUid, input.firebaseUid))
      .limit(1);

    const existingRow = existingRows[0];

    if (existingRow === undefined) {
      throw new Error("Não foi possível criar usuário");
    }

    return existingRow;
  });

  return toClientUser(createdUser);
};

export const syncFirebaseUserToPostgres = async (
  input: SyncFirebaseUserInput,
): Promise<ClientUser> => {
  const existingUser = await getUserByFirebaseUid(input.firebaseUid);

  if (existingUser !== null) {
    return existingUser;
  }

  const db = getDb();
  const createdUser = await db.transaction(async (tx) => {
    await tx
      .insert(clinics)
      .values({
        id: input.clinicId,
        name: input.clinic.name,
        cnpj: input.clinic.cnpj,
        phone: input.clinic.phone,
        email: input.clinic.email,
        address: input.clinic.address,
        logoUrl: input.clinic.logoUrl,
        logoPublicId: input.clinic.logoPublicId,
        primaryColor: input.clinic.primaryColor,
        whatsappToken: input.clinic.whatsappToken,
        whatsappPhone: input.clinic.whatsappPhone,
        whatsappApiUrl: input.clinic.whatsappApiUrl,
        plan: input.clinic.plan,
        active: input.clinic.active,
      })
      .onConflictDoNothing({
        target: clinics.id,
      });

    const insertedUsers = await tx
      .insert(users)
      .values({
        firebaseUid: input.firebaseUid,
        clinicId: input.clinicId,
        role: input.role,
        name: input.name,
        email: input.email,
        active: input.active,
      })
      .onConflictDoNothing({
        target: users.firebaseUid,
      })
      .returning();

    if (insertedUsers[0] !== undefined) {
      return insertedUsers[0];
    }

    const existingRows = await tx
      .select()
      .from(users)
      .where(eq(users.firebaseUid, input.firebaseUid))
      .limit(1);

    const existingRow = existingRows[0];

    if (existingRow === undefined) {
      throw new Error("Não foi possível sincronizar usuário");
    }

    return existingRow;
  });

  return toClientUser(createdUser);
};
