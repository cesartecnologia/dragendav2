"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createEmployee,
  getEmployees,
  updateEmployee,
  type EmployeeCreateInput,
} from "../services/employeeService";
import type { Employee } from "../types";
import { invalidateQueriesInBackground } from "../utils/queryInvalidation";

export const useEmployees = (clinicId: string) => {
  return useQuery<Employee[]>({
    queryKey: ["employees", clinicId],
    queryFn: () => getEmployees(clinicId),
    enabled: clinicId.length > 0,
    staleTime: 300_000,
  });
};

export const useCreateEmployee = (clinicId: string) => {
  const queryClient = useQueryClient();
  const key = ["employees", clinicId] as const;

  return useMutation({
    mutationFn: (data: EmployeeCreateInput) => createEmployee(clinicId, data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previousData = queryClient.getQueryData<Employee[]>(key);
      const optimistic: Employee = {
        ...data,
        id: `temp-${crypto.randomUUID()}`,
        clinicId,
        createdAt: previousData?.[0]?.createdAt ?? ({} as Employee["createdAt"]),
      };
      queryClient.setQueryData<Employee[]>(key, [optimistic, ...(previousData ?? [])]);
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

export const useUpdateEmployee = (clinicId: string) => {
  const queryClient = useQueryClient();
  const key = ["employees", clinicId] as const;

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Employee> }) =>
      updateEmployee(clinicId, id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previousData = queryClient.getQueryData<Employee[]>(key);
      queryClient.setQueryData<Employee[]>(key, (current) =>
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
