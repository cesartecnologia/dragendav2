"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSpecialty,
  getSpecialties,
  seedDefaultSpecialties,
  updateSpecialty,
  type SpecialtyCreateInput,
} from "../services/specialtyService";
import type { Specialty } from "../types";
import { invalidateQueriesInBackground } from "../utils/queryInvalidation";

export const useSpecialties = (clinicId: string) => {
  return useQuery<Specialty[]>({
    queryKey: ["specialties", clinicId],
    queryFn: async () => {
      await seedDefaultSpecialties(clinicId);
      return await getSpecialties(clinicId);
    },
    enabled: clinicId.length > 0,
    staleTime: 600_000,
  });
};

export const useCreateSpecialty = (clinicId: string) => {
  const queryClient = useQueryClient();
  const key = ["specialties", clinicId] as const;

  return useMutation({
    mutationFn: (data: SpecialtyCreateInput) => createSpecialty(clinicId, data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previousData = queryClient.getQueryData<Specialty[]>(key);
      const optimistic: Specialty = {
        ...data,
        id: `temp-${crypto.randomUUID()}`,
        clinicId,
        createdAt: previousData?.[0]?.createdAt ?? ({} as Specialty["createdAt"]),
      };
      queryClient.setQueryData<Specialty[]>(key, [
        ...(previousData ?? []),
        optimistic,
      ]);
      return { previousData };
    },
    onError: (_error, _data, context) => {
      queryClient.setQueryData(key, context?.previousData);
    },
    onSettled: () => {
      invalidateQueriesInBackground(queryClient, { queryKey: key });
    },
  });
};

export const useUpdateSpecialty = (clinicId: string) => {
  const queryClient = useQueryClient();
  const key = ["specialties", clinicId] as const;

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Specialty> }) =>
      updateSpecialty(clinicId, id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previousData = queryClient.getQueryData<Specialty[]>(key);
      queryClient.setQueryData<Specialty[]>(key, (current) =>
        current?.map((item) => (item.id === id ? { ...item, ...data } : item)) ??
        current,
      );
      return { previousData };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(key, context?.previousData);
    },
    onSettled: () => {
      invalidateQueriesInBackground(queryClient, { queryKey: key });
    },
  });
};
