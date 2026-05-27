import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { clinics, subscriptions, users } from "../db/schema";
import type { Address, Role, User } from "../types";
import {
  completeOnboardingForSession,
  getCheckoutSessionById,
  getOnboardingBySessionId,
} from "./checkoutSessionService";
import { isMasterEmail } from "./subscriptionService";

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
  checkoutSessionId?: string;
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

export type BootstrapMasterInput = {
  firebaseUid: string;
  ownerName: string;
  ownerEmail: string;
  clinicId: string;
  clinicName: string;
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

const buildMasterCnpj = (clinicId: string): string =>
  clinicId.replace(/\D/g, "").slice(0, 14).padEnd(14, "0");

const trialDays = 7;

const buildTrialProviderId = (clinicId: string): string => `trial:${clinicId}`;

const buildTrialEndDate = (): Date => {
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);
  return trialEndsAt;
};

const dateOnly = (date: Date): string => date.toISOString().slice(0, 10);

const ensureMasterSubscription = async (clinicId: string): Promise<void> => {
  await getDb()
    .insert(subscriptions)
    .values({
      clinicId,
      provider: "asaas",
      providerCustomerId: `master:${clinicId}`,
      providerSubscriptionId: `master:${clinicId}`,
      status: "active",
      plan: "starter",
      amount: 0,
      nextDueDate: null,
      currentPeriodEnd: null,
      trialEndsAt: null,
    })
    .onConflictDoUpdate({
      target: subscriptions.clinicId,
      set: {
        providerCustomerId: `master:${clinicId}`,
        providerSubscriptionId: `master:${clinicId}`,
        status: "active",
        amount: 0,
        nextDueDate: null,
        currentPeriodEnd: null,
        trialEndsAt: null,
        blockedAt: null,
        updatedAt: new Date(),
      },
    });
};

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
  const existingClinic = (
    await db
      .select({ id: clinics.id })
      .from(clinics)
      .where(eq(clinics.cnpj, input.cnpj))
      .limit(1)
  )[0];

  if (existingClinic !== undefined) {
    throw new Error("CNPJ já cadastrado. Entre pelo login ou use outro CNPJ para criar uma nova clínica.");
  }

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

    const trialEndsAt = buildTrialEndDate();
    const trialDate = dateOnly(trialEndsAt);
    const trialProviderId = buildTrialProviderId(input.clinicId);

    await tx
      .insert(subscriptions)
      .values({
        clinicId: input.clinicId,
        provider: "asaas",
        providerCustomerId: trialProviderId,
        providerSubscriptionId: trialProviderId,
        status: "trialing",
        plan: "starter",
        amount: 9990,
        nextDueDate: trialDate,
        currentPeriodEnd: trialDate,
        trialEndsAt,
      })
      .onConflictDoNothing({
        target: subscriptions.clinicId,
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

  if (input.checkoutSessionId !== undefined) {
    const checkoutSession = await getCheckoutSessionById(input.checkoutSessionId);
    const onboarding = await getOnboardingBySessionId(input.checkoutSessionId);

    if (checkoutSession === null || onboarding === null) {
      throw new Error("Sessão de pagamento não encontrada");
    }

    if (checkoutSession.status !== "paid" || onboarding.status !== "released") {
      throw new Error("Pagamento ainda não confirmado");
    }

    await getDb()
      .insert(subscriptions)
      .values({
        clinicId: input.clinicId,
        provider: "asaas",
        providerCustomerId: checkoutSession.asaasCustomerId ?? "",
        providerSubscriptionId:
          checkoutSession.asaasSubscriptionId ??
          checkoutSession.asaasCheckoutId ??
          input.checkoutSessionId,
        status: "active",
        plan: "starter",
        amount: checkoutSession.value,
        nextDueDate: new Date().toISOString().slice(0, 10),
        currentPeriodEnd: new Date().toISOString().slice(0, 10),
      })
      .onConflictDoUpdate({
        target: subscriptions.clinicId,
        set: {
          providerCustomerId: checkoutSession.asaasCustomerId ?? "",
          providerSubscriptionId:
            checkoutSession.asaasSubscriptionId ??
            checkoutSession.asaasCheckoutId ??
            input.checkoutSessionId,
          status: "active",
          amount: checkoutSession.value,
          updatedAt: new Date(),
        },
      });

    await completeOnboardingForSession(input.checkoutSessionId, {
      userId: createdUser.id,
      clinicId: input.clinicId,
    });
  }

  return toClientUser(createdUser);
};

export const bootstrapMasterOwner = async (
  input: BootstrapMasterInput,
): Promise<ClientUser> => {
  if (!isMasterEmail(input.ownerEmail)) {
    throw new Error("Email master não autorizado");
  }

  const existingUser = await getUserByFirebaseUid(input.firebaseUid);

  if (existingUser !== null) {
    await ensureMasterSubscription(existingUser.clinicId);
    return existingUser;
  }

  const db = getDb();
  const createdUser = await db.transaction(async (tx) => {
    await tx
      .insert(clinics)
      .values({
        id: input.clinicId,
        name: input.clinicName,
        cnpj: buildMasterCnpj(input.clinicId),
        phone: "0000000000",
        email: input.ownerEmail,
        address: emptyAddress("Master", "SP"),
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
      throw new Error("Não foi possível criar usuário master");
    }

    return existingRow;
  });

  await ensureMasterSubscription(createdUser.clinicId);

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

    const trialEndsAt = buildTrialEndDate();
    const trialDate = dateOnly(trialEndsAt);
    const trialProviderId = buildTrialProviderId(input.clinicId);

    await tx
      .insert(subscriptions)
      .values({
        clinicId: input.clinicId,
        provider: "asaas",
        providerCustomerId: trialProviderId,
        providerSubscriptionId: trialProviderId,
        status: "trialing",
        plan: "starter",
        amount: 9990,
        nextDueDate: trialDate,
        currentPeriodEnd: trialDate,
        trialEndsAt,
      })
      .onConflictDoNothing({
        target: subscriptions.clinicId,
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
