import type { Schedule, Slot } from "../types";
import { callDataService } from "./rpcClient";

export const scheduleId = (doctorId: string, date: string): string =>
  `${doctorId}_${date}`;

export const getSchedule = async (
  clinicId: string,
  doctorId: string,
  date: string,
): Promise<Schedule | null> =>
  await callDataService<Schedule | null>("schedules", "getSchedule", [clinicId, doctorId, date]);

export const getAvailableSlots = async (
  clinicId: string,
  doctorId: string,
  date: string,
): Promise<Slot[]> =>
  await callDataService<Slot[]>("schedules", "getAvailableSlots", [clinicId, doctorId, date]);

export const getAvailableDates = async (
  clinicId: string,
  doctorId: string,
  month: string,
): Promise<string[]> =>
  await callDataService<string[]>("schedules", "getAvailableDates", [clinicId, doctorId, month]);

export const bookSlot = async (
  clinicId: string,
  doctorId: string,
  date: string,
  time: string,
  appointmentId: string,
): Promise<void> => {
  await callDataService<void>("schedules", "bookSlot", [clinicId, doctorId, date, time, appointmentId]);
};

export const freeSlot = async (
  clinicId: string,
  doctorId: string,
  date: string,
  time: string,
): Promise<void> => {
  await callDataService<void>("schedules", "freeSlot", [clinicId, doctorId, date, time]);
};

export const saveSchedule = async (schedule: Schedule): Promise<void> => {
  await callDataService<void>("schedules", "saveSchedule", [schedule]);
};
