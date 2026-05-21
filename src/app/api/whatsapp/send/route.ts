import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUserFromRequest } from "../../../../lib/auth/apiSession";
import { sendMessage } from "../../../../lib/serverServices/whatsappService";

const schema = z.object({
  phone: z.string().min(10, "Telefone inválido"),
  templateName: z.union([z.literal("confirmation"), z.literal("reminder"), z.literal("cancellation"), z.literal("payment_reminder"), z.literal("custom")]),
  variables: z.record(z.string()),
  clinicId: z.string().min(1, "Clínica obrigatória"),
});

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  const user = await getSessionUserFromRequest(request);

  if (user === null || !user.active) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ message: "Dados inválidos" }, { status: 400 });
  }

  if (parsed.data.clinicId !== user.clinicId) {
    return NextResponse.json({ message: "Clínica não autorizada" }, { status: 403 });
  }

  const result = await sendMessage(user.clinicId, parsed.data.phone, parsed.data.templateName, parsed.data.variables);
  return NextResponse.json(result);
};
