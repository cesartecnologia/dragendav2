import { NextResponse, type NextRequest } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { firestoreDb } from "../../../lib/firebase/config";
import { appointmentCreateSchema } from "../../../lib/validations/appointment";
import { createAppointment, getAppointmentsPaginated } from "../../../lib/services/appointmentService";

const getClinicId = (request: NextRequest): string | null => {
  return request.headers.get("x-clinic-id");
};

const isAuthenticated = (request: NextRequest): boolean => {
  return (request.headers.get("authorization") ?? "").startsWith("Bearer ");
};

const getUserName = async (request: NextRequest): Promise<string> => {
  const userId = request.headers.get("x-user-id") ?? "";

  if (userId.trim().length === 0) {
    return "";
  }

  const snapshot = await getDoc(doc(firestoreDb, "users", userId));
  const data = snapshot.exists() ? snapshot.data() : null;
  const name = typeof data?.name === "string" ? data.name.trim() : "";

  return name.length > 0 ? name : "";
};

export const GET = async (request: NextRequest): Promise<NextResponse> => {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  const clinicId = getClinicId(request);

  if (clinicId === null) {
    return NextResponse.json({ message: "Clínica não identificada" }, { status: 400 });
  }

  const result = await getAppointmentsPaginated(clinicId, {}, null);
  return NextResponse.json({ data: result.data, hasMore: result.hasMore });
};

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  const clinicId = getClinicId(request);

  if (clinicId === null) {
    return NextResponse.json({ message: "Clínica não identificada" }, { status: 400 });
  }

  const body = (await request.json()) as unknown;
  const parsed = appointmentCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Dados inválidos" }, { status: 400 });
  }

  const appointment = await createAppointment(clinicId, {
    ...parsed.data,
    status: "scheduled",
    paymentStatus: "pending",
    whatsappSent: false,
    createdBy: await getUserName(request),
  });

  return NextResponse.json(appointment, { status: 201 });
};
