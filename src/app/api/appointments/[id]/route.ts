import { NextResponse, type NextRequest } from "next/server";
import { deleteAppointment, updateAppointment } from "../../../../lib/serverServices/appointmentService";
import { appointmentUpdateSchema } from "../../../../lib/validations/appointment";
import { verifyFirebaseIdToken } from "../../../../lib/firebase/serverAuth";
import { getUserByFirebaseUid, type ClientUser } from "../../../../lib/services/authPostgresService";

export type AppointmentRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const authenticate = async (request: NextRequest): Promise<ClientUser | null> => {
  const authorization = request.headers.get("authorization") ?? "";

  if (!authorization.startsWith("Bearer ")) {
    return null;
  }

  const firebaseUser = await verifyFirebaseIdToken(authorization.slice("Bearer ".length).trim());
  return await getUserByFirebaseUid(firebaseUser.uid);
};

export const PATCH = async (request: NextRequest, context: AppointmentRouteContext): Promise<NextResponse> => {
  const user = await authenticate(request);

  if (user === null || !user.active) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  const parsed = appointmentUpdateSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ message: "Dados inválidos" }, { status: 400 });
  }

  const params = await context.params;
  await updateAppointment(user.clinicId, params.id, parsed.data);
  return NextResponse.json({ success: true });
};

export const DELETE = async (request: NextRequest, context: AppointmentRouteContext): Promise<NextResponse> => {
  const user = await authenticate(request);

  if (user === null || !user.active) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  const params = await context.params;
  await deleteAppointment(user.clinicId, params.id);
  return NextResponse.json({ success: true });
};
