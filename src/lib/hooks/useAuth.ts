"use client";

import { useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import {
  getCurrentPostgresUser,
  syncFirebaseUserWithPostgres,
} from "../auth/sessionClient";
import { listenAuthState } from "../firebase/auth";
import { firestoreDb } from "../firebase/config";
import { useAuthStore, type AuthStoreState } from "../stores/authStore";
import type { Clinic, User } from "../types";

let authListenerSubscribers = 0;
let authUnsubscribe: (() => void) | null = null;

export const useAuth = (): AuthStoreState => {
  const store = useAuthStore();

  useEffect(() => {
    authListenerSubscribers += 1;

    if (authUnsubscribe !== null) {
      return () => {
        authListenerSubscribers -= 1;

        if (authListenerSubscribers === 0) {
          authUnsubscribe?.();
          authUnsubscribe = null;
        }
      };
    }

    authUnsubscribe = listenAuthState((firebaseUser) => {
      store.setFirebaseUser(firebaseUser);

      if (firebaseUser === null) {
        store.setUser(null);
        store.setLoading(false);
        return;
      }

      store.setLoading(true);

      void getCurrentPostgresUser(firebaseUser)
        .catch(async (): Promise<User | null> => {
          const snapshot = await getDoc(doc(firestoreDb, "users", firebaseUser.uid));
          const firestoreUser = snapshot.exists()
            ? ({ ...snapshot.data(), id: snapshot.id } as User)
            : null;

          if (firestoreUser === null) {
            return null;
          }

          const clinicSnapshot = await getDoc(
            doc(firestoreDb, "clinics", firestoreUser.clinicId),
          );
          const clinic = clinicSnapshot.exists()
            ? ({ ...clinicSnapshot.data(), id: clinicSnapshot.id } as Clinic)
            : null;

          if (clinic === null) {
            return firestoreUser;
          }

          return await syncFirebaseUserWithPostgres(firebaseUser, {
            clinicId: firestoreUser.clinicId,
            role: firestoreUser.role,
            name: firestoreUser.name,
            email: firestoreUser.email,
            active: firestoreUser.active,
            clinic: {
              name: clinic.name,
              cnpj: clinic.cnpj,
              phone: clinic.phone,
              email: clinic.email,
              address: clinic.address,
              logoUrl: clinic.logoUrl,
              logoPublicId: clinic.logoPublicId,
              primaryColor: clinic.primaryColor,
              whatsappToken: clinic.whatsappToken,
              whatsappPhone: clinic.whatsappPhone,
              whatsappApiUrl: clinic.whatsappApiUrl,
              plan: clinic.plan,
              active: clinic.active,
            },
          });
        })
        .then((user) => {
          store.setUser(user);
          store.setError(null);
          store.setLoading(false);
        })
        .catch((error: unknown) => {
          store.setError(
            error instanceof Error ? error.message : "Erro ao carregar usuário",
          );
          store.setLoading(false);
        });
    });

    return () => {
      authListenerSubscribers -= 1;

      if (authListenerSubscribers === 0) {
        authUnsubscribe?.();
        authUnsubscribe = null;
      }
    };
  }, []);

  return store;
};
