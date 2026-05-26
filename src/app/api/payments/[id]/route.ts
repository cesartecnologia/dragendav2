import { NextResponse, type NextRequest } from "next/server";
import { updatePayment } from "../../../../lib/serverServices/financialService";
import { paymentUpdateSchema } from "../../../../lib/validations/payment";
import { getAuthorizedSessionFromRequest } from "../../../../lib/auth/apiSession";

export type PaymentRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const PATCH = async (request: NextRequest, context: PaymentRouteContext): Promise<NextResponse> => {
  const session = await getAuthorizedSessionFromRequest(request);

  if (session === null) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  const { user } = session;
  const parsed = paymentUpdateSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ message: "Dados inválidos" }, { status: 400 });
  }

  const params = await context.params;
  await updatePayment(user.clinicId, params.id, parsed.data);
  return NextResponse.json({ success: true });
};
