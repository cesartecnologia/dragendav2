import { desc, eq, or, type SQL } from "drizzle-orm";
import {
  createAsaasCheckout,
  createAsaasPaymentLink,
  getAsaasCheckoutUrl,
  listAsaasPayments,
  type AsaasPaymentResponse,
} from "../asaas/client";
import { getDb } from "../db";
import { checkoutOnboarding, checkoutPayments, checkoutSessions } from "../db/schema";

export type CheckoutPaymentMethod = "credit_card" | "boleto";
export type CheckoutSessionStatus = "initiated" | "waiting_payment" | "paid" | "expired" | "cancelled";
export type OnboardingStatus = "locked" | "released" | "processing" | "completed";

export type CheckoutSessionView = {
  id: string;
  planId: string;
  planName: string;
  value: number;
  paymentMethod: CheckoutPaymentMethod;
  status: CheckoutSessionStatus;
  asaasCheckoutId: string | null;
  asaasPaymentLinkId: string | null;
  asaasCustomerId: string | null;
  asaasSubscriptionId: string | null;
  paymentId: string | null;
  paymentStatus: string | null;
  checkoutUrl: string | null;
  invoiceUrl: string | null;
  payerName: string | null;
  payerEmail: string | null;
  payerPhone: string | null;
  payerCpfCnpj: string | null;
};

export type OnboardingView = {
  id: string;
  sessionId: string;
  status: OnboardingStatus;
  userId: string | null;
  clinicId: string | null;
};

const PLAN_ID = "starter";
const PLAN_NAME = "Plano Premium";
const PLAN_VALUE = Number(process.env.ASAAS_PLAN_VALUE ?? "99.90");

const activePaymentStatuses = new Set(["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"]);
const pendingPaymentStatuses = new Set(["PENDING", "AWAITING_RISK_ANALYSIS", "RECEIVED_AWAITING_CLEARING"]);
const expiredPaymentStatuses = new Set(["OVERDUE"]);
const cancelledPaymentStatuses = new Set(["DELETED", "REFUNDED", "CHARGEBACK_REQUESTED", "RECEIVED_IN_CASH_UNDONE"]);

const toSessionView = (row: typeof checkoutSessions.$inferSelect): CheckoutSessionView => ({
  id: row.id,
  planId: row.planId,
  planName: row.planName,
  value: row.value,
  paymentMethod: row.paymentMethod,
  status: row.status,
  asaasCheckoutId: row.asaasCheckoutId,
  asaasPaymentLinkId: row.asaasPaymentLinkId,
  asaasCustomerId: row.asaasCustomerId,
  asaasSubscriptionId: row.asaasSubscriptionId,
  paymentId: row.paymentId,
  paymentStatus: row.paymentStatus,
  checkoutUrl: row.checkoutUrl,
  invoiceUrl: row.invoiceUrl,
  payerName: row.payerName,
  payerEmail: row.payerEmail,
  payerPhone: row.payerPhone,
  payerCpfCnpj: row.payerCpfCnpj,
});

const toOnboardingView = (row: typeof checkoutOnboarding.$inferSelect): OnboardingView => ({
  id: row.id,
  sessionId: row.sessionId,
  status: row.status,
  userId: row.userId,
  clinicId: row.clinicId,
});

const normalizeStatus = (value?: string | null): string | null => value?.trim().toUpperCase() ?? null;

const isUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const normalizeBillingType = (value?: string | null): CheckoutPaymentMethod | null => {
  const normalized = normalizeStatus(value);
  if (normalized === "CREDIT_CARD") {
    return "credit_card";
  }

  if (normalized === "BOLETO") {
    return "boleto";
  }

  return null;
};

const getStatusFromPaymentStatus = (
  currentStatus: CheckoutSessionStatus,
  paymentStatus?: string | null,
): CheckoutSessionStatus => {
  const normalized = normalizeStatus(paymentStatus);

  if (normalized === null) {
    return currentStatus;
  }

  if (activePaymentStatuses.has(normalized)) {
    return "paid";
  }

  if (pendingPaymentStatuses.has(normalized)) {
    return "waiting_payment";
  }

  if (expiredPaymentStatuses.has(normalized)) {
    return "expired";
  }

  if (cancelledPaymentStatuses.has(normalized)) {
    return "cancelled";
  }

  return currentStatus;
};

const getStatusFromCheckoutStatus = (
  currentStatus: CheckoutSessionStatus,
  checkoutStatus?: string | null,
): CheckoutSessionStatus => {
  const normalized = normalizeStatus(checkoutStatus);

  if (normalized === "PAID") {
    return "paid";
  }

  if (normalized === "EXPIRED") {
    return "expired";
  }

  if (normalized === "CANCELED" || normalized === "CANCELLED") {
    return "cancelled";
  }

  return currentStatus;
};

