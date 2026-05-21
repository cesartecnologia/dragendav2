import { NextResponse, type NextRequest } from "next/server";
import { getSessionUserFromRequest } from "../../../../lib/auth/apiSession";
import { getBillingAccess } from "../../../../lib/services/subscriptionService";

export const runtime = "nodejs";

export const GET = async (request: NextRequest): Promise<NextResponse> => {
  const user = await getSessionUserFromRequest(request);

  if (user === null || !user.active) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  const access = await getBillingAccess(user.clinicId, user.email);
  return NextResponse.json({ access });
};
