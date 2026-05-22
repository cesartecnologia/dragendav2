import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

export type FirebaseClientConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  messagingSenderId: string;
  appId: string;
};

const requiredEnv = (_key: string, value: string | undefined): string => value?.trim() ?? "";

export const firebaseClientConfig: FirebaseClientConfig = {
  apiKey: requiredEnv(
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  ),
  authDomain: requiredEnv(
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  ),
  projectId: requiredEnv(
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  ),
  messagingSenderId: requiredEnv(
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  ),
  appId: requiredEnv(
    "NEXT_PUBLIC_FIREBASE_APP_ID",
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  ),
};

export const missingFirebaseClientEnv = (): string[] =>
  [
    ["NEXT_PUBLIC_FIREBASE_API_KEY", firebaseClientConfig.apiKey],
    ["NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", firebaseClientConfig.authDomain],
    ["NEXT_PUBLIC_FIREBASE_PROJECT_ID", firebaseClientConfig.projectId],
    ["NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", firebaseClientConfig.messagingSenderId],
    ["NEXT_PUBLIC_FIREBASE_APP_ID", firebaseClientConfig.appId],
  ]
    .filter(([, value]) => value.trim().length === 0)
    .map(([key]) => key);

export const isFirebaseClientConfigured = (): boolean =>
  missingFirebaseClientEnv().length === 0;

export const assertFirebaseClientConfigured = (): void => {
  const missing = missingFirebaseClientEnv();

  if (missing.length > 0) {
    throw new Error(`Configuração do Firebase ausente: ${missing.join(", ")}`);
  }
};

export const firebaseApp: FirebaseApp =
  isFirebaseClientConfigured()
    ? getApps().length > 0
      ? getApp()
      : initializeApp(firebaseClientConfig)
    : ({} as FirebaseApp);

export const firebaseAuth: Auth =
  typeof window === "undefined" || !isFirebaseClientConfigured()
    ? ({} as Auth)
    : getAuth(firebaseApp);

export const firestoreDb: Firestore = isFirebaseClientConfigured()
  ? getFirestore(firebaseApp)
  : ({} as Firestore);
