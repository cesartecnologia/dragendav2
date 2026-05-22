import type { User as FirebaseUser } from "firebase/auth";
import type { Clinic, User } from "../types";

export type AuthMeResponse = {
  user: Omit<User, "createdAt"> & {
    createdAt: string;
  };
};

export type BootstrapClinicPayload = {
  clinicId: string;
  ownerName: string;
  ownerEmail: string;
  clinicName: string;
  cnpj: string;
  phone: string;
  city: string;
  state: string;
  checkoutSessionId?: string;
};

export type BootstrapMasterPayload = {
  clinicId: string;
  ownerName: string;
  ownerEmail: string;
  clinicName: string;
  accessCode?: string;
};

export type SyncFirebaseUserPayload = {
  clinicId: string;
  role: User["role"];
  name: string;
  email: string;
  active: boolean;
  clinic: Omit<Clinic, "id" | "createdAt">;
};

const requestWithFirebaseToken = async <TResponse>(
  firebaseUser: FirebaseUser,
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<TResponse> => {
  const token = await firebaseUser.getIdToken();
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const payload = (await response.json().catch(
      (): { message: string } => ({ message: "Erro ao carregar dados" }),
    )) as Partial<{ message: string }>;
    throw new Error(payload.message ?? "Erro ao carregar dados");
  }

  return (await response.json()) as TResponse;
};

export const getCurrentPostgresUser = async (
  firebaseUser: FirebaseUser,
): Promise<User> => {
  const payload = await requestWithFirebaseToken<AuthMeResponse>(
    firebaseUser,
    "/api/auth/me",
  );

  return payload.user as User;
};

export const bootstrapPostgresClinic = async (
  firebaseUser: FirebaseUser,
  payload: BootstrapClinicPayload,
): Promise<User> => {
  const response = await requestWithFirebaseToken<AuthMeResponse>(
    firebaseUser,
    "/api/auth/bootstrap",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  return response.user as User;
};

export const bootstrapMasterAccess = async (
  firebaseUser: FirebaseUser,
  payload: BootstrapMasterPayload,
): Promise<User> => {
  const response = await requestWithFirebaseToken<AuthMeResponse>(
    firebaseUser,
    "/api/master/bootstrap",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  return response.user as User;
};

export const syncFirebaseUserWithPostgres = async (
  firebaseUser: FirebaseUser,
  payload: SyncFirebaseUserPayload,
): Promise<User> => {
  const response = await requestWithFirebaseToken<AuthMeResponse>(
    firebaseUser,
    "/api/auth/sync",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  return response.user as User;
};
