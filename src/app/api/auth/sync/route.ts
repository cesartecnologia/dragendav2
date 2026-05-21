import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getBearerToken, verifyFirebaseIdToken } from "../../../../lib/firebase/serverAuth";
import { syncFirebaseUserToPostgres } from "../../../../lib/services/authPostgresService";
import { CLINIC_PLAN, ROLES } from "../../../../lib/types";

export const runtime = "nodejs";

const addressSchema = z.object({
  cep: z.string(),
  street: z.string(),
  number: z.string(),
  complement: z.string(),
  neighborhood: z.string(),
  city: z.string(),
  state: z.string(),
});

const schema = z.object({
  clinicId: z.string().uuid("Clínica inválida"),
  role: z.enum([ROLES.OWNER, ROLES.ADMIN, ROLES.RECEPTIONIST]),
  name: z.string().min(2, "Informe o nome"),
  email: z.string().email("Email inválido"),
  active: z.boolean(),
  clinic: z.object({
    name: z.string().min(2),
    cnpj: z.string(),
    phone: z.string(),
    email: z.string().email(),
    address: addressSchema,
    logoUrl: z.string(),
    logoPublicId: z.string(),
    primaryColor: z.string(),
    whatsappToken: z.string(),
    whatsappPhone: z.string(),
    whatsappApiUrl: z.string(),
    plan: z.enum([CLINIC_PLAN.STARTER, CLINIC_PLAN.PRO, CLINIC_PLAN.ENTERPRISE]),
    active: z.boolean(),
  }),
});

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  try {
    const token = getBearerToken(request);

    if (token === null) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const firebaseUser = await verifyFirebaseIdToken(token);
    const payload = (await request.json()) as unknown;
    const parsed = schema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.errors[0]?.message ?? "Dados inválidos" },
        { status: 400 },
      );
    }

    if (parsed.data.email !== firebaseUser.email) {
      return NextResponse.json(
        { message: "Email não corresponde ao usuário autenticado" },
        { status: 403 },
      );
    }

    const user = await syncFirebaseUserToPostgres({
      firebaseUid: firebaseUser.uid,
      ...parsed.data,
    });

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json(
      { message: "Não foi possível sincronizar usuário" },
      { status: 500 },
    );
  }
};
