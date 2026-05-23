"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPatient,
  getPatientsPaginated,
  searchPatients,
  softDeletePatient,
  updatePatient,
  type PatientCreateInput,
} from "../services/patientService";
import type { PaginatedResult, Patient, PatientFilters } from "../types";
import { invalidateQueriesInBackground } from "../utils/queryInvalidation";

export const patientsKey = (
  clinicId: string,
  filters: PatientFilters,
): readonly [string, string, PatientFilters] => ["patients", clinicId, filters];

export const usePatients = (
  clinicId: string,
  filters: PatientFilters,
  enabled = true,
) => {
  return useQuery<PaginatedResult<Patient>>({
    queryKey: patientsKey(clinicId, filters),
    queryFn: () => getPatientsPaginated(clinicId, filters, null),
    enabled: enabled && clinicId.length > 0,
    staleTime: 300_000,
  });
};

export const usePatientSearch = (clinicId: string, search: string) => {
  return useQuery<Patient[]>({
    queryKey: ["patients-search", clinicId, search],
    queryFn: () => searchPatients(clinicId, search),
    enabled: clinicId.length > 0 && search.length >= 2,
    staleTime: 300_000,
  });
};

export const useCreatePatient = (clinicId: string, filters: PatientFilters) => {
  const queryClient = useQueryClient();
  const key = patientsKey(clinicId, filters);

  return useMutation({
    mutationFn: (data: PatientCreateInput) => createPatient(clinicId, data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previousData = queryClient.getQueryData<PaginatedResult<Patient>>(key);
      const optimistic: Patient = {
        ...data,
        id: `temp-${crypto.randomUUID()}`,
        clinicId,
        createdAt: previousData?.data[0]?.createdAt ?? ({} as Patient["createdAt"]),
      };
      queryClient.setQueryData<PaginatedResult<Patient>>(key, {
        data: [optimistic, ...(previousData?.data ?? [])],
        lastDoc: previousData?.lastDoc ?? null,
        hasMore: previousData?.hasMore ?? false,
      });
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

export const useUpdatePatient = (clinicId: string, filters: PatientFilters) => {
  const queryClient = useQueryClient();
  const key = patientsKey(clinicId, filters);

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Patient> }) =>
      updatePatient(clinicId, id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previousData = queryClient.getQueryData<PaginatedResult<Patient>>(key);
      queryClient.setQueryData<PaginatedResult<Patient>>(key, (current) =>
        current === undefined
          ? current
          : {
              ...current,
              data: current.data.map((item) =>
                item.id === id ? { ...item, ...data } : item,
              ),
            },
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

export const useDeletePatient = (clinicId: string, filters: PatientFilters) => {
  const queryClient = useQueryClient();
  const key = patientsKey(clinicId, filters);

  return useMutation({
    mutationFn: (id: string) => softDeletePatient(clinicId, id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previousData = queryClient.getQueryData<PaginatedResult<Patient>>(key);
      queryClient.setQueryData<PaginatedResult<Patient>>(key, (current) =>
        current === undefined
          ? current
          : { ...current, data: current.data.filter((item) => item.id !== id) },
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
