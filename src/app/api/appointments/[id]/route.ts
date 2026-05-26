import { NextResponse, type NextRequest } from "next/server";
import { deleteAppointment, updateAppointment } from "../../../../lib/serverServices/appointmentService";
import { appointmentUpdateSchema } from "../../../../lib/validations/appointment";
import { getAuthorizedSessionFromRequest } from "../../../../lib/auth/apiSession";

export type AppointmentRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const PATCH = async (request: NextRequest, context: AppointmentRouteContext): Promise<NextResponse> => {
  const session = await getAuthorizedSessionFromRequest(request);

  if (session === null) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  const { user } = session;
  const parsed = appointmentUpdateSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ message: "Dados inválidos" }, { status: 400 });
  }

  const params = await context.params;
  await updateAppointment(user.clinicId, params.id, parsed.data);
  return NextResponse.json({ success: true });
};

export const DELETE = async (request: NextRequest, context: AppointmentRouteContext): Promise<NextResponse> => {
  const session = await getAuthorizedSessionFromRequest(request);

  if (session === null) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  const { user } = session;
  const params = await context.params;
  await deleteAppointment(user.clinicId, params.id);
  return NextResponse.json({ success: true });
};
