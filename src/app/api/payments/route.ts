import { NextResponse, type NextRequest } from "next/server";
import { getPaymentsPaginated, registerPayment } from "../../../lib/serverServices/financialService";
import { paymentSchema } from "../../../lib/validations/payment";
import { getAuthorizedSessionFromRequest } from "../../../lib/auth/apiSession";

export const GET = async (request: NextRequest): Promise<NextResponse> => {
  const session = await getAuthorizedSessionFromRequest(request);

  if (session === null) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  const { user } = session;
  const result = await getPaymentsPaginated(user.clinicId, {}, null);
  return NextResponse.json({ data: result.data, hasMore: result.hasMore });
};

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  const session = await getAuthorizedSessionFromRequest(request);

  if (session === null) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  const { user } = session;
  const parsed = paymentSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ message: "Dados inválidos" }, { status: 400 });
  }

  const payment = await registerPayment(user.clinicId, {
    ...parsed.data,
    createdBy: user.name,
  });

  return NextResponse.json(payment, { status: 201 });
};