const getPublicAppUrl = (): string => {
  const configuredUrl = process.env.ASAAS_CHECKOUT_CALLBACK_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
  const normalizedUrl = configuredUrl.replace(/\/$/, "");

  if (normalizedUrl.length === 0) {
    return "https://dragenda.cesartecnologia.com";
  }

  return normalizedUrl;
};

const formatAsaasDateTime = (date: Date): string => {
  const pad = (value: number): string => value.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
};

const sortPayments = (payments: AsaasPaymentResponse[]): AsaasPaymentResponse[] => {
  return [...payments].sort((paymentA, paymentB) => {
    const aTime = paymentA.dateCreated === undefined ? 0 : new Date(paymentA.dateCreated).getTime();
    const bTime = paymentB.dateCreated === undefined ? 0 : new Date(paymentB.dateCreated).getTime();
    return bTime - aTime;
  });
};

export const createCheckoutSession = async (
  paymentMethod: CheckoutPaymentMethod,
): Promise<CheckoutSessionView> => {
  const row = (
    await getDb()
      .insert(checkoutSessions)
      .values({
        planId: PLAN_ID,
        planName: PLAN_NAME,
        value: Math.round(PLAN_VALUE * 100),
        paymentMethod,
        status: "initiated",
      })
      .returning()
  )[0];

  if (row === undefined) {
    throw new Error("Não foi possível criar sessão de checkout");
  }

  await getDb().insert(checkoutOnboarding).values({
    sessionId: row.id,
    status: "locked",
  });

  return toSessionView(row);
};

export const getCheckoutSessionById = async (
  id: string,
): Promise<CheckoutSessionView | null> => {
  const row = (
    await getDb()
      .select()
      .from(checkoutSessions)
      .where(eq(checkoutSessions.id, id))
      .limit(1)
  )[0];

  return row === undefined ? null : toSessionView(row);
};

export const getOnboardingBySessionId = async (
  sessionId: string,
): Promise<OnboardingView | null> => {
  const row = (
    await getDb()
      .select()
      .from(checkoutOnboarding)
      .where(eq(checkoutOnboarding.sessionId, sessionId))
      .limit(1)
  )[0];

  return row === undefined ? null : toOnboardingView(row);
};

export const findCheckoutSessionByPublicReference = async (input: {
  sessionId?: string | null;
  checkoutSessionId?: string | null;
  paymentLinkId?: string | null;
  paymentId?: string | null;
  externalReference?: string | null;
}): Promise<CheckoutSessionView | null> => {
  const conditions: SQL[] = [];

  if (input.sessionId !== undefined && input.sessionId !== null && isUuid(input.sessionId.trim())) {
    conditions.push(eq(checkoutSessions.id, input.sessionId.trim()));
  }

  if (input.checkoutSessionId !== undefined && input.checkoutSessionId !== null && input.checkoutSessionId.trim().length > 0) {
    conditions.push(eq(checkoutSessions.asaasCheckoutId, input.checkoutSessionId));
  }

  if (input.paymentLinkId !== undefined && input.paymentLinkId !== null && input.paymentLinkId.trim().length > 0) {
    conditions.push(eq(checkoutSessions.asaasPaymentLinkId, input.paymentLinkId));
  }

  if (input.paymentId !== undefined && input.paymentId !== null && input.paymentId.trim().length > 0) {
    conditions.push(eq(checkoutSessions.paymentId, input.paymentId));
  }

  if (input.externalReference !== undefined && input.externalReference !== null && isUuid(input.externalReference.trim())) {
    conditions.push(eq(checkoutSessions.id, input.externalReference.trim()));
  }

  if (conditions.length === 0) {
    return null;
  }

  const row = (
    await getDb()
      .select()
      .from(checkoutSessions)
      .where(conditions.length === 1 ? conditions[0] : or(...conditions))
      .orderBy(desc(checkoutSessions.createdAt))
      .limit(1)
  )[0];

  return row === undefined ? null : toSessionView(row);
};

const updateCheckoutSession = async (
  id: string,
  values: Partial<typeof checkoutSessions.$inferInsert>,
): Promise<CheckoutSessionView> => {
  const row = (
    await getDb()
      .update(checkoutSessions)
      .set({
        ...values,
        updatedAt: new Date(),
      })
      .where(eq(checkoutSessions.id, id))
      .returning()
  )[0];

  if (row === undefined) {
    throw new Error("Sessão de checkout não encontrada");
  }

  return toSessionView(row);
};

