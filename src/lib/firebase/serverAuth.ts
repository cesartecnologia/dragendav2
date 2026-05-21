import type { NextRequest } from "next/server";

export type VerifiedFirebaseUser = {
  uid: string;
  email: string;
  name: string;
};

type FirebaseLookupResponse = {
  users?: Array<{
    localId?: string;
    email?: string;
    displayName?: string;
  }>;
  error?: {
    message?: string;
  };
};

const getFirebaseApiKey = (): string => {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (apiKey === undefined || apiKey.trim().length === 0) {
    throw new Error("NEXT_PUBLIC_FIREBASE_API_KEY não configurada");
  }

  return apiKey;
};

export const getBearerToken = (request: NextRequest): string | null => {
  const authorization = request.headers.get("authorization") ?? "";

  if (!authorization.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
};

export const verifyFirebaseIdToken = async (
  idToken: string,
): Promise<VerifiedFirebaseUser> => {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${getFirebaseApiKey()}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken }),
      cache: "no-store",
    },
  );
  const payload = (await response.json()) as FirebaseLookupResponse;
  const firebaseUser = payload.users?.[0];

  if (!response.ok || firebaseUser?.localId === undefined) {
    throw new Error("Sessão inválida");
  }

  return {
    uid: firebaseUser.localId,
    email: firebaseUser.email ?? "",
    name: firebaseUser.displayName ?? "",
  };
};
