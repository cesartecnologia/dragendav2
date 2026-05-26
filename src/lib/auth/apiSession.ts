import type { NextRequest } from "next/server";
import { getBearerToken, verifyFirebaseIdToken } from "../firebase/serverAuth";
import {
  getUserByFirebaseUid,
  type ClientUser,
} from "../services/authPostgresService";
import { getBillingAccess, type BillingAccess } from "../services/subscriptionService";

export type AuthorizedSession = {
  user: ClientUser;
  access: BillingAccess;
};

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

export const getAuthorizedSessionFromRequest = async (
  request: NextRequest,
): Promise<AuthorizedSession | null> => {
  const user = await getSessionUserFromRequest(request);

  if (user === null || !user.active) {
    return null;
  }

  const access = await getBillingAccess(user.clinicId, user.email);

  if (!access.allowed) {
    return null;
  }

  return { user, access };
};
