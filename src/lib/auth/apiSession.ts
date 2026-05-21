import type { NextRequest } from "next/server";
import { getBearerToken, verifyFirebaseIdToken } from "../firebase/serverAuth";
import {
  getUserByFirebaseUid,
  type ClientUser,
} from "../services/authPostgresService";

export const getSessionUserFromRequest = async (
  request: NextRequest,
): Promise<ClientUser | null> => {
  const token = getBearerToken(request) ?? request.cookies.get("firebase-token")?.value ?? null;

  if (token === null || token.trim().length === 0) {
    return null;
  }

  const firebaseUser = await verifyFirebaseIdToken(token);
  return await getUserByFirebaseUid(firebaseUser.uid);
};
