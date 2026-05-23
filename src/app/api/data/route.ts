import { NextResponse, type NextRequest } from "next/server";
import * as appointmentService from "../../../lib/serverServices/appointmentService";
import * as clinicService from "../../../lib/serverServices/clinicService";
import * as doctorService from "../../../lib/serverServices/doctorService";
import * as employeeService from "../../../lib/serverServices/employeeService";
import * as examTypeService from "../../../lib/serverServices/examTypeService";
import * as financialService from "../../../lib/serverServices/financialService";
import * as insuranceService from "../../../lib/serverServices/insuranceService";
import * as patientService from "../../../lib/serverServices/patientService";
import * as scheduleService from "../../../lib/serverServices/scheduleService";
import * as specialtyService from "../../../lib/serverServices/specialtyService";
import { verifyFirebaseIdToken } from "../../../lib/firebase/serverAuth";
import { getUserByFirebaseUid, type ClientUser } from "../../../lib/services/authPostgresService";
import { getBillingAccess, type BillingAccess } from "../../../lib/services/subscriptionService";

export const runtime = "nodejs";

type RpcPayload = {
  resource: string;
  action: string;
  args: unknown[];
};

type ServiceMap = Record<string, Record<string, (...args: never[]) => Promise<unknown> | unknown>>;
type CacheEntry<T> = {
  expiresAt: number;
  promise: Promise<T>;
};

const userCache = new Map<string, CacheEntry<ClientUser | null>>();
const billingAccessCache = new Map<string, CacheEntry<BillingAccess>>();
const userCacheTtlMs = 15_000;
const billingAccessCacheTtlMs = 30_000;

const services: ServiceMap = {
  appointments: appointmentService as unknown as Record<string, (...args: never[]) => Promise<unknown> | unknown>,
  clinics: clinicService as unknown as Record<string, (...args: never[]) => Promise<unknown> | unknown>,
  doctors: doctorService as unknown as Record<string, (...args: never[]) => Promise<unknown> | unknown>,
  employees: employeeService as unknown as Record<string, (...args: never[]) => Promise<unknown> | unknown>,
  examTypes: examTypeService as unknown as Record<string, (...args: never[]) => Promise<unknown> | unknown>,
  financial: financialService as unknown as Record<string, (...args: never[]) => Promise<unknown> | unknown>,
  insurances: insuranceService as unknown as Record<string, (...args: never[]) => Promise<unknown> | unknown>,
  patients: patientService as unknown as Record<string, (...args: never[]) => Promise<unknown> | unknown>,
  schedules: scheduleService as unknown as Record<string, (...args: never[]) => Promise<unknown> | unknown>,
  specialties: specialtyService as unknown as Record<string, (...args: never[]) => Promise<unknown> | unknown>,
};

const isRpcPayload = (value: unknown): value is RpcPayload => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const payload = value as Partial<RpcPayload>;
  return (
    typeof payload.resource === "string" &&
    typeof payload.action === "string" &&
    Array.isArray(payload.args)
  );
};

const getRequestToken = (request: NextRequest): string | null => {
  const authorization = request.headers.get("authorization") ?? "";

  if (authorization.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length).trim();
  }

  return request.cookies.get("firebase-token")?.value ?? null;
};

const getCachedUser = (firebaseUid: string): Promise<ClientUser | null> => {
  const cached = userCache.get(firebaseUid);
  const now = Date.now();

  if (cached !== undefined && cached.expiresAt > now) {
    return cached.promise;
  }

  const promise = getUserByFirebaseUid(firebaseUid).catch((error: unknown) => {
    userCache.delete(firebaseUid);
    throw error;
  });
  userCache.set(firebaseUid, { expiresAt: now + userCacheTtlMs, promise });
  return promise;
};

const getCachedBillingAccess = (
  clinicId: string,
  email: string,
): Promise<BillingAccess> => {
  const key = `${clinicId}:${email.toLowerCase()}`;
  const cached = billingAccessCache.get(key);
  const now = Date.now();

  if (cached !== undefined && cached.expiresAt > now) {
    return cached.promise;
  }

  const promise = getBillingAccess(clinicId, email).catch((error: unknown) => {
    billingAccessCache.delete(key);
    throw error;
  });
  billingAccessCache.set(key, {
    expiresAt: now + billingAccessCacheTtlMs,
    promise,
  });
  return promise;
};

const clientErrorMessages = new Set([
  "CRM já cadastrado para esta clínica.",
  "Médico não encontrado",
  "Paciente não encontrado",
  "Agendamento não encontrado",
  "Horário não disponível",
  "Clínica não encontrada",
]);

const getErrorResponse = (error: unknown): { message: string; status: number } => {
  const message = error instanceof Error ? error.message : "Erro ao processar dados";

  if (message === "Sessão inválida") {
    return { message, status: 401 };
  }

  if (clientErrorMessages.has(message)) {
    return { message, status: 400 };
  }

  console.error("Erro em /api/data", error);
  return {
    message: "Não foi possível concluir a operação. Verifique os dados e tente novamente.",
    status: 500,
  };
};

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  try {
    const token = getRequestToken(request);

    if (token === null || token.length === 0) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const firebaseUser = await verifyFirebaseIdToken(token);
    const user = await getCachedUser(firebaseUser.uid);

    if (user === null || !user.active) {
      return NextResponse.json({ message: "Usuário sem acesso" }, { status: 403 });
    }

    const access = await getCachedBillingAccess(user.clinicId, user.email);

    if (!access.allowed) {
      return NextResponse.json(
        { message: "Assinatura necessária para continuar" },
        { status: 402 },
      );
    }

    const body = (await request.json()) as unknown;

    if (!isRpcPayload(body)) {
      return NextResponse.json({ message: "Requisição inválida" }, { status: 400 });
    }

    const service = services[body.resource];
    const action = service?.[body.action];

    if (action === undefined) {
      return NextResponse.json({ message: "Ação não encontrada" }, { status: 404 });
    }

    const clinicId = body.args[0];

    if (typeof clinicId === "string" && clinicId !== user.clinicId) {
      return NextResponse.json({ message: "Clínica não autorizada" }, { status: 403 });
    }

    const result = await action(...(body.args as never[]));
    return NextResponse.json({ result });
  } catch (error: unknown) {
    const { message, status } = getErrorResponse(error);

    return NextResponse.json(
      { message },
      { status },
    );
  }
};
