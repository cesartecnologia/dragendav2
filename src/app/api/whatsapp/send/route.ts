import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { sendMessage } from "../../../../lib/services/whatsappService";

const schema = z.object({
  phone: z.string().min(10, "Telefone inválido"),
  templateName: z.union([z.literal("confirmation"), z.literal("reminder"), z.literal("cancellation"), z.literal("payment_reminder"), z.literal("custom")]),
  variables: z.record(z.string()),
  clinicId: z.string().min(1, "Clínica obrigatória"),
});

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  if (!(request.headers.get("authorization") ?? "").startsWith("Bearer ")) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ message: "Dados inválidos" }, { status: 400 });
  }

  const result = await sendMessage(parsed.data.clinicId, parsed.data.phone, parsed.data.templateName, parsed.data.variables);
  return NextResponse.json(result);
};

