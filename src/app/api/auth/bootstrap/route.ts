import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getBearerToken, verifyFirebaseIdToken } from "../../../../lib/firebase/serverAuth";
import { bootstrapClinicOwner } from "../../../../lib/services/authPostgresService";

export const runtime = "nodejs";

const schema = z.object({
  clinicId: z.string().uuid("Clínica inválida"),
  ownerName: z.string().min(2, "Informe o nome"),
  ownerEmail: z.string().email("Email inválido"),
  clinicName: z.string().min(2, "Informe a clínica"),
  cnpj: z.string().min(14, "Informe o CNPJ"),
  phone: z.string().min(10, "Informe o telefone"),
  city: z.string().min(2, "Informe a cidade"),
  state: z.string().length(2, "Informe a UF"),
  checkoutSessionId: z.string().uuid("Pagamento inválido").optional(),
});

const clientErrorMessages = new Set([
  "CNPJ já cadastrado. Entre pelo login ou use outro CNPJ para criar uma nova clínica.",
  "Sessão de pagamento não encontrada",
  "Pagamento ainda não confirmado",
]);

const getErrorResponse = (error: unknown): { message: string; status: number } => {
  const message = error instanceof Error ? error.message : "Não foi possível preparar a clínica";

  if (clientErrorMessages.has(message)) {
    return { message, status: 400 };
  }

  if (message === "Sessão inválida" || message === "Sessão expirada") {
    return { message, status: 401 };
  }

  if (message === "DATABASE_URL não configurada") {
    return {
      message: "Banco de dados não configurado no servidor",
      status: 500,
    };
  }

  console.error("auth/bootstrap failed", error);
  return {
    message: "Não foi possível preparar a clínica. Tente novamente em instantes.",
    status: 500,
  };
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

    const user = await bootstrapClinicOwner({
      firebaseUid: firebaseUser.uid,
      ...parsed.data,
    });

    return NextResponse.json({ user });
  } catch (error: unknown) {
    const { message, status } = getErrorResponse(error);
    return NextResponse.json(
      { message },
      { status },
    );
  }
};
