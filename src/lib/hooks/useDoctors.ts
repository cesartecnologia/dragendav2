"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDoctor,
  getDoctorById,
  getDoctors,
  regenerateSchedules,
  softDeleteDoctor,
  updateDoctor,
  type DoctorCreateInput,
} from "../services/doctorService";
import type { Doctor, DoctorFilters } from "../types";
import {
  invalidateManyInBackground,
  invalidateQueriesInBackground,
} from "../utils/queryInvalidation";

export const doctorsKey = (
  clinicId: string,
  filters: DoctorFilters,
): readonly [string, string, DoctorFilters] => ["doctors", clinicId, filters];

export const useDoctors = (
  clinicId: string,
  filters: DoctorFilters = {},
  enabled = true,
) => {
  return useQuery<Doctor[]>({
    queryKey: doctorsKey(clinicId, filters),
    queryFn: () => getDoctors(clinicId, filters),
    enabled: enabled && clinicId.length > 0,
    staleTime: 600_000,
  });
};

export const useDoctor = (clinicId: string, doctorId: string) => {
  return useQuery<Doctor | null>({
    queryKey: ["doctor", clinicId, doctorId],
    queryFn: () => getDoctorById(clinicId, doctorId),
    enabled: clinicId.length > 0 && doctorId.length > 0,
    staleTime: 600_000,
  });
};

export const useCreateDoctor = (clinicId: string, filters: DoctorFilters = {}) => {
  const queryClient = useQueryClient();
  const key = doctorsKey(clinicId, filters);

  return useMutation({
    mutationFn: (data: DoctorCreateInput) => createDoctor(clinicId, data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previousData = queryClient.getQueryData<Doctor[]>(key);
      const optimistic: Doctor = {
        ...data,
        id: `temp-${crypto.randomUUID()}`,
        clinicId,
        createdAt: previousData?.[0]?.createdAt ?? ({} as Doctor["createdAt"]),
      };
      queryClient.setQueryData<Doctor[]>(key, [optimistic, ...(previousData ?? [])]);
      return { previousData };
    },
    onError: (_error, _data, context) => {
      queryClient.setQueryData(key, context?.previousData);
    },
    onSettled: () => {
      invalidateManyInBackground(queryClient, [
        { queryKey: key },
        { queryKey: ["available-slots"] },
      ]);
    },
  });
};

export const useUpdateDoctor = (clinicId: string, filters: DoctorFilters = {}) => {
  const queryClient = useQueryClient();
  const key = doctorsKey(clinicId, filters);

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Doctor> }) =>
      updateDoctor(clinicId, id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previousData = queryClient.getQueryData<Doctor[]>(key);
      queryClient.setQueryData<Doctor[]>(key, (current) =>
        current?.map((item) => (item.id === id ? { ...item, ...data } : item)) ??
        current,
      );
      return { previousData };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(key, context?.previousData);
    },
    onSettled: (_data, _error, variables) => {
      invalidateManyInBackground(queryClient, [
        { queryKey: key },
        { queryKey: ["doctor", clinicId, variables.id] },
        { queryKey: ["available-slots"] },
        { queryKey: ["appointments"] },
      ]);
    },
  });
};

export const useRegenerateSchedules = (clinicId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (doctorId: string) => regenerateSchedules(clinicId, doctorId, 60),
    onSettled: () => {
      invalidateQueriesInBackground(queryClient, {
        queryKey: ["schedules", clinicId],
      });
    },
  });
};

export const useDeleteDoctor = (clinicId: string, filters: DoctorFilters = {}) => {
  const queryClient = useQueryClient();
  const key = doctorsKey(clinicId, filters);

  return useMutation({
    mutationFn: (id: string) => softDeleteDoctor(clinicId, id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previousData = queryClient.getQueryData<Doctor[]>(key);
      queryClient.setQueryData<Doctor[]>(key, (current) =>
        current?.filter((item) => item.id !== id) ?? current,
      );
      return { previousData };
    },
    onError: (_error, _id, context) => {
      queryClient.setQueryData(key, context?.previousData);
    },
    onSettled: () => {
      invalidateQueriesInBackground(queryClient, { queryKey: key });
    },
  });
};
