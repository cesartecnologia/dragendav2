import { and, eq } from "drizzle-orm";
import {
  ASAAS_BILLING_TYPE,
  ASAAS_CHARGE_TYPE,
  ASAAS_CYCLE,
  createAsaasCheckout,
  createAsaasCustomer,
  createAsaasSubscription,
  getAsaasCheckoutUrl,
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
  paymentUrl?: string | null;
};

export type CreateSubscriptionInput = {
  clinicId: string;
  plan: ClinicPlan;
  amount: number;
  billingType?: "CREDIT_CARD" | "BOLETO";
  holder?: {
    name: string;
    email: string;
    cpfCnpj: string;
    phone: string;
    postalCode: string;
    addressNumber: string;
  };
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
};

export type CreateHostedCheckoutInput = {
  clinicId: string;
  plan: ClinicPlan;
  amount: number;
  callbackBaseUrl: string;
};

export type BillingAccess = {
  allowed: boolean;
  master: boolean;
  status: SubscriptionStatus | "none";
  trialEndsAt: string | null;
  subscription: SubscriptionView | null;
};

export type AsaasWebhookPayment = {
  id?: string;
  customer?: string;
  subscription?: string;
  externalReference?: string;
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
  externalReference?: string;
  status?: string;
  value?: number;
  nextDueDate?: string;
  cycle?: string;
};

export type AsaasWebhookCheckout = {
  id?: string;
  externalReference?: string;
  status?: string;
};

export type AsaasWebhookPayload = {
  id?: string;
  event: string;
  dateCreated?: string;
  payment?: AsaasWebhookPayment;
  subscription?: AsaasWebhookSubscription;
  checkout?: AsaasWebhookCheckout;
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

const isMasterEmail = (email: string): boolean => {
  const emails = process.env.MASTER_USER_EMAILS ?? "";
  return emails
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 0)
    .includes(email.trim().toLowerCase());
};

export const ensureTrialSubscription = async (
  clinicId: string,
): Promise<SubscriptionView> => {
  const existing = await getSubscriptionByClinic(clinicId);

  if (existing !== null) {
    return existing;
  }

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 7);
  const trialDate = trialEndsAt.toISOString().slice(0, 10);
  const row = (
    await getDb()
      .insert(subscriptions)
      .values({
        clinicId,
        provider: "asaas",
        status: "trialing",
        plan: "starter",
        amount: 9990,
        nextDueDate: trialDate,
        currentPeriodEnd: trialDate,
        trialEndsAt,
      })
      .onConflictDoNothing({
        target: subscriptions.clinicId,
      })
      .returning()
  )[0];

  if (row !== undefined) {
    return subscriptionFromRow(row);
  }

  const afterConflict = await getSubscriptionByClinic(clinicId);

  if (afterConflict === null) {
    throw new Error("Não foi possível criar período de teste");
  }

  return afterConflict;
};

export const getBillingAccess = async (
  clinicId: string,
  email: string,
): Promise<BillingAccess> => {
  if (isMasterEmail(email)) {
    return {
      allowed: true,
      master: true,
      status: "active",
      trialEndsAt: null,
      subscription: await getSubscriptionByClinic(clinicId),
    };
  }

  const subscription = await ensureTrialSubscription(clinicId);
  const trialEndsAt = (
    await getDb()
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.clinicId, clinicId))
      .limit(1)
  )[0]?.trialEndsAt ?? null;
  const trialActive =
    subscription.status === "trialing" &&
    trialEndsAt !== null &&
    trialEndsAt.getTime() >= Date.now();
  const paidActive = subscription.status === "active";

  return {
    allowed: paidActive || trialActive,
    master: false,
    status: subscription.status,
    trialEndsAt: trialEndsAt?.toISOString() ?? null,
    subscription,
  };
};

const mapAsaasStatus = (event: string, status: string | undefined): SubscriptionStatus => {
  if (event.includes("DELETED") || event.includes("CANCELLED")) {
    return "cancelled";
  }

  if (event.includes("OVERDUE") || status === "OVERDUE") {
    return "past_due";
  }

  if (event.includes("RECEIVED") || event.includes("CONFIRMED") || event.includes("PAID") || status === "ACTIVE") {
    return "active";
  }

  return "trialing";
};

const getProviderSubscriptionId = (
  payload: AsaasWebhookPayload,
): string | null => {
  return payload.subscription?.id ?? payload.payment?.subscription ?? payload.checkout?.id ?? null;
};

const getExternalReference = (payload: AsaasWebhookPayload): string | null => {
  return payload.subscription?.externalReference ?? payload.payment?.externalReference ?? payload.checkout?.externalReference ?? null;
};

const getProviderEventId = (payload: AsaasWebhookPayload): string => {
  return payload.id ?? `${payload.event}:${payload.payment?.id ?? payload.subscription?.id ?? payload.checkout?.id ?? Date.now().toString()}`;
};

const getAsaasCallbackBaseUrl = (requestBaseUrl: string): string => {
  const configuredUrl =
    process.env.ASAAS_CHECKOUT_CALLBACK_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? requestBaseUrl;
  const normalizedUrl = configuredUrl.replace(/\/$/, "");

  if (normalizedUrl.startsWith("http://localhost") || normalizedUrl.startsWith("http://127.0.0.1")) {
    return "https://dragenda.cesartecnologia.com";
  }

  return normalizedUrl;
};

