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
