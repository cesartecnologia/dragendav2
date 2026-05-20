import { create } from "zustand";
import type { Clinic } from "../types";

export type ClinicStoreState = {
  clinic: Clinic | null;
  clinicId: string | null;
  isLoading: boolean;
  error: string | null;
  setClinic: (clinic: Clinic | null) => void;
  setClinicId: (clinicId: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
};

export const useClinicStore = create<ClinicStoreState>((set) => ({
  clinic: null,
  clinicId: null,
  isLoading: false,
  error: null,
  setClinic: (clinic: Clinic | null): void =>
    set({ clinic, clinicId: clinic?.id ?? null }),
  setClinicId: (clinicId: string | null): void => set({ clinicId }),
  setLoading: (isLoading: boolean): void => set({ isLoading }),
  setError: (error: string | null): void => set({ error }),
  reset: (): void =>
    set({
      clinic: null,
      clinicId: null,
      isLoading: false,
      error: null,
    }),
}));

