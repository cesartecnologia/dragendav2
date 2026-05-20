"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  bookSlot,
  freeSlot,
  getAvailableDates,
  getAvailableSlots,
  getSchedule,
} from "../services/scheduleService";
import type { Schedule, Slot } from "../types";

export const useSchedule = (
  clinicId: string,
  doctorId: string,
  date: string,
) => {
  return useQuery<Schedule | null>({
    queryKey: ["schedule", clinicId, doctorId, date],
    queryFn: () => getSchedule(clinicId, doctorId, date),
    enabled: clinicId.length > 0 && doctorId.length > 0 && date.length > 0,
    staleTime: 30_000,
  });
};

export const useAvailableSlots = (
  clinicId: string,
  doctorId: string,
  date: string,
) => {
  return useQuery<Slot[]>({
    queryKey: ["available-slots", clinicId, doctorId, date],
    queryFn: () => getAvailableSlots(clinicId, doctorId, date),
    enabled: clinicId.length > 0 && doctorId.length > 0 && date.length > 0,
    staleTime: 30_000,
  });
};

export const useAvailableDates = (
  clinicId: string,
  doctorId: string,
  month: string,
) => {
  return useQuery<string[]>({
    queryKey: ["available-dates", clinicId, doctorId, month],
    queryFn: () => getAvailableDates(clinicId, doctorId, month),
    enabled: clinicId.length > 0 && doctorId.length > 0 && month.length > 0,
    staleTime: 30_000,
  });
};

export const useBookSlot = (clinicId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      doctorId,
      date,
      time,
      appointmentId,
    }: {
      doctorId: string;
      date: string;
      time: string;
      appointmentId: string;
    }) => bookSlot(clinicId, doctorId, date, time, appointmentId),
    onSettled: async (_data, _error, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["schedule", clinicId, variables.doctorId, variables.date],
      });
    },
  });
};

export const useFreeSlot = (clinicId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      doctorId,
      date,
      time,
    }: {
      doctorId: string;
      date: string;
      time: string;
    }) => freeSlot(clinicId, doctorId, date, time),
    onSettled: async (_data, _error, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["schedule", clinicId, variables.doctorId, variables.date],
      });
    },
  });
};

