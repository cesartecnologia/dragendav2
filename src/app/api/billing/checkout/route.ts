import { NextResponse, type NextRequest } from "next/server";
import { getSessionUserFromRequest } from "../../../../lib/auth/apiSession";
import { createClinicHostedCheckout } from "../../../../lib/services/subscriptionService";

export const runtime = "nodejs";

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  const user = await getSessionUserFromRequest(request);

  if (user === null || !user.active) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  const subscription = await createClinicHostedCheckout({
    clinicId: user.clinicId,
    plan: "starter",
    amount: 9990,
    callbackBaseUrl: request.nextUrl.origin,
  });

  return NextResponse.json({ subscription });
};
