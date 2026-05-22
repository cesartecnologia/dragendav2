import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getUserByFirebaseUid } from "../../../../lib/services/authPostgresService";
import {
  createClinicHostedCheckout,
  getBillingAccess,
  getSubscriptionByClinic,
} from "../../../../lib/services/subscriptionService";
import { getBearerToken, verifyFirebaseIdToken } from "../../../../lib/firebase/serverAuth";
import { CLINIC_PLAN } from "../../../../lib/types";

export const runtime = "nodejs";

const schema = z.object({
  plan: z.enum([CLINIC_PLAN.STARTER, CLINIC_PLAN.PRO, CLINIC_PLAN.ENTERPRISE]),
  amount: z.number().int().min(100, "Valor inválido"),
});

const getRequestToken = (request: NextRequest): string | null => {
  return getBearerToken(request) ?? request.cookies.get("firebase-token")?.value ?? null;
};

const getSessionUser = async (request: NextRequest) => {
  const token = getRequestToken(request);

  if (token === null) {
    return null;
  }

  const firebaseUser = await verifyFirebaseIdToken(token);
  return await getUserByFirebaseUid(firebaseUser.uid);
};

export const GET = async (request: NextRequest): Promise<NextResponse> => {
  const user = await getSessionUser(request);

  if (user === null) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  const subscription = await getSubscriptionByClinic(user.clinicId);
  const access = await getBillingAccess(user.clinicId, user.email);
  return NextResponse.json({ subscription, access });
};

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  const user = await getSessionUser(request).catch(() => null);

  if (user === null || user.role !== "OWNER") {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.errors[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  }

  try {
    const subscription = await createClinicHostedCheckout({
      clinicId: user.clinicId,
      plan: parsed.data.plan,
      amount: parsed.data.amount,
      callbackBaseUrl: request.nextUrl.origin,
    });

    return NextResponse.json({ subscription });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível iniciar o checkout",
      },
      { status: 400 },
    );
  }
};
