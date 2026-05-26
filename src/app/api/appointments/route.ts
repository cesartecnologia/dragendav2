import { NextResponse, type NextRequest } from "next/server";
import { appointmentCreateSchema } from "../../../lib/validations/appointment";
import { createAppointment, getAppointmentsPaginated } from "../../../lib/serverServices/appointmentService";
import { getAuthorizedSessionFromRequest } from "../../../lib/auth/apiSession";

export const GET = async (request: NextRequest): Promise<NextResponse> => {
  const session = await getAuthorizedSessionFromRequest(request);

  if (session === null) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  const { user } = session;
  const result = await getAppointmentsPaginated(user.clinicId, {}, null);
  return NextResponse.json({ data: result.data, hasMore: result.hasMore });
};

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  const session = await getAuthorizedSessionFromRequest(request);

  if (session === null) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  const { user } = session;
  const body = (await request.json()) as unknown;
  const parsed = appointmentCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Dados inválidos" }, { status: 400 });
  }

  const appointment = await createAppointment(user.clinicId, {
    ...parsed.data,
    status: "scheduled",
    paymentStatus: "pending",
    whatsappSent: false,
    createdBy: user.name,
  });

  return NextResponse.json(appointment, { status: 201 });
};