const formatAsaasDateTime = (date: Date): string => {
  const pad = (value: number): string => value.toString().padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
};

export const processAsaasWebhook = async (
  payload: AsaasWebhookPayload,
): Promise<void> => {
  const db = getDb();
  const providerSubscriptionId = getProviderSubscriptionId(payload);
  const providerEventId = getProviderEventId(payload);
  const externalReference = getExternalReference(payload);

  const existingSubscriptionByProvider =
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
  const existingSubscription =
    existingSubscriptionByProvider ??
    (externalReference === null
      ? undefined
      : (
          await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.clinicId, externalReference))
            .limit(1)
        )[0]);

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

  if (existingSubscription === undefined) {
    return;
  }

  const nextDueDate =
    payload.subscription?.nextDueDate ?? payload.payment?.dueDate ?? existingSubscription.nextDueDate;
  const status = mapAsaasStatus(
    payload.event,
    payload.subscription?.status ?? payload.payment?.status ?? payload.checkout?.status,
  );
  const amountInCents = Math.round(
    (payload.subscription?.value ?? payload.payment?.value ?? existingSubscription.amount / 100) * 100,
  );

  await db
    .update(subscriptions)
    .set({
      status,
      amount: amountInCents,
      ...(providerSubscriptionId === null ? {} : { providerSubscriptionId }),
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
    billingType: input.billingType ?? ASAAS_BILLING_TYPE.UNDEFINED,
    value: input.amount / 100,
    nextDueDate: nextDueDate.toISOString().slice(0, 10),
    cycle: ASAAS_CYCLE.MONTHLY,
    description: `Assinatura ${input.plan} - Dr. Agenda`,
    externalReference: input.clinicId,
    ...(input.creditCard !== undefined && input.holder !== undefined
      ? {
          creditCard: input.creditCard,
          creditCardHolderInfo: {
            name: input.holder.name,
            email: input.holder.email,
            cpfCnpj: input.holder.cpfCnpj,
            postalCode: input.holder.postalCode,
            addressNumber: input.holder.addressNumber,
            phone: input.holder.phone,
          },
        }
      : {}),
  });
  const initialStatus: SubscriptionStatus =
    input.billingType === "CREDIT_CARD" ? "active" : "trialing";
  const row = (
    await db
      .insert(subscriptions)
      .values({
        clinicId: input.clinicId,
        provider: "asaas",
        providerCustomerId: customer.id,
        providerSubscriptionId: subscription.id,
        status: initialStatus,
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
          status: initialStatus,
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

  return {
    ...subscriptionFromRow(row),
    paymentUrl: subscription.bankSlipUrl ?? subscription.invoiceUrl ?? null,
  };
};

export const createClinicHostedCheckout = async (
  input: CreateHostedCheckoutInput,
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

  if (existing?.status === "active") {
    return existing;
  }

  const normalizedBaseUrl = getAsaasCallbackBaseUrl(input.callbackBaseUrl);
  const nextDueDateAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const nextDueDate = formatAsaasDateTime(nextDueDateAt);
  const nextDueDateOnly = nextDueDate.slice(0, 10);
  const checkout = await createAsaasCheckout({
    billingTypes: [ASAAS_BILLING_TYPE.CREDIT_CARD],
    chargeTypes: [ASAAS_CHARGE_TYPE.RECURRENT],
    minutesToExpire: 1440,
    externalReference: input.clinicId,
    callback: {
      successUrl: `${normalizedBaseUrl}/assinatura?checkout=success`,
      cancelUrl: `${normalizedBaseUrl}/assinatura?checkout=cancelled`,
      expiredUrl: `${normalizedBaseUrl}/assinatura?checkout=expired`,
    },
    items: [
      {
        name: "Plano Premium Dr. Agenda",
        description: "Assinatura mensal para gestão da clínica",
        quantity: 1,
        value: input.amount / 100,
      },
    ],
    subscription: {
      cycle: ASAAS_CYCLE.MONTHLY,
      nextDueDate,
    },
  });
  const row = (
    await db
      .insert(subscriptions)
      .values({
        clinicId: input.clinicId,
        provider: "asaas",
        providerCustomerId: existing?.providerCustomerId ?? "",
        providerSubscriptionId: checkout.id,
        status: "trialing",
        plan: input.plan,
        amount: input.amount,
        nextDueDate: nextDueDateOnly,
        currentPeriodEnd: existing?.currentPeriodEnd ?? nextDueDateOnly,
      })
      .onConflictDoUpdate({
        target: subscriptions.clinicId,
        set: {
          providerCustomerId: existing?.providerCustomerId ?? "",
          providerSubscriptionId: checkout.id,
          status: existing?.status ?? "trialing",
          plan: input.plan,
          amount: input.amount,
          nextDueDate: nextDueDateOnly,
          currentPeriodEnd: existing?.currentPeriodEnd ?? nextDueDateOnly,
          updatedAt: new Date(),
        },
      })
      .returning()
  )[0];

  if (row === undefined) {
    throw new Error("Não foi possível criar checkout de assinatura");
  }

  return {
    ...subscriptionFromRow(row),
    paymentUrl: getAsaasCheckoutUrl(checkout),
  };
};
