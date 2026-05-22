import { NextResponse, type NextRequest } from "next/server";
import {
  processAsaasWebhook,
  type AsaasWebhookPayload,
} from "../../../../lib/services/subscriptionService";
import {
  markCheckoutSessionFromCheckoutWebhook,
  markCheckoutSessionFromPaymentWebhook,
} from "../../../../lib/services/checkoutSessionService";

export const runtime = "nodejs";

const getWebhookToken = (): string => {
  const token = process.env.ASAAS_WEBHOOK_TOKEN;

  if (token === undefined || token.trim().length === 0) {
    throw new Error("ASAAS_WEBHOOK_TOKEN não configurado");
  }

  return token;
};

const isAsaasWebhookPayload = (value: unknown): value is AsaasWebhookPayload => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const payload = value as Partial<AsaasWebhookPayload>;
  return typeof payload.event === "string" && payload.event.length > 0;
};

const isAuthorized = (request: NextRequest): boolean => {
  const expectedToken = getWebhookToken();
  const accessToken = request.headers.get("asaas-access-token") ?? "";
  const authorization = request.headers.get("authorization") ?? "";

  return accessToken === expectedToken || authorization === `Bearer ${expectedToken}`;
};

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const payload = (await request.json()) as unknown;

    if (!isAsaasWebhookPayload(payload)) {
      return NextResponse.json(
        { message: "Evento inválido" },
        { status: 400 },
      );
    }

    if (payload.checkout?.id !== undefined) {
      await markCheckoutSessionFromCheckoutWebhook({
        checkoutId: payload.checkout.id,
        checkoutStatus: payload.checkout.status,
        customerId: payload.checkout.customer,
        subscriptionId: payload.checkout.subscription,
      });
    }

    if (payload.payment !== undefined) {
      await markCheckoutSessionFromPaymentWebhook({
        paymentId: payload.payment.id,
        paymentStatus: payload.payment.status,
        customerId: payload.payment.customer,
        subscriptionId: payload.payment.subscription,
        checkoutSessionId: payload.payment.checkoutSession,
        paymentLinkId: payload.payment.paymentLink,
        externalReference: payload.payment.externalReference,
        invoiceUrl: payload.payment.invoiceUrl ?? payload.payment.bankSlipUrl,
        billingType: payload.payment.billingType,
        value: payload.payment.value,
      });
    }

    await processAsaasWebhook(payload);

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json(
      { message: "Erro ao processar evento do Asaas" },
      { status: 500 },
    );
  }
};
