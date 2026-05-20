import { create } from "zustand";
import type { User as FirebaseUser } from "firebase/auth";
import type { User } from "../types";

export type AuthStoreState = {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  setFirebaseUser: (firebaseUser: FirebaseUser | null) => void;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
};

export const useAuthStore = create<AuthStoreState>((set) => ({
  firebaseUser: null,
  user: null,
  isLoading: true,
  error: null,
  setFirebaseUser: (firebaseUser: FirebaseUser | null): void =>
    set({ firebaseUser }),
  setUser: (user: User | null): void => set({ user }),
  setLoading: (isLoading: boolean): void => set({ isLoading }),
  setError: (error: string | null): void => set({ error }),
  reset: (): void =>
    set({
      firebaseUser: null,
      user: null,
      isLoading: false,
      error: null,
    }),
}));

