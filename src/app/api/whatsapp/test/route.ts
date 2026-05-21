import { NextResponse, type NextRequest } from "next/server";
import { getSessionUserFromRequest } from "../../../../lib/auth/apiSession";
import { testConnection } from "../../../../lib/serverServices/whatsappService";

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  const user = await getSessionUserFromRequest(request);

  if (user === null || !user.active) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  const result = await testConnection(user.clinicId);
  return NextResponse.json(result);
};
