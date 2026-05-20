"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getClinicById, updateClinic, type ClinicUpdateInput } from "../services/clinicService";
import type { Clinic } from "../types";

export const useClinic = (clinicId: string) => {
  return useQuery<Clinic | null>({
    queryKey: ["clinic", clinicId],
    queryFn: () => getClinicById(clinicId),
    enabled: clinicId.length > 0,
    staleTime: 300_000,
  });
};

export const useUpdateClinic = (clinicId: string) => {
  const queryClient = useQueryClient();
  const key = ["clinic", clinicId] as const;

  return useMutation({
    mutationFn: (data: Partial<ClinicUpdateInput>) => updateClinic(clinicId, data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previousData = queryClient.getQueryData<Clinic | null>(key);
      queryClient.setQueryData<Clinic | null>(key, (current) =>
        current === null || current === undefined ? current : { ...current, ...data },
      );
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