const releaseOnboardingForSession = async (sessionId: string): Promise<void> => {
  await getDb()
    .update(checkoutOnboarding)
    .set({
      status: "released",
      releasedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(checkoutOnboarding.sessionId, sessionId));
};

export const completeOnboardingForSession = async (
  sessionId: string,
  input: {
    userId: string;
    clinicId: string;
  },
): Promise<void> => {
  await getDb()
    .update(checkoutOnboarding)
    .set({
      status: "completed",
      userId: input.userId,
      clinicId: input.clinicId,
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(checkoutOnboarding.sessionId, sessionId));
};

const upsertPaymentFromCheckoutSession = async (
  session: CheckoutSessionView,
  payment: AsaasPaymentResponse,
): Promise<void> => {
  const paymentStatus = normalizeStatus(payment.status);
  const paidAt = paymentStatus !== null && activePaymentStatuses.has(paymentStatus) ? new Date() : null;
  const value = payment.value === undefined ? session.value : Math.round(payment.value * 100);

  await getDb()
    .insert(checkoutPayments)
    .values({
      sessionId: session.id,
      asaasPaymentId: payment.id,
      status: payment.status ?? null,
      method: normalizeBillingType(payment.billingType) ?? session.paymentMethod,
      value,
      invoiceUrl: payment.invoiceUrl ?? payment.bankSlipUrl ?? null,
      asaasCustomerId: payment.customer ?? null,
      asaasSubscriptionId: payment.subscription ?? null,
      paidAt,
    })
    .onConflictDoUpdate({
      target: checkoutPayments.asaasPaymentId,
      set: {
        status: payment.status ?? null,
        method: normalizeBillingType(payment.billingType) ?? session.paymentMethod,
        value,
        invoiceUrl: payment.invoiceUrl ?? payment.bankSlipUrl ?? null,
        asaasCustomerId: payment.customer ?? null,
        asaasSubscriptionId: payment.subscription ?? null,
        paidAt,
        updatedAt: new Date(),
      },
    });
};

const updateSessionFromPayment = async (
  session: CheckoutSessionView,
  payment: AsaasPaymentResponse,
): Promise<CheckoutSessionView> => {
  const status = getStatusFromPaymentStatus(session.status, payment.status);
  const nextSession = await updateCheckoutSession(session.id, {
    status,
    paymentId: payment.id,
    paymentStatus: payment.status ?? null,
    invoiceUrl: payment.invoiceUrl ?? payment.bankSlipUrl ?? session.invoiceUrl,
    asaasCustomerId: payment.customer ?? session.asaasCustomerId,
    asaasSubscriptionId: payment.subscription ?? session.asaasSubscriptionId,
    paymentMethod: normalizeBillingType(payment.billingType) ?? session.paymentMethod,
    value: payment.value === undefined ? session.value : Math.round(payment.value * 100),
    paidAt: status === "paid" ? new Date() : session.status === "paid" ? new Date() : null,
  });

  await upsertPaymentFromCheckoutSession(nextSession, payment);

  if (nextSession.status === "paid") {
    await releaseOnboardingForSession(nextSession.id);
  }

  return nextSession;
};

export const startPublicCheckout = async (
  paymentMethod: CheckoutPaymentMethod,
): Promise<{ sessionId: string; checkoutUrl: string; checkoutId?: string; paymentLinkId?: string }> => {
  if (paymentMethod === "boleto") {
    return startPublicBoletoCheckout();
  }

  const session = await createCheckoutSession(paymentMethod);
  const appUrl = getPublicAppUrl();
  const callbackBase = `${appUrl}/primeiro-acesso?sessionId=${encodeURIComponent(session.id)}`;
  const nextDueDate = formatAsaasDateTime(new Date(Date.now() + 2 * 60 * 60 * 1000));
  const checkout = await createAsaasCheckout({
    billingTypes: ["CREDIT_CARD"],
    chargeTypes: ["RECURRENT"],
    minutesToExpire: 60,
    externalReference: session.id,
    callback: {
      successUrl: callbackBase,
      cancelUrl: `${callbackBase}&checkout=cancelled`,
      expiredUrl: `${callbackBase}&checkout=expired`,
    },
    items: [
      {
        name: PLAN_NAME,
        description: "Assinatura mensal do plano premium.",
        quantity: 1,
        value: PLAN_VALUE,
      },
    ],
    subscription: {
      cycle: "MONTHLY",
      nextDueDate,
    },
  });
  const checkoutUrl = getAsaasCheckoutUrl(checkout);

  await updateCheckoutSession(session.id, {
    asaasCheckoutId: checkout.id,
    checkoutUrl,
    status: "waiting_payment",
  });

  return {
    sessionId: session.id,
    checkoutId: checkout.id,
    checkoutUrl,
  };
};

export const startPublicBoletoCheckout = async (): Promise<{
  sessionId: string;
  paymentLinkId: string;
  checkoutUrl: string;
}> => {
  const session = await createCheckoutSession("boleto");
  const appUrl = getPublicAppUrl();
  const callbackBase = `${appUrl}/primeiro-acesso?sessionId=${encodeURIComponent(session.id)}`;
  const paymentLink = await createAsaasPaymentLink({
    billingType: "BOLETO",
    chargeType: "DETACHED",
    name: PLAN_NAME,
    description: "Primeira mensalidade do plano premium.",
    value: PLAN_VALUE,
    externalReference: session.id,
    dueDateLimitDays: 3,
    notificationEnabled: false,
    isAddressRequired: false,
    callback: {
      successUrl: callbackBase,
      autoRedirect: false,
    },
  });

  await updateCheckoutSession(session.id, {
    asaasPaymentLinkId: paymentLink.id,
    checkoutUrl: paymentLink.url,
    status: "waiting_payment",
  });

  return {
    sessionId: session.id,
    paymentLinkId: paymentLink.id,
    checkoutUrl: paymentLink.url,
  };
};

export const markCheckoutSessionFromCheckoutWebhook = async (input: {
  checkoutId: string;
  checkoutStatus?: string | null;
  customerId?: string | null;
  subscriptionId?: string | null;
}): Promise<CheckoutSessionView | null> => {
  const row = (
    await getDb()
      .select()
      .from(checkoutSessions)
      .where(eq(checkoutSessions.asaasCheckoutId, input.checkoutId))
      .limit(1)
  )[0];

  if (row === undefined) {
    return null;
  }

  const session = toSessionView(row);
  const nextSession = await updateCheckoutSession(session.id, {
    status: getStatusFromCheckoutStatus(session.status, input.checkoutStatus),
    asaasCustomerId: input.customerId ?? session.asaasCustomerId,
    asaasSubscriptionId: input.subscriptionId ?? session.asaasSubscriptionId,
  });

  if (nextSession.status === "paid") {
    await releaseOnboardingForSession(nextSession.id);
  }

  return nextSession;
};

export const markCheckoutSessionFromPaymentWebhook = async (input: {
  paymentId?: string | null;
  paymentStatus?: string | null;
  customerId?: string | null;
  subscriptionId?: string | null;
  checkoutSessionId?: string | null;
  paymentLinkId?: string | null;
  externalReference?: string | null;
  invoiceUrl?: string | null;
  billingType?: string | null;
  value?: number | null;
}): Promise<CheckoutSessionView | null> => {
  const conditions: SQL[] = [];

  if (input.paymentId !== undefined && input.paymentId !== null) {
    conditions.push(eq(checkoutSessions.paymentId, input.paymentId));
  }

  if (input.checkoutSessionId !== undefined && input.checkoutSessionId !== null) {
    conditions.push(eq(checkoutSessions.asaasCheckoutId, input.checkoutSessionId));
  }

  if (input.paymentLinkId !== undefined && input.paymentLinkId !== null) {
    conditions.push(eq(checkoutSessions.asaasPaymentLinkId, input.paymentLinkId));
  }

  if (input.subscriptionId !== undefined && input.subscriptionId !== null) {
    conditions.push(eq(checkoutSessions.asaasSubscriptionId, input.subscriptionId));
  }

  if (input.externalReference !== undefined && input.externalReference !== null && isUuid(input.externalReference.trim())) {
    conditions.push(eq(checkoutSessions.id, input.externalReference.trim()));
  }

  if (conditions.length === 0) {
    return null;
  }

  const row = (
    await getDb()
      .select()
      .from(checkoutSessions)
      .where(conditions.length === 1 ? conditions[0] : or(...conditions))
      .orderBy(desc(checkoutSessions.createdAt))
      .limit(1)
  )[0];

  if (row === undefined || input.paymentId === undefined || input.paymentId === null) {
    return null;
  }

  return updateSessionFromPayment(toSessionView(row), {
    id: input.paymentId,
    status: input.paymentStatus ?? undefined,
    customer: input.customerId ?? undefined,
    subscription: input.subscriptionId ?? undefined,
    invoiceUrl: input.invoiceUrl ?? undefined,
    billingType: input.billingType ?? undefined,
    value: input.value ?? undefined,
  });
};

export const syncCheckoutSessionWithAsaas = async (
  sessionId: string,
): Promise<CheckoutSessionView | null> => {
  const session = await getCheckoutSessionById(sessionId);

  if (session === null || session.status === "paid") {
    return session;
  }

  const payments =
    session.asaasCheckoutId !== null
      ? await listAsaasPayments({ checkoutSession: session.asaasCheckoutId, limit: 20 })
      : await listAsaasPayments({ externalReference: session.id, limit: 20 });
  const latestPayment = sortPayments(payments)[0];

  if (latestPayment === undefined) {
    return session;
  }

  return updateSessionFromPayment(session, latestPayment);
};
