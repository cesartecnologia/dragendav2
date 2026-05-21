import { and, eq } from "drizzle-orm";
import { getDb } from "../db";
import { scheduleFromRow } from "../db/mappers";
import { schedules } from "../db/schema";
import type { Schedule, Slot } from "../types";
import { isPastBrazilDateTime, todayISO } from "../utils/date";

export const scheduleId = (doctorId: string, date: string): string =>
  `${doctorId}_${date}`;

export const getSchedule = async (
  clinicId: string,
  doctorId: string,
  date: string,
): Promise<Schedule | null> => {
  const row = (
    await getDb()
      .select()
      .from(schedules)
      .where(
        and(
          eq(schedules.clinicId, clinicId),
          eq(schedules.doctorId, doctorId),
          eq(schedules.date, date),
        ),
      )
      .limit(1)
  )[0];

  return row === undefined ? null : scheduleFromRow(row);
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
  const rows = await getDb()
    .select()
    .from(schedules)
    .where(and(eq(schedules.clinicId, clinicId), eq(schedules.doctorId, doctorId)));

  return rows
    .map(scheduleFromRow)
    .filter((schedule) => schedule.date.startsWith(month))
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

  await getDb()
    .update(schedules)
    .set({ slots: updatedSlots, updatedAt: new Date() })
    .where(eq(schedules.id, schedule.id));
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

  await getDb()
    .update(schedules)
    .set({ slots: updatedSlots, updatedAt: new Date() })
    .where(eq(schedules.id, schedule.id));
};

export const saveSchedule = async (schedule: Schedule): Promise<void> => {
  await getDb()
    .insert(schedules)
    .values({
      id: schedule.id,
      clinicId: schedule.clinicId,
      doctorId: schedule.doctorId,
      date: schedule.date,
      slots: schedule.slots,
    })
    .onConflictDoUpdate({
      target: schedules.id,
      set: {
        slots: schedule.slots,
        updatedAt: new Date(),
      },
    });
};
