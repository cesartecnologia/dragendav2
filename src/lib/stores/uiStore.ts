import { create } from "zustand";

export type ToastType = "success" | "error" | "info";

export type ToastState = {
  id: string;
  type: ToastType;
  title: string;
  description: string;
};

export type UiStoreState = {
  sidebarOpen: boolean;
  activeModal: string | null;
  toasts: ToastState[];
  setSidebarOpen: (sidebarOpen: boolean) => void;
  setActiveModal: (activeModal: string | null) => void;
  pushToast: (toast: Omit<ToastState, "id">) => void;
  removeToast: (id: string) => void;
};

export const useUiStore = create<UiStoreState>((set) => ({
  sidebarOpen: false,
  activeModal: null,
  toasts: [],
  setSidebarOpen: (sidebarOpen: boolean): void => set({ sidebarOpen }),
  setActiveModal: (activeModal: string | null): void => set({ activeModal }),
  pushToast: (toast: Omit<ToastState, "id">): void =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          ...toast,
          id: crypto.randomUUID(),
        },
      ],
    })),
  removeToast: (id: string): void =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
}));

