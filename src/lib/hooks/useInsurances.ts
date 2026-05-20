"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createInsurance,
  getInsurances,
  updateInsurance,
  type InsuranceCreateInput,
} from "../services/insuranceService";
import type { Insurance } from "../types";

export const useInsurances = (clinicId: string) => {
  return useQuery<Insurance[]>({
    queryKey: ["insurances", clinicId],
    queryFn: () => getInsurances(clinicId),
    enabled: clinicId.length > 0,
    staleTime: 600_000,
  });
};

export const useCreateInsurance = (clinicId: string) => {
  const queryClient = useQueryClient();
  const key = ["insurances", clinicId] as const;

  return useMutation({
    mutationFn: (data: InsuranceCreateInput) => createInsurance(clinicId, data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previousData = queryClient.getQueryData<Insurance[]>(key);
      const optimistic: Insurance = {
        ...data,
        id: `temp-${crypto.randomUUID()}`,
        clinicId,
        createdAt: previousData?.[0]?.createdAt ?? ({} as Insurance["createdAt"]),
      };
      queryClient.setQueryData<Insurance[]>(key, [optimistic, ...(previousData ?? [])]);
      return { previousData };
    },
    onError: (_error, _data, context) => {
      queryClient.setQueryData(key, context?.previousData);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    },
  });
};

export const useUpdateInsurance = (clinicId: string) => {
  const queryClient = useQueryClient();
  const key = ["insurances", clinicId] as const;

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Insurance> }) =>
      updateInsurance(clinicId, id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previousData = queryClient.getQueryData<Insurance[]>(key);
      queryClient.setQueryData<Insurance[]>(key, (current) =>
        current?.map((item) => (item.id === id ? { ...item, ...data } : item)) ??
        current,
      );
      return { previousData };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(key, context?.previousData);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    },
  });
};

