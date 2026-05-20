import {
  addDays,
  differenceInCalendarDays,
  format,
  isAfter,
  isBefore,
  parse,
} from "date-fns";
import {
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import {
  addTypedDoc,
  doctorsCollection,
  getTypedDoc,
  schedulesCollection,
  updateTypedDoc,
} from "../firebase/firestore";
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

  for (let minute = start; minute < end; minute += period.slotMin) {
    slots.push({
      time: minutesToTime(minute),
      available: true,
      appointmentId: null,
    });
  }

  return slots;
};

export const createDoctor = async (
  clinicId: string,
  data: DoctorCreateInput,
): Promise<Doctor> => {
  return await addTypedDoc(doctorsCollection(clinicId), {
    ...data,
    clinicId,
    createdAt: serverTimestamp(),
  } as Omit<Doctor, "id">);
};

export const updateDoctor = async (
  clinicId: string,
  id: string,
  data: Partial<Doctor>,
): Promise<void> => {
  await updateTypedDoc(doc(doctorsCollection(clinicId), id), data);
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
  const constraints = [where("clinicId", "==", clinicId)];

  if (filters.active !== undefined) {
    constraints.push(where("active", "==", filters.active));
  }

  if (filters.specialty !== undefined) {
    constraints.push(where("specialty", "==", filters.specialty));
  }

  const snapshot = await getDocs(
    query(doctorsCollection(clinicId), ...constraints, orderBy("specialty", "asc")),
  );
  return snapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
};

export const getDoctorById = async (
  clinicId: string,
  id: string,
): Promise<Doctor | null> => {
  return await getTypedDoc(doc(doctorsCollection(clinicId), id));
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

  const today = new Date();
  const maxDate = addDays(today, daysAhead);

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

      const schedule: Schedule = {
        id: `${doctorId}_${dateIso}`,
        clinicId,
        doctorId,
        date: dateIso,
        slots: buildSlots(period),
      };
      const reference = doc(schedulesCollection(clinicId), schedule.id);
      const currentSnapshot = await getDoc(reference);
      const currentSlots = currentSnapshot.exists() ? currentSnapshot.data().slots : [];
      const mergedSlots = schedule.slots.map((slot) => {
        const currentSlot = currentSlots.find((item) => item.time === slot.time);
        return currentSlot?.appointmentId !== null && currentSlot?.appointmentId !== undefined
          ? currentSlot
          : slot;
      });

      await setDoc(reference, { ...schedule, slots: mergedSlots }, { merge: true });
    }
  }
};
