import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAuthorizedSessionFromRequest } from "../../../../lib/auth/apiSession";
import {
  getTemplates,
  updateTemplate,
} from "../../../../lib/serverServices/whatsappService";

const schema = z.object({
  name: z.union([
    z.literal("confirmation"),
    z.literal("reminder"),
    z.literal("cancellation"),
    z.literal("payment_reminder"),
    z.literal("custom"),
  ]),
  content: z.string().min(1, "Informe o conteúdo"),
});

export const GET = async (request: NextRequest): Promise<NextResponse> => {
  const session = await getAuthorizedSessionFromRequest(request);

  if (session === null) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  const { user } = session;
  const templates = await getTemplates(user.clinicId);
  return NextResponse.json({ templates });
};

export const PATCH = async (request: NextRequest): Promise<NextResponse> => {
  const session = await getAuthorizedSessionFromRequest(request);

  if (session === null) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  const { user } = session;
  const parsed = schema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.errors[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  }

  await updateTemplate(user.clinicId, parsed.data.name, parsed.data.content);
  return NextResponse.json({ success: true });
};
