import { NextResponse, type NextRequest } from "next/server";
import { testConnection } from "../../../../lib/services/whatsappService";

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  if (!(request.headers.get("authorization") ?? "").startsWith("Bearer ")) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  const clinicId = request.headers.get("x-clinic-id");

  if (clinicId === null) {
    return NextResponse.json({ message: "Clínica não identificada" }, { status: 400 });
  }

  const result = await testConnection(clinicId);
  return NextResponse.json(result);
};

