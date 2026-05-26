export const ASAAS_BILLING_TYPE = {
  CREDIT_CARD: "CREDIT_CARD",
  BOLETO: "BOLETO",
  PIX: "PIX",
  UNDEFINED: "UNDEFINED",
} as const;

export type AsaasBillingType =
  (typeof ASAAS_BILLING_TYPE)[keyof typeof ASAAS_BILLING_TYPE];

export const ASAAS_CYCLE = {
  MONTHLY: "MONTHLY",
} as const;

export type AsaasCycle = (typeof ASAAS_CYCLE)[keyof typeof ASAAS_CYCLE];

export const ASAAS_CHARGE_TYPE = {
  RECURRENT: "RECURRENT",
} as const;

export type AsaasChargeType =
  (typeof ASAAS_CHARGE_TYPE)[keyof typeof ASAAS_CHARGE_TYPE];

export type AsaasCustomerInput = {
  name: string;
  email: string;
  cpfCnpj: string;
  phone: string;
};

export type AsaasCustomerResponse = {
  id: string;
  name: string;
  email: string;
};

export type AsaasSubscriptionInput = {
  customer: string;
  billingType: AsaasBillingType;
  value: number;
  nextDueDate: string;
  cycle: AsaasCycle;
  description: string;
  externalReference: string;
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    phone: string;
  };
};

export type AsaasSubscriptionResponse = {
  id: string;
  customer: string;
  status: string;
  value: number;
  nextDueDate: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
};

export type AsaasPaymentLinkInput = {
  billingType: "BOLETO" | "CREDIT_CARD" | "PIX" | "UNDEFINED";
  chargeType: "DETACHED" | "RECURRENT" | "INSTALLMENT";
  name: string;
  description: string;
  value: number;
  externalReference?: string;
  dueDateLimitDays?: number;
  notificationEnabled?: boolean;
  callback: {
    successUrl: string;
    autoRedirect: boolean;
  };
  isAddressRequired?: boolean;
};

export type AsaasPaymentLinkResponse = {
  id: string;
  url: string;
};

export type AsaasPaymentResponse = {
  id: string;
  status?: string;
  customer?: string;
  subscription?: string;
  checkoutSession?: string;
  paymentLink?: string;
  externalReference?: string;
  billingType?: string;
  value?: number;
  dueDate?: string;
  dateCreated?: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
};

export type AsaasCheckoutInput = {
  billingTypes: AsaasBillingType[];
  chargeTypes: AsaasChargeType[];
  minutesToExpire: number;
  externalReference: string;
  callback: {
    successUrl: string;
    cancelUrl: string;
    expiredUrl: string;
  };
  items: Array<{
    name: string;
    description: string;
    quantity: number;
    value: number;
  }>;
  customerData?: {
    name: string;
    email: string;
    cpfCnpj: string;
    phone: string;
  };
  subscription: {
    cycle: AsaasCycle;
    nextDueDate: string;
  };
};

export type AsaasCheckoutResponse = {
  id: string;
  url?: string;
  checkoutUrl?: string;
  link?: string;
};

export type AsaasErrorResponse = {
  errors?: Array<{ code?: string; description?: string }>;
};

const getRequiredEnv = (key: string, value: string | undefined): string => {
  if (value === undefined || value.trim().length === 0) {
    throw new Error(`Variável de ambiente ausente: ${key}`);
  }

  return value;
};

const getOptionalEnv = (...values: Array<string | undefined>): string | undefined => {
  return values.find((value) => value !== undefined && value.trim().length > 0);
};

const getConfiguredAsaasBaseUrl = (): string => {
  const configuredUrl =
    process.env.ASAAS_API_BASE_URL?.replace(/\/$/, "") ??
    process.env.ASAAS_API_URL?.replace(/\/$/, "");

  if (configuredUrl === undefined || configuredUrl.trim().length === 0) {
    return process.env.ASAAS_ENV?.trim().toLowerCase() === "sandbox"
      ? "https://api-sandbox.asaas.com/v3"
      : "https://api.asaas.com/v3";
  }

  if (configuredUrl === "https://sandbox.asaas.com/api/v3") {
    return "https://api-sandbox.asaas.com/v3";
  }

  if (configuredUrl === "https://www.asaas.com/api/v3") {
    return "https://api.asaas.com/v3";
  }

  return configuredUrl;
};

const getAsaasBaseUrl = (): string => getConfiguredAsaasBaseUrl();

const getAlternateAsaasBaseUrl = (baseUrl: string): string | null => {
  if (baseUrl.includes("api-sandbox.asaas.com")) {
    return "https://api.asaas.com/v3";
  }

  if (baseUrl.includes("api.asaas.com")) {
    return "https://api-sandbox.asaas.com/v3";
  }

  return null;
};

