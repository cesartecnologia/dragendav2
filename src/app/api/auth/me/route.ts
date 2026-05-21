import { NextResponse, type NextRequest } from "next/server";
import { getBearerToken, verifyFirebaseIdToken } from "../../../../lib/firebase/serverAuth";
import { getUserByFirebaseUid } from "../../../../lib/services/authPostgresService";

export const runtime = "nodejs";

export const GET = async (request: NextRequest): Promise<NextResponse> => {
  try {
    const token = getBearerToken(request);

    if (token === null) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const firebaseUser = await verifyFirebaseIdToken(token);
    const user = await getUserByFirebaseUid(firebaseUser.uid);

    if (user === null || !user.active) {
      return NextResponse.json(
        { message: "Usuário não encontrado ou inativo" },
        { status: 404 },
      );
    }

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json(
      { message: "Não foi possível carregar usuário" },
      { status: 401 },
    );
  }
};
