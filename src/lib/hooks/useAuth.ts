"use client";

import { useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { listenAuthState } from "../firebase/auth";
import { firestoreDb } from "../firebase/config";
import { useAuthStore, type AuthStoreState } from "../stores/authStore";
import type { User } from "../types";

let authListenerStarted = false;

export const useAuth = (): AuthStoreState => {
  const store = useAuthStore();

  useEffect(() => {
    if (authListenerStarted) {
      return;
    }

    authListenerStarted = true;

    const unsubscribe = listenAuthState((firebaseUser) => {
      store.setFirebaseUser(firebaseUser);
      store.setLoading(false);

      if (firebaseUser === null) {
        store.setUser(null);
        return;
      }

      void getDoc(doc(firestoreDb, "users", firebaseUser.uid))
        .then((snapshot) => {
          store.setUser(
            snapshot.exists()
              ? ({ ...snapshot.data(), id: snapshot.id } as User)
              : null,
          );
          store.setError(null);
        })
        .catch((error: unknown) => {
          store.setError(
            error instanceof Error ? error.message : "Erro ao carregar usuário",
          );
        });
    });

    return () => {
      unsubscribe();
      authListenerStarted = false;
    };
  }, []);

  return store;
};
