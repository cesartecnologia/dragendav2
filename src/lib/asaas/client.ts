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
};

export type AsaasSubscriptionResponse = {
  id: string;
  customer: string;
  status: string;
  value: number;
  nextDueDate: string;
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

const getAsaasBaseUrl = (): string => {
  return process.env.ASAAS_API_URL?.replace(/\/$/, "") ?? "https://sandbox.asaas.com/api/v3";
};

const asaasFetch = async <TResponse>(
  path: string,
  init: RequestInit,
): Promise<TResponse> => {
  const accessToken = getRequiredEnv("ASAAS_API_KEY", process.env.ASAAS_API_KEY);
  const response = await fetch(`${getAsaasBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      access_token: accessToken,
      ...init.headers,
    },
  });

  if (!response.ok) {
    const payload = (await response.json().catch(
      (): AsaasErrorResponse => ({ errors: [] }),
    )) as AsaasErrorResponse;
    const message =
      payload.errors?.[0]?.description ?? "Erro ao comunicar com o Asaas";
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
