import { NextResponse, type NextRequest } from "next/server";
import { getPaymentsPaginated, registerPayment } from "../../../lib/serverServices/financialService";
import { paymentSchema } from "../../../lib/validations/payment";
import { verifyFirebaseIdToken } from "../../../lib/firebase/serverAuth";
import { getUserByFirebaseUid, type ClientUser } from "../../../lib/services/authPostgresService";

const authenticate = async (request: NextRequest): Promise<ClientUser | null> => {
  const authorization = request.headers.get("authorization") ?? "";

  if (!authorization.startsWith("Bearer ")) {
    return null;
  }

  const firebaseUser = await verifyFirebaseIdToken(authorization.slice("Bearer ".length).trim());
  return await getUserByFirebaseUid(firebaseUser.uid);
};

export const GET = async (request: NextRequest): Promise<NextResponse> => {
  const user = await authenticate(request);

  if (user === null || !user.active) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  const result = await getPaymentsPaginated(user.clinicId, {}, null);
  return NextResponse.json({ data: result.data, hasMore: result.hasMore });
};

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  const user = await authenticate(request);

  if (user === null || !user.active) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

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
