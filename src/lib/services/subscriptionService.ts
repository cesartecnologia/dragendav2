import { and, eq } from "drizzle-orm";
import {
  ASAAS_BILLING_TYPE,
  ASAAS_CYCLE,
  createAsaasCustomer,
  createAsaasSubscription,
} from "../asaas/client";
import { getDb } from "../db";
import { billingEvents, clinics, subscriptions } from "../db/schema";
import type { ClinicPlan } from "../types";

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "cancelled"
  | "blocked";

export type SubscriptionView = {
  id: string;
  clinicId: string;
  provider: "asaas" | "stripe";
  providerCustomerId: string;
  providerSubscriptionId: string;
  status: SubscriptionStatus;
  plan: ClinicPlan;
  amount: number;
  nextDueDate: string | null;
  currentPeriodEnd: string | null;
};

export type CreateSubscriptionInput = {
  clinicId: string;
  plan: ClinicPlan;
  amount: number;
};

export type AsaasWebhookPayment = {
  id?: string;
  customer?: string;
  subscription?: string;
  status?: string;
  value?: number;
  netValue?: number;
  dueDate?: string;
  paymentDate?: string;
  billingType?: string;
};

export type AsaasWebhookSubscription = {
  id?: string;
  customer?: string;
  status?: string;
  value?: number;
  nextDueDate?: string;
  cycle?: string;
};

export type AsaasWebhookPayload = {
  id?: string;
  event: string;
  dateCreated?: string;
  payment?: AsaasWebhookPayment;
  subscription?: AsaasWebhookSubscription;
};

const subscriptionFromRow = (
  row: typeof subscriptions.$inferSelect,
): SubscriptionView => ({
  id: row.id,
  clinicId: row.clinicId,
  provider: row.provider,
  providerCustomerId: row.providerCustomerId,
  providerSubscriptionId: row.providerSubscriptionId,
  status: row.status,
  plan: row.plan,
  amount: row.amount,
  nextDueDate: row.nextDueDate,
  currentPeriodEnd: row.currentPeriodEnd,
});

const mapAsaasStatus = (event: string, status: string | undefined): SubscriptionStatus => {
  if (event.includes("DELETED") || event.includes("CANCELLED")) {
    return "cancelled";
  }

  if (event.includes("OVERDUE") || status === "OVERDUE") {
    return "past_due";
  }

  if (event.includes("RECEIVED") || event.includes("CONFIRMED") || status === "ACTIVE") {
    return "active";
  }

  return "trialing";
};

const getProviderSubscriptionId = (
  payload: AsaasWebhookPayload,
): string | null => {
  return payload.subscription?.id ?? payload.payment?.subscription ?? null;
};

const getProviderEventId = (payload: AsaasWebhookPayload): string => {
  return payload.id ?? `${payload.event}:${payload.payment?.id ?? payload.subscription?.id ?? Date.now().toString()}`;
};

export const processAsaasWebhook = async (
  payload: AsaasWebhookPayload,
): Promise<void> => {
  const db = getDb();
  const providerSubscriptionId = getProviderSubscriptionId(payload);
  const providerEventId = getProviderEventId(payload);

  const existingSubscription =
    providerSubscriptionId === null
      ? undefined
      : (
          await db
            .select()
            .from(subscriptions)
            .where(
              and(
                eq(subscriptions.provider, "asaas"),
                eq(subscriptions.providerSubscriptionId, providerSubscriptionId),
              ),
            )
            .limit(1)
        )[0];

  await db
    .insert(billingEvents)
    .values({
      clinicId: existingSubscription?.clinicId ?? null,
      provider: "asaas",
      providerEventId,
      eventType: payload.event,
      payload: payload as Record<string, unknown>,
    })
    .onConflictDoNothing({
      target: [billingEvents.provider, billingEvents.providerEventId],
    });

  if (existingSubscription === undefined || providerSubscriptionId === null) {
    return;
  }

  const nextDueDate =
    payload.subscription?.nextDueDate ?? payload.payment?.dueDate ?? existingSubscription.nextDueDate;
  const status = mapAsaasStatus(
    payload.event,
    payload.subscription?.status ?? payload.payment?.status,
  );
  const amountInCents = Math.round(
    (payload.subscription?.value ?? payload.payment?.value ?? existingSubscription.amount / 100) * 100,
  );

  await db
    .update(subscriptions)
    .set({
      status,
      amount: amountInCents,
      nextDueDate,
      currentPeriodEnd: nextDueDate,
      lastEventId: providerEventId,
      blockedAt: status === "blocked" || status === "cancelled" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, existingSubscription.id));
};

export const getSubscriptionByClinic = async (
  clinicId: string,
): Promise<SubscriptionView | null> => {
  const row = (
    await getDb()
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.clinicId, clinicId))
      .limit(1)
  )[0];

  return row === undefined ? null : subscriptionFromRow(row);
};

export const createClinicSubscription = async (
  input: CreateSubscriptionInput,
): Promise<SubscriptionView> => {
  const db = getDb();
  const clinic = (
    await db
      .select()
      .from(clinics)
      .where(eq(clinics.id, input.clinicId))
      .limit(1)
  )[0];

  if (clinic === undefined) {
    throw new Error("Clínica não encontrada");
  }

  const existing = await getSubscriptionByClinic(input.clinicId);

  if (existing !== null && existing.providerSubscriptionId.length > 0) {
    return existing;
  }

  const nextDueDate = new Date();
  nextDueDate.setDate(nextDueDate.getDate() + 7);
  const customer = await createAsaasCustomer({
    name: clinic.name,
    email: clinic.email,
    cpfCnpj: clinic.cnpj,
    phone: clinic.phone,
  });
  const subscription = await createAsaasSubscription({
    customer: customer.id,
    billingType: ASAAS_BILLING_TYPE.UNDEFINED,
    value: input.amount / 100,
    nextDueDate: nextDueDate.toISOString().slice(0, 10),
    cycle: ASAAS_CYCLE.MONTHLY,
    description: `Assinatura ${input.plan} - Dr. Agenda`,
    externalReference: input.clinicId,
  });
  const row = (
    await db
      .insert(subscriptions)
      .values({
        clinicId: input.clinicId,
        provider: "asaas",
        providerCustomerId: customer.id,
        providerSubscriptionId: subscription.id,
        status: "active",
        plan: input.plan,
        amount: input.amount,
        nextDueDate: subscription.nextDueDate,
        currentPeriodEnd: subscription.nextDueDate,
      })
      .onConflictDoUpdate({
        target: subscriptions.clinicId,
        set: {
          providerCustomerId: customer.id,
          providerSubscriptionId: subscription.id,
          status: "active",
          plan: input.plan,
          amount: input.amount,
          nextDueDate: subscription.nextDueDate,
          currentPeriodEnd: subscription.nextDueDate,
          updatedAt: new Date(),
        },
      })
      .returning()
  )[0];

  if (row === undefined) {
    throw new Error("Não foi possível criar assinatura");
  }

  return subscriptionFromRow(row);
};
