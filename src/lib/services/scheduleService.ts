import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import {
  schedulesCollection,
  updateTypedDoc,
} from "../firebase/firestore";
import type { Schedule, Slot } from "../types";
import { isPastBrazilDateTime, todayISO } from "../utils/date";

export const scheduleId = (doctorId: string, date: string): string =>
  `${doctorId}_${date}`;

export const getSchedule = async (
  clinicId: string,
  doctorId: string,
  date: string,
): Promise<Schedule | null> => {
  try {
    const reference = doc(schedulesCollection(clinicId), scheduleId(doctorId, date));
    const snapshot = await getDoc(reference);
    return snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } : null;
  } catch (error: unknown) {
    throw new Error(
      error instanceof Error ? error.message : "Erro ao buscar agenda",
    );
  }
};

export const getAvailableSlots = async (
  clinicId: string,
  doctorId: string,
  date: string,
): Promise<Slot[]> => {
  const schedule = await getSchedule(clinicId, doctorId, date);
  return schedule?.slots.filter((slot) => slot.available && !isPastBrazilDateTime(date, slot.time)) ?? [];
};

export const getAvailableDates = async (
  clinicId: string,
  doctorId: string,
  month: string,
): Promise<string[]> => {
  const firstDay = `${month}-01`;
  const dates = Array.from({ length: 31 }, (_, index) => {
    const day = `${index + 1}`.padStart(2, "0");
    return `${month}-${day}`;
  });
  const schedules = await Promise.all(
    dates.map((date) => getSchedule(clinicId, doctorId, date)),
  );
  return schedules
    .filter((schedule): schedule is Schedule => schedule !== null)
    .filter((schedule) => schedule.date >= firstDay)
    .filter((schedule) => schedule.date >= todayISO())
    .filter((schedule) => schedule.slots.some((slot) => slot.available && !isPastBrazilDateTime(schedule.date, slot.time)))
    .map((schedule) => schedule.date);
};

export const bookSlot = async (
  clinicId: string,
  doctorId: string,
  date: string,
  time: string,
  appointmentId: string,
): Promise<void> => {
  const schedule = await getSchedule(clinicId, doctorId, date);

  if (schedule === null) {
    throw new Error("Agenda não encontrada");
  }

  if (isPastBrazilDateTime(date, time)) {
    throw new Error("Não é permitido agendar em data ou horário retroativo");
  }

  const updatedSlots = schedule.slots.map((slot) =>
    slot.time === time
      ? { ...slot, available: false, appointmentId }
      : slot,
  );

  await updateTypedDoc(doc(schedulesCollection(clinicId), schedule.id), {
    slots: updatedSlots,
  });
};

export const freeSlot = async (
  clinicId: string,
  doctorId: string,
  date: string,
  time: string,
): Promise<void> => {
  const schedule = await getSchedule(clinicId, doctorId, date);

  if (schedule === null) {
    return;
  }

  const updatedSlots = schedule.slots.map((slot) =>
    slot.time === time ? { ...slot, available: true, appointmentId: null } : slot,
  );

  await updateTypedDoc(doc(schedulesCollection(clinicId), schedule.id), {
    slots: updatedSlots,
  });
};

export const saveSchedule = async (schedule: Schedule): Promise<void> => {
  const reference = doc(schedulesCollection(schedule.clinicId), schedule.id);
  await setDoc(reference, {
    ...schedule,
    createdAt: serverTimestamp(),
  } as Schedule);
};
