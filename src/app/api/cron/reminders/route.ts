import { NextResponse, type NextRequest } from "next/server";

const isAuthorized = (request: NextRequest): boolean => {
  return request.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET ?? ""}`;
};

export const GET = async (request: NextRequest): Promise<NextResponse> => {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  return NextResponse.json({ success: true, message: "Lembretes processados" });
};

