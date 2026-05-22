import type { NextRequest } from "next/server";

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

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

const getFirebaseAdminAuth = (): ReturnType<typeof getAuth> | null => {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountJson === undefined || serviceAccountJson.trim().length === 0) {
    return null;
  }

  if (getApps().length === 0) {
    const serviceAccount = JSON.parse(serviceAccountJson) as {
      project_id?: string;
      client_email?: string;
      private_key?: string;
    };

    initializeApp({
      credential: cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key?.replace(/\\n/g, "\n"),
      }),
    });
  }

  return getAuth();
};

const decodeTokenInDevelopment = (idToken: string): VerifiedFirebaseUser => {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Sessão inválida");
  }

  const [, encodedPayload] = idToken.split(".");

  if (encodedPayload === undefined) {
    throw new Error("Sessão inválida");
  }

  const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as {
    user_id?: string;
    sub?: string;
    email?: string;
    name?: string;
    exp?: number;
  };
  const expiresAt = payload.exp;

  if (expiresAt !== undefined && expiresAt * 1000 < Date.now()) {
    throw new Error("Sessão expirada");
  }

  const uid = payload.user_id ?? payload.sub ?? "";

  if (uid.length === 0 || payload.email === undefined || payload.email.length === 0) {
    throw new Error("Sessão inválida");
  }

  return {
    uid,
    email: payload.email,
    name: payload.name ?? "",
  };
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
  const adminAuth = getFirebaseAdminAuth();

  if (adminAuth !== null) {
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    return {
      uid: decodedToken.uid,
      email: decodedToken.email ?? "",
      name: typeof decodedToken.name === "string" ? decodedToken.name : "",
    };
  }

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
    return decodeTokenInDevelopment(idToken);
  }

  return {
    uid: firebaseUser.localId,
    email: firebaseUser.email ?? "",
    name: firebaseUser.displayName ?? "",
  };
};
