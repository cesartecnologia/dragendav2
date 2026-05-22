import {
  deleteApp,
  initializeApp,
  type FirebaseApp,
} from "firebase/app";
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
  type Unsubscribe,
} from "firebase/auth";
import {
  assertFirebaseClientConfigured,
  firebaseAuth,
  firebaseClientConfig,
  isFirebaseClientConfigured,
} from "./config";

export type AuthCredentials = {
  email: string;
  password: string;
};

export type RegisterCredentials = AuthCredentials & {
  name: string;
};

export type AuthErrorCode =
  | "auth/wrong-password"
  | "auth/user-not-found"
  | "auth/too-many-requests"
  | "auth/invalid-credential"
  | "auth/email-already-in-use"
  | "auth/weak-password"
  | "auth/invalid-email"
  | "firebase/missing-config"
  | "unknown";

export type AuthResult = {
  user: FirebaseUser;
};

const authCookieName = "firebase-token";

const setAuthCookie = async (user: FirebaseUser): Promise<void> => {
  const token = await user.getIdToken();
  document.cookie = `${authCookieName}=${token}; path=/; max-age=604800; SameSite=Lax`;
};

const clearAuthCookie = (): void => {
  document.cookie = `${authCookieName}=; path=/; max-age=0; SameSite=Lax`;
};

export const authErrorMessages: Record<AuthErrorCode, string> = {
  "auth/wrong-password": "Senha incorreta",
  "auth/user-not-found": "Usuário não encontrado",
  "auth/too-many-requests": "Muitas tentativas. Tente mais tarde",
  "auth/invalid-credential": "Email ou senha inválidos",
  "auth/email-already-in-use": "Este email já está em uso",
  "auth/weak-password": "A senha deve ter pelo menos 6 caracteres",
  "auth/invalid-email": "Email inválido",
  "firebase/missing-config": "Configuração do Firebase ausente no .env.local",
  unknown: "Não foi possível autenticar. Tente novamente",
};

export const getAuthErrorCode = (error: unknown): AuthErrorCode => {
  if (
    error instanceof Error &&
    error.message.startsWith("Configuração do Firebase ausente:")
  ) {
    return "firebase/missing-config";
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string" &&
    error.code in authErrorMessages
  ) {
    return error.code as AuthErrorCode;
  }

  return "unknown";
};

export const getAuthErrorMessage = (error: unknown): string => {
  return authErrorMessages[getAuthErrorCode(error)];
};

export const loginWithEmail = async (
  credentials: AuthCredentials,
): Promise<AuthResult> => {
  assertFirebaseClientConfigured();
  await setPersistence(firebaseAuth, browserLocalPersistence);
  const credential = await signInWithEmailAndPassword(
    firebaseAuth,
    credentials.email,
    credentials.password,
  );
  await setAuthCookie(credential.user);

  return { user: credential.user };
};

export const registerWithEmail = async (
  credentials: RegisterCredentials,
): Promise<AuthResult> => {
  assertFirebaseClientConfigured();
  await setPersistence(firebaseAuth, browserLocalPersistence);
  const credential = await createUserWithEmailAndPassword(
    firebaseAuth,
    credentials.email,
    credentials.password,
  );
  await setAuthCookie(credential.user);

  return { user: credential.user };
};

export const createSecondaryAuthUser = async (
  credentials: AuthCredentials,
): Promise<AuthResult> => {
  assertFirebaseClientConfigured();
  const appName = `employee-${crypto.randomUUID()}`;
  const secondaryApp: FirebaseApp = initializeApp(firebaseClientConfig, appName);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const credential = await createUserWithEmailAndPassword(
      secondaryAuth,
      credentials.email,
      credentials.password,
    );

    return { user: credential.user };
  } finally {
    await signOut(secondaryAuth).catch(() => undefined);
    await deleteApp(secondaryApp).catch(() => undefined);
  }
};

export const sendResetPasswordEmail = async (email: string): Promise<void> => {
  assertFirebaseClientConfigured();
  await sendPasswordResetEmail(firebaseAuth, email);
};

export const logout = async (): Promise<void> => {
  clearAuthCookie();
  if (!isFirebaseClientConfigured()) {
    return;
  }

  await signOut(firebaseAuth);
};

export const listenAuthState = (
  callback: (user: FirebaseUser | null) => void,
): Unsubscribe => {
  if (!isFirebaseClientConfigured()) {
    callback(null);
    return () => undefined;
  }

  return onAuthStateChanged(firebaseAuth, (user) => {
    if (user === null) {
      callback(null);
      return;
    }

    void setAuthCookie(user);
    callback(user);
  });
};
