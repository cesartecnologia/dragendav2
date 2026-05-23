"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAppointment,
  getAppointmentsByRange,
  getAppointmentsPaginated,
  updateAppointment,
  updatePaymentStatus,
  updateStatus,
  type AppointmentCreateInput,
} from "../services/appointmentService";
import type {
  Appointment,
  AppointmentFilters,
  AppointmentStatus,
  PaginatedResult,
  PaymentStatus,
  PaymentMethod,
} from "../types";
import { invalidateQueriesInBackground } from "../utils/queryInvalidation";

export const appointmentsKey = (
  clinicId: string,
  filters: AppointmentFilters,
): readonly [string, string, AppointmentFilters] => [
  "appointments",
  clinicId,
  filters,
];

export const useAppointments = (
  clinicId: string,
  filters: AppointmentFilters,
) => {
  return useQuery<PaginatedResult<Appointment>>({
    queryKey: appointmentsKey(clinicId, filters),
    queryFn: () => getAppointmentsPaginated(clinicId, filters, null),
    enabled: clinicId.length > 0,
    staleTime: 120_000,
  });
};

export const useAppointmentsByRange = (
  clinicId: string,
  dateRange: { from: Date; to: Date },
  enabled = true,
) => {
  return useQuery<Appointment[]>({
    queryKey: ["appointments-range", clinicId, dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: () => getAppointmentsByRange(clinicId, dateRange),
    enabled: enabled && clinicId.length > 0,
    staleTime: 120_000,
  });
};

export const useCreateAppointment = (
  clinicId: string,
  filters: AppointmentFilters,
) => {
  const queryClient = useQueryClient();
  const key = appointmentsKey(clinicId, filters);

  return useMutation({
    mutationFn: (data: AppointmentCreateInput) => createAppointment(clinicId, data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previousData = queryClient.getQueryData<PaginatedResult<Appointment>>(key);
      const optimistic: Appointment = {
        ...data,
        id: `temp-${crypto.randomUUID()}`,
        clinicId,
        createdAt: previousData?.data[0]?.createdAt ?? ({} as Appointment["createdAt"]),
      };
      queryClient.setQueryData<PaginatedResult<Appointment>>(key, {
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

export const useUpdateAppointmentStatus = (
  clinicId: string,
  filters: AppointmentFilters,
) => {
  const queryClient = useQueryClient();
  const key = appointmentsKey(clinicId, filters);

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      updateStatus(clinicId, id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previousData = queryClient.getQueryData<PaginatedResult<Appointment>>(key);
      queryClient.setQueryData<PaginatedResult<Appointment>>(key, (current) =>
        current === undefined
          ? current
          : {
              ...current,
              data: current.data.map((item) =>
                item.id === id ? { ...item, status } : item,
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

export const useUpdateAppointmentPaymentStatus = (
  clinicId: string,
  filters: AppointmentFilters,
) => {
  const queryClient = useQueryClient();
  const key = appointmentsKey(clinicId, filters);

  return useMutation({
    mutationFn: ({ id, paymentStatus, paymentMethod }: { id: string; paymentStatus: PaymentStatus; paymentMethod?: PaymentMethod }) =>
      updatePaymentStatus(clinicId, id, paymentStatus, paymentMethod),
    onMutate: async ({ id, paymentStatus, paymentMethod }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previousData = queryClient.getQueryData<PaginatedResult<Appointment>>(key);
      queryClient.setQueryData<PaginatedResult<Appointment>>(key, (current) =>
        current === undefined
          ? current
          : {
              ...current,
              data: current.data.map((item) =>
                item.id === id
                  ? { ...item, paymentStatus, ...(paymentMethod === undefined ? {} : { paymentMethod }) }
                  : item,
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

export const useUpdateAppointment = (
  clinicId: string,
  filters: AppointmentFilters,
) => {
  const queryClient = useQueryClient();
  const key = appointmentsKey(clinicId, filters);

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Appointment> }) =>
      updateAppointment(clinicId, id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previousData = queryClient.getQueryData<PaginatedResult<Appointment>>(key);
      queryClient.setQueryData<PaginatedResult<Appointment>>(key, (current) =>
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
