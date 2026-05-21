import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUserFromRequest } from "../../../../lib/auth/apiSession";
import { createClinicSubscription } from "../../../../lib/services/subscriptionService";

export const runtime = "nodejs";

const cardSchema = z.object({
  holderName: z.string().min(3, "Informe o nome impresso no cartão"),
  number: z.string().min(13, "Informe o número do cartão"),
  expiryMonth: z.string().regex(/^\d{2}$/, "Informe o mês"),
  expiryYear: z.string().regex(/^\d{4}$/, "Informe o ano"),
  ccv: z.string().min(3, "Informe o CVV"),
});

const holderSchema = z.object({
  name: z.string().min(3, "Informe o nome"),
  email: z.string().email("Informe um email válido"),
  cpfCnpj: z.string().min(11, "Informe CPF ou CNPJ"),
  phone: z.string().min(10, "Informe o telefone"),
  postalCode: z.string().min(8, "Informe o CEP"),
  addressNumber: z.string().min(1, "Informe o número"),
});

const schema = z.discriminatedUnion("billingType", [
  z.object({
    billingType: z.literal("BOLETO"),
    holder: holderSchema,
  }),
  z.object({
    billingType: z.literal("CREDIT_CARD"),
    holder: holderSchema,
    creditCard: cardSchema,
  }),
]);

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  const user = await getSessionUserFromRequest(request);

  if (user === null || !user.active) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.errors[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  }

  const subscription = await createClinicSubscription({
    clinicId: user.clinicId,
    plan: "starter",
    amount: 9990,
    billingType: parsed.data.billingType,
    holder: parsed.data.holder,
    creditCard: parsed.data.billingType === "CREDIT_CARD" ? parsed.data.creditCard : undefined,
  });

  return NextResponse.json({ subscription });
};
