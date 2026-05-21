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
import { getUserByFirebaseUid } from "../../../lib/services/authPostgresService";
import { getBillingAccess } from "../../../lib/services/subscriptionService";

export const runtime = "nodejs";

type RpcPayload = {
  resource: string;
  action: string;
  args: unknown[];
};

type ServiceMap = Record<string, Record<string, (...args: never[]) => Promise<unknown> | unknown>>;

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

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  try {
    const token = getRequestToken(request);

    if (token === null || token.length === 0) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const firebaseUser = await verifyFirebaseIdToken(token);
    const user = await getUserByFirebaseUid(firebaseUser.uid);

    if (user === null || !user.active) {
      return NextResponse.json({ message: "Usuário sem acesso" }, { status: 403 });
    }

    const access = await getBillingAccess(user.clinicId, user.email);

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
    const message = error instanceof Error ? error.message : "Erro ao processar dados";
    const status = message === "Sessão inválida" ? 401 : 500;

    return NextResponse.json(
      { message },
      { status },
    );
  }
};
