"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createExamType,
  deleteExamType,
  getExamTypes,
  seedDefaultExamTypes,
  updateExamType,
  type ExamTypeCreateInput,
} from "../services/examTypeService";
import type { ExamType } from "../types";

export const useExamTypes = (
  clinicId: string,
  activeOnly = true,
  seedDefaults = false,
  enabled = true,
) => {
  return useQuery<ExamType[]>({
    queryKey: ["exam-types", clinicId, activeOnly],
    queryFn: async () => {
      if (seedDefaults) {
        await seedDefaultExamTypes(clinicId);
      }

      return await getExamTypes(clinicId, activeOnly);
    },
    enabled: enabled && clinicId.length > 0,
    staleTime: 600_000,
  });
};

export const useCreateExamType = (clinicId: string) => {
  const queryClient = useQueryClient();
  const activeKey = ["exam-types", clinicId, true] as const;
  const allKey = ["exam-types", clinicId, false] as const;

  return useMutation({
    mutationFn: (data: ExamTypeCreateInput) => createExamType(clinicId, data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ["exam-types", clinicId] });
      const previousActiveData = queryClient.getQueryData<ExamType[]>(activeKey);
      const previousAllData = queryClient.getQueryData<ExamType[]>(allKey);
      const optimistic: ExamType = {
        ...data,
        id: `temp-${crypto.randomUUID()}`,
        clinicId,
        createdAt: previousAllData?.[0]?.createdAt ?? ({} as ExamType["createdAt"]),
      };
      queryClient.setQueryData<ExamType[]>(allKey, [
        ...(previousAllData ?? []),
        optimistic,
      ]);
      queryClient.setQueryData<ExamType[]>(activeKey, [
        ...(previousActiveData ?? []),
        optimistic,
      ]);
      return { previousActiveData, previousAllData };
    },
    onError: (_error, _data, context) => {
      queryClient.setQueryData(activeKey, context?.previousActiveData);
      queryClient.setQueryData(allKey, context?.previousAllData);
    },
    onSettled: () => {
      void queryClient
        .invalidateQueries({ queryKey: ["exam-types", clinicId] })
        .catch(() => undefined);
    },
  });
};

export const useUpdateExamType = (clinicId: string) => {
  const queryClient = useQueryClient();
  const activeKey = ["exam-types", clinicId, true] as const;
  const allKey = ["exam-types", clinicId, false] as const;

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ExamType> }) =>
      updateExamType(clinicId, id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["exam-types", clinicId] });
      const previousActiveData = queryClient.getQueryData<ExamType[]>(activeKey);
      const previousAllData = queryClient.getQueryData<ExamType[]>(allKey);
      queryClient.setQueryData<ExamType[]>(allKey, (current) =>
        current?.map((item) => (item.id === id ? { ...item, ...data } : item)) ??
        current,
      );
      queryClient.setQueryData<ExamType[]>(activeKey, (current) => {
        const updated = current?.map((item) =>
          item.id === id ? { ...item, ...data } : item,
        );
        return updated?.filter((item) => item.active) ?? current;
      });
      return { previousActiveData, previousAllData };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(activeKey, context?.previousActiveData);
      queryClient.setQueryData(allKey, context?.previousAllData);
    },
    onSettled: () => {
      void queryClient
        .invalidateQueries({ queryKey: ["exam-types", clinicId] })
        .catch(() => undefined);
    },
  });
};

export const useDeleteExamType = (clinicId: string) => {
  const queryClient = useQueryClient();
  const activeKey = ["exam-types", clinicId, true] as const;
  const allKey = ["exam-types", clinicId, false] as const;

  return useMutation({
    mutationFn: (id: string) => deleteExamType(clinicId, id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["exam-types", clinicId] });
      const previousActiveData = queryClient.getQueryData<ExamType[]>(activeKey);
      const previousAllData = queryClient.getQueryData<ExamType[]>(allKey);
      queryClient.setQueryData<ExamType[]>(activeKey, (current) =>
        current?.filter((item) => item.id !== id) ?? current,
      );
      queryClient.setQueryData<ExamType[]>(allKey, (current) =>
        current?.filter((item) => item.id !== id) ?? current,
      );
      return { previousActiveData, previousAllData };
    },
    onError: (_error, _id, context) => {
      queryClient.setQueryData(activeKey, context?.previousActiveData);
      queryClient.setQueryData(allKey, context?.previousAllData);
    },
    onSettled: () => {
      void queryClient
        .invalidateQueries({ queryKey: ["exam-types", clinicId] })
        .catch(() => undefined);
    },
  });
};
