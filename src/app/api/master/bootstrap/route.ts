import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getBearerToken, verifyFirebaseIdToken } from "../../../../lib/firebase/serverAuth";
import { bootstrapMasterOwner } from "../../../../lib/services/authPostgresService";
import { isMasterEmail } from "../../../../lib/services/subscriptionService";

export const runtime = "nodejs";

const schema = z.object({
  clinicId: z.string().uuid("Clínica inválida"),
  ownerName: z.string().min(2, "Informe o nome"),
  ownerEmail: z.string().email("Email inválido"),
  clinicName: z.string().min(2, "Informe a clínica"),
  accessCode: z.string().optional(),
});

const hasValidAccessCode = (accessCode: string | undefined): boolean => {
  const configuredCode = process.env.MASTER_ACCESS_CODE;

  if (configuredCode === undefined || configuredCode.trim().length === 0) {
    return true;
  }

  return accessCode === configuredCode;
};

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

    if (parsed.data.ownerEmail !== firebaseUser.email) {
      return NextResponse.json(
        { message: "Email não corresponde ao usuário autenticado" },
        { status: 403 },
      );
    }

    if (!isMasterEmail(parsed.data.ownerEmail) || !hasValidAccessCode(parsed.data.accessCode)) {
      return NextResponse.json(
        { message: "Acesso master não autorizado" },
        { status: 403 },
      );
    }

    const user = await bootstrapMasterOwner({
      firebaseUid: firebaseUser.uid,
      clinicId: parsed.data.clinicId,
      ownerName: parsed.data.ownerName,
      ownerEmail: parsed.data.ownerEmail,
      clinicName: parsed.data.clinicName,
    });

    return NextResponse.json({ user });
  } catch (error: unknown) {
    console.error("master/bootstrap failed", error);
    return NextResponse.json(
      {
        message:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : "Não foi possível preparar o acesso master",
      },
      { status: 500 },
    );
  }
};
