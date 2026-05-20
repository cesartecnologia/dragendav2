import { NextResponse, type NextRequest } from "next/server";
import { updatePayment } from "../../../../lib/services/financialService";
import { paymentUpdateSchema } from "../../../../lib/validations/payment";

export type PaymentRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const getClinicId = (request: NextRequest): string | null => request.headers.get("x-clinic-id");
const isAuthenticated = (request: NextRequest): boolean => (request.headers.get("authorization") ?? "").startsWith("Bearer ");

export const PATCH = async (request: NextRequest, context: PaymentRouteContext): Promise<NextResponse> => {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  const clinicId = getClinicId(request);

  if (clinicId === null) {
    return NextResponse.json({ message: "Clínica não identificada" }, { status: 400 });
  }

  const parsed = paymentUpdateSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ message: "Dados inválidos" }, { status: 400 });
  }

  const params = await context.params;
  await updatePayment(clinicId, params.id, parsed.data);
  return NextResponse.json({ success: true });
};
