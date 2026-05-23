"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  bulkMarkAsPaid,
  getPaymentsPaginated,
  getPendingPayments,
  getRevenueByDay,
  getRevenueByDoctor,
  getRevenueByInsurance,
  getRevenueByMethod,
  getRevenueSummary,
  registerPayment,
  updatePayment,
  type PaymentCreateInput,
} from "../services/financialService";
import type { DateRange, PaginatedResult, Payment, PaymentFilters } from "../types";
import { invalidateQueriesInBackground } from "../utils/queryInvalidation";

export const paymentsKey = (
  clinicId: string,
  filters: PaymentFilters,
): readonly [string, string, PaymentFilters] => ["payments", clinicId, filters];

export const useRevenueSummary = (clinicId: string, dateRange: DateRange) => {
  return useQuery({
    queryKey: ["revenue-summary", clinicId, dateRange],
    queryFn: () => getRevenueSummary(clinicId, dateRange),
    enabled: clinicId.length > 0,
    staleTime: 60_000,
  });
};

export const useRevenueCharts = (clinicId: string, dateRange: DateRange) => {
  return useQuery({
    queryKey: ["revenue-charts", clinicId, dateRange],
    queryFn: async () => {
      const [byDay, byDoctor, byInsurance, byMethod] = await Promise.all([
        getRevenueByDay(clinicId, dateRange),
        getRevenueByDoctor(clinicId, dateRange),
        getRevenueByInsurance(clinicId, dateRange),
        getRevenueByMethod(clinicId, dateRange),
      ]);

      return { byDay, byDoctor, byInsurance, byMethod };
    },
    enabled: clinicId.length > 0,
    staleTime: 60_000,
  });
};

export const usePayments = (clinicId: string, filters: PaymentFilters) => {
  return useQuery<PaginatedResult<Payment>>({
    queryKey: paymentsKey(clinicId, filters),
    queryFn: () => getPaymentsPaginated(clinicId, filters, null),
    enabled: clinicId.length > 0,
    staleTime: 60_000,
  });
};

export const usePendingPayments = (clinicId: string, daysOverdue: number) => {
  return useQuery<Payment[]>({
    queryKey: ["pending-payments", clinicId, daysOverdue],
    queryFn: () => getPendingPayments(clinicId, daysOverdue),
    enabled: clinicId.length > 0,
    staleTime: 60_000,
  });
};

export const useRegisterPayment = (clinicId: string, filters: PaymentFilters) => {
  const queryClient = useQueryClient();
  const key = paymentsKey(clinicId, filters);

  return useMutation({
    mutationFn: (data: PaymentCreateInput) => registerPayment(clinicId, data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previousData = queryClient.getQueryData<PaginatedResult<Payment>>(key);
      const optimistic: Payment = {
        ...data,
        id: `temp-${crypto.randomUUID()}`,
        clinicId,
        createdAt: previousData?.data[0]?.createdAt ?? ({} as Payment["createdAt"]),
      };
      queryClient.setQueryData<PaginatedResult<Payment>>(key, {
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

export const useUpdatePayment = (clinicId: string, filters: PaymentFilters) => {
  const queryClient = useQueryClient();
  const key = paymentsKey(clinicId, filters);

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Payment> }) =>
      updatePayment(clinicId, id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previousData = queryClient.getQueryData<PaginatedResult<Payment>>(key);
      queryClient.setQueryData<PaginatedResult<Payment>>(key, (current) =>
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

export const useBulkMarkAsPaid = (clinicId: string, filters: PaymentFilters) => {
  const queryClient = useQueryClient();
  const key = paymentsKey(clinicId, filters);

  return useMutation({
    mutationFn: (paymentIds: string[]) => bulkMarkAsPaid(clinicId, paymentIds),
    onMutate: async (paymentIds) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previousData = queryClient.getQueryData<PaginatedResult<Payment>>(key);
      queryClient.setQueryData<PaginatedResult<Payment>>(key, (current) =>
        current === undefined
          ? current
          : {
              ...current,
              data: current.data.map((item) =>
                paymentIds.includes(item.id) ? { ...item, status: "paid" } : item,
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