const isInvalidApiKeyError = (message: string): boolean => {
  const normalized = message.toLowerCase();
  return normalized.includes("chave de api") && (normalized.includes("inválida") || normalized.includes("invalida"));
};

const getAsaasWebBaseUrl = (): string => {
  const configuredUrl = process.env.ASAAS_CHECKOUT_BASE_URL?.replace(/\/$/, "");

  if (configuredUrl !== undefined && configuredUrl.length > 0) {
    return configuredUrl;
  }

  const apiUrl = getAsaasBaseUrl();
  return apiUrl.includes("sandbox")
    ? "https://sandbox.asaas.com/checkoutSession/show"
    : "https://asaas.com/checkoutSession/show";
};

const asaasFetch = async <TResponse>(
  path: string,
  init: RequestInit,
): Promise<TResponse> => {
  const accessToken = getRequiredEnv(
    "ASAAS_API_KEY ou ASAAS_ACCESS_TOKEN",
    getOptionalEnv(process.env.ASAAS_API_KEY, process.env.ASAAS_ACCESS_TOKEN),
  );
  const requestInit: RequestInit = {
    ...init,
    headers: {
      "Content-Type": "application/json",
      access_token: accessToken,
      ...init.headers,
    },
  };
  const baseUrl = getAsaasBaseUrl();
  const response = await fetch(`${baseUrl}${path}`, requestInit);

  if (!response.ok) {
    const payload = (await response.json().catch(
      (): AsaasErrorResponse => ({ errors: [] }),
    )) as AsaasErrorResponse;
    const message =
      payload.errors?.[0]?.description ?? "Erro ao comunicar com o Asaas";

    const alternateBaseUrl = getAlternateAsaasBaseUrl(baseUrl);

    if (alternateBaseUrl !== null && isInvalidApiKeyError(message)) {
      const retryResponse = await fetch(`${alternateBaseUrl}${path}`, requestInit);

      if (retryResponse.ok) {
        return (await retryResponse.json()) as TResponse;
      }

      const retryPayload = (await retryResponse.json().catch(
        (): AsaasErrorResponse => ({ errors: [] }),
      )) as AsaasErrorResponse;
      const retryMessage =
        retryPayload.errors?.[0]?.description ?? "Erro ao comunicar com o Asaas";
      throw new Error(retryMessage);
    }

    throw new Error(message);
  }

  return (await response.json()) as TResponse;
};

export const createAsaasCustomer = async (
  input: AsaasCustomerInput,
): Promise<AsaasCustomerResponse> => {
  return await asaasFetch<AsaasCustomerResponse>("/customers", {
    method: "POST",
    body: JSON.stringify(input),
  });
};

export const createAsaasSubscription = async (
  input: AsaasSubscriptionInput,
): Promise<AsaasSubscriptionResponse> => {
  return await asaasFetch<AsaasSubscriptionResponse>("/subscriptions", {
    method: "POST",
    body: JSON.stringify(input),
  });
};

export const createAsaasCheckout = async (
  input: AsaasCheckoutInput,
): Promise<AsaasCheckoutResponse> => {
  return await asaasFetch<AsaasCheckoutResponse>("/checkouts", {
    method: "POST",
    body: JSON.stringify(input),
  });
};

export const createAsaasPaymentLink = async (
  input: AsaasPaymentLinkInput,
): Promise<AsaasPaymentLinkResponse> => {
  return await asaasFetch<AsaasPaymentLinkResponse>("/paymentLinks", {
    method: "POST",
    body: JSON.stringify(input),
  });
};

export const listAsaasPayments = async (params: {
  checkoutSession?: string | null;
  externalReference?: string | null;
  limit?: number;
} = {}): Promise<AsaasPaymentResponse[]> => {
  const searchParams = new URLSearchParams();

  if (params.checkoutSession !== undefined && params.checkoutSession !== null) {
    searchParams.set("checkoutSession", params.checkoutSession);
  }

  if (params.externalReference !== undefined && params.externalReference !== null) {
    searchParams.set("externalReference", params.externalReference);
  }

  searchParams.set("limit", (params.limit ?? 10).toString());
  const suffix = searchParams.toString();
  const response = await asaasFetch<{ data?: AsaasPaymentResponse[] }>(
    `/payments${suffix.length > 0 ? `?${suffix}` : ""}`,
    { method: "GET" },
  );

  return response.data ?? [];
};

export const getAsaasCheckoutUrl = (checkout: AsaasCheckoutResponse): string => {
  return (
    checkout.checkoutUrl ??
    checkout.url ??
    checkout.link ??
    `${getAsaasWebBaseUrl()}/${encodeURIComponent(checkout.id)}`
  );
};
