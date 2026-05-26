import { NextResponse, type NextRequest } from "next/server";
import { getAuthorizedSessionFromRequest } from "../../../../lib/auth/apiSession";
import { testConnection } from "../../../../lib/serverServices/whatsappService";

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  const session = await getAuthorizedSessionFromRequest(request);

  if (session === null) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  const { user } = session;
  const result = await testConnection(user.clinicId);
  return NextResponse.json(result);
};
