import {
  addDays,
  differenceInCalendarDays,
  isAfter,
  isBefore,
  parse,
  startOfDay,
} from "date-fns";
import { format } from "date-fns";
import { and, asc, eq } from "drizzle-orm";
import { getDb } from "../db";
import { doctorFromRow } from "../db/mappers";
import { doctors, schedules } from "../db/schema";
import type {
  ConsultationPeriod,
  Doctor,
  DoctorFilters,
  Schedule,
  Slot,
} from "../types";

export type DoctorCreateInput = Omit<Doctor, "id" | "clinicId" | "createdAt">;

const timeToMinutes = (time: string): number => {
  const [hours = "0", minutes = "0"] = time.split(":");
  return Number(hours) * 60 + Number(minutes);
};

const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60).toString().padStart(2, "0");
  const mins = (minutes % 60).toString().padStart(2, "0");
  return `${hours}:${mins}`;
};

const buildSlots = (period: ConsultationPeriod): Slot[] => {
  const slots: Slot[] = [];
  const start = timeToMinutes(period.startTime);
  const end = timeToMinutes(period.endTime);
  const capacity = Math.max(period.maxPatients, 1);

  for (let minute = start; minute < end; minute += period.slotMin) {
    for (let index = 0; index < capacity; index += 1) {
      slots.push({
        time: minutesToTime(minute),
        available: true,
        appointmentId: null,
      });
    }
  }

  return slots;
};

export const createDoctor = async (
  clinicId: string,
  data: DoctorCreateInput,
): Promise<Doctor> => {
  const row = (
    await getDb()
      .insert(doctors)
      .values({
        clinicId,
        name: data.name,
        crm: data.crm,
        specialty: data.specialty,
        phone: data.phone,
        email: data.email,
        photoUrl: data.photoUrl,
        photoPublicId: data.photoPublicId,
        consultationPrice: data.consultationPrice,
        active: data.active,
        workDays: data.workDays,
        workDates: data.workDates,
        periods: data.periods,
        vacations: data.vacations,
      })
      .returning()
  )[0];

  if (row === undefined) {
    throw new Error("Não foi possível criar médico");
  }

  const doctor = doctorFromRow(row);
  await regenerateSchedules(clinicId, doctor.id);
  return doctor;
};

export const updateDoctor = async (
  clinicId: string,
  id: string,
  data: Partial<Doctor>,
): Promise<void> => {
  await getDb()
    .update(doctors)
    .set({
      name: data.name,
      crm: data.crm,
      specialty: data.specialty,
      phone: data.phone,
      email: data.email,
      photoUrl: data.photoUrl,
      photoPublicId: data.photoPublicId,
      consultationPrice: data.consultationPrice,
      active: data.active,
      workDays: data.workDays,
      workDates: data.workDates,
      periods: data.periods,
      vacations: data.vacations,
      updatedAt: new Date(),
    })
    .where(and(eq(doctors.clinicId, clinicId), eq(doctors.id, id)));

  if (data.periods !== undefined || data.vacations !== undefined) {
    await regenerateSchedules(clinicId, id);
  }
};

export const softDeleteDoctor = async (
  clinicId: string,
  id: string,
): Promise<void> => {
  await updateDoctor(clinicId, id, { active: false });
};

export const getDoctors = async (
  clinicId: string,
  filters: DoctorFilters = {},
): Promise<Doctor[]> => {
  const conditions = [eq(doctors.clinicId, clinicId)];

  if (filters.active !== undefined) {
    conditions.push(eq(doctors.active, filters.active));
  }

  if (filters.specialty !== undefined) {
    conditions.push(eq(doctors.specialty, filters.specialty));
  }

  const rows = await getDb()
    .select()
    .from(doctors)
    .where(and(...conditions))
    .orderBy(asc(doctors.specialty), asc(doctors.name));

  return rows.map(doctorFromRow);
};

export const getDoctorById = async (
  clinicId: string,
  id: string,
): Promise<Doctor | null> => {
  const row = (
    await getDb()
      .select()
      .from(doctors)
      .where(and(eq(doctors.clinicId, clinicId), eq(doctors.id, id)))
      .limit(1)
  )[0];

  return row === undefined ? null : doctorFromRow(row);
};

export const updateScheduleConfig = async (
  clinicId: string,
  id: string,
  config: Pick<Doctor, "periods" | "vacations">,
): Promise<void> => {
  await updateDoctor(clinicId, id, config);
};

export const regenerateSchedules = async (
  clinicId: string,
  doctorId: string,
  daysAhead = 60,
): Promise<void> => {
  const doctor = await getDoctorById(clinicId, doctorId);

  if (doctor === null) {
    throw new Error("Médico não encontrado");
  }

  const db = getDb();
  const today = startOfDay(new Date());
  const maxDate = addDays(today, daysAhead);
  const desiredScheduleIds = new Set<string>();

  for (const period of doctor.periods) {
    const startDate = parse(period.startDate, "yyyy-MM-dd", new Date());
    const endDate = parse(period.endDate, "yyyy-MM-dd", new Date());
    const totalDays = differenceInCalendarDays(endDate, startDate);

    if (totalDays < 0) {
      continue;
    }

    for (let index = 0; index <= totalDays; index += 1) {
      const date = addDays(startDate, index);

      if (isBefore(date, today) || isAfter(date, maxDate)) {
        continue;
      }

      const dateIso = format(date, "yyyy-MM-dd");
      const vacation = doctor.vacations.some((item) => {
        const vacationStart = parse(item.start, "yyyy-MM-dd", new Date());
        const vacationEnd = parse(item.end, "yyyy-MM-dd", new Date());
        return !isBefore(date, vacationStart) && !isAfter(date, vacationEnd);
      });

      if (vacation) {
        continue;
      }

      const current = (
        await db
          .select()
          .from(schedules)
          .where(
            and(
              eq(schedules.clinicId, clinicId),
              eq(schedules.doctorId, doctorId),
              eq(schedules.date, dateIso),
            ),
          )
          .limit(1)
      )[0];
      const schedule: Omit<Schedule, "id"> = {
        clinicId,
        doctorId,
        date: dateIso,
        slots: buildSlots(period),
      };
      desiredScheduleIds.add(dateIso);
      const currentSlots = current?.slots ?? [];
      const mergedSlots = schedule.slots.map((slot) => {
        const currentSlot = currentSlots.find((item) => item.time === slot.time);
        return currentSlot?.appointmentId !== null && currentSlot?.appointmentId !== undefined
          ? currentSlot
          : slot;
      });

      if (current === undefined) {
        await db.insert(schedules).values({ ...schedule, slots: mergedSlots });
      } else {
        await db
          .update(schedules)
          .set({ slots: mergedSlots, updatedAt: new Date() })
          .where(eq(schedules.id, current.id));
      }
    }
  }

  const futureRows = await db
    .select()
    .from(schedules)
    .where(and(eq(schedules.clinicId, clinicId), eq(schedules.doctorId, doctorId)));

  for (const row of futureRows) {
    if (row.date < format(today, "yyyy-MM-dd") || desiredScheduleIds.has(row.date)) {
      continue;
    }

    const hasAppointments = row.slots.some((slot) => slot.appointmentId !== null);

    if (hasAppointments) {
      await db
        .update(schedules)
        .set({
          slots: row.slots
            .filter((slot) => slot.appointmentId !== null)
            .map((slot) => ({ ...slot, available: false })),
          updatedAt: new Date(),
        })
        .where(eq(schedules.id, row.id));
    } else {
      await db.delete(schedules).where(eq(schedules.id, row.id));
    }
  }
};
