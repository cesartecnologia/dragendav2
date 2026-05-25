import { and, asc, desc, eq, gte, inArray, lte } from "drizzle-orm";
import type { QueryDocumentSnapshot, Unsubscribe } from "firebase/firestore";
import { getDb } from "../db";
import { appointmentFromRow, nullLastDoc } from "../db/mappers";
import { appointments, payments } from "../db/schema";
import {
  APPOINTMENT_STATUS,
  APPOINTMENT_TYPE,
  PAYMENT_STATUS,
  type Appointment,
  type AppointmentFilters,
  type AppointmentStatus,
  type PaginatedResult,
  type Payment,
  type PaymentStatus,
} from "../types";
import { bookSlot, freeSlot } from "./scheduleService";

export type AppointmentCreateInput = Omit<
  Appointment,
  "id" | "clinicId" | "createdAt"
>;

export type TodayAppointmentsListener = {
  unsubscribe: Unsubscribe;
};

const dateFromRange = (date: Date | string): string =>
  typeof date === "string" ? date.slice(0, 10) : date.toISOString().slice(0, 10);

const appointmentDoctorId = (doctorId: string): string | null =>
  doctorId.trim().length > 0 ? doctorId : null;

const appointmentDoctorName = (data: Pick<Appointment, "type" | "doctorName">): string =>
  data.doctorName.trim().length > 0
    ? data.doctorName.trim()
    : data.type === APPOINTMENT_TYPE.EXAM
      ? "Exame"
      : data.doctorName;

const appointmentSpecialty = (data: Pick<Appointment, "type" | "specialty" | "examType">): string =>
  data.specialty.trim().length > 0
    ? data.specialty.trim()
    : data.type === APPOINTMENT_TYPE.EXAM
      ? data.examType ?? "Exame"
      : data.specialty;

const appointmentConditions = (
  clinicId: string,
  filters: AppointmentFilters,
) => {
  const conditions = [eq(appointments.clinicId, clinicId)];

  if (filters.doctorId !== undefined) {
    conditions.push(eq(appointments.doctorId, filters.doctorId));
  }

  if (filters.status !== undefined) {
    conditions.push(eq(appointments.status, filters.status));
  }

  if (filters.paymentStatus !== undefined) {
    conditions.push(eq(appointments.paymentStatus, filters.paymentStatus));
  }

  if (filters.specialty !== undefined) {
    conditions.push(eq(appointments.specialty, filters.specialty));
  }

  if (filters.dateRange !== undefined) {
    conditions.push(gte(appointments.date, dateFromRange(filters.dateRange.from)));
    conditions.push(lte(appointments.date, dateFromRange(filters.dateRange.to)));
  }

  return conditions;
};

export const createAppointment = async (
  clinicId: string,
  data: AppointmentCreateInput,
): Promise<Appointment> => {
  const db = getDb();
  const normalizedDoctorId = appointmentDoctorId(data.doctorId);
  const normalizedDoctorName = appointmentDoctorName(data);
  const normalizedSpecialty = appointmentSpecialty(data);
  const appointmentRow = (
    await db
      .insert(appointments)
      .values({
        clinicId,
        patientId: data.patientId,
        patientName: data.patientName,
        doctorId: normalizedDoctorId,
        doctorName: normalizedDoctorName,
        specialty: normalizedSpecialty,
        date: data.date,
        time: data.time,
        duration: data.duration,
        status: data.status,
        paymentStatus: data.paymentStatus,
        type: data.type,
        examType: data.examType,
        notes: data.notes,
        whatsappSent: data.whatsappSent,
        insuranceId: data.insuranceId,
        insuranceName: data.insuranceName,
        discountPercent: data.discountPercent,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        createdBy: data.createdBy,
      })
      .returning()
  )[0];

  if (appointmentRow === undefined) {
    throw new Error("Não foi possível criar agendamento");
  }

  const appointment = appointmentFromRow(appointmentRow);
  if (appointment.doctorId.length > 0) {
    await bookSlot(clinicId, appointment.doctorId, appointment.date, appointment.time, appointment.id);
  }

  if (appointment.type !== APPOINTMENT_TYPE.RETURN) {
    await db.insert(payments).values({
      clinicId,
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      patientName: appointment.patientName,
      doctorId: appointmentDoctorId(appointment.doctorId),
      doctorName: appointment.doctorName,
      specialty: appointment.specialty,
      date: appointment.date,
      amount: appointment.amount,
      paymentMethod: appointment.paymentMethod ?? "cash",
      status: appointment.paymentStatus,
      insuranceId: appointment.insuranceId,
      insuranceName: appointment.insuranceName,
      insuranceCoverage: 0,
      patientCopay: appointment.amount,
      notes: appointment.notes,
      createdBy: appointment.createdBy,
    });
  }

  return appointment;
};

export const updateAppointment = async (
  clinicId: string,
  id: string,
  data: Partial<Appointment>,
): Promise<void> => {
  await getDb()
    .update(appointments)
    .set({
      patientId: data.patientId,
      patientName: data.patientName,
      doctorId: data.doctorId === undefined ? undefined : appointmentDoctorId(data.doctorId),
      doctorName: data.doctorName,
      specialty: data.specialty,
      date: data.date,
      time: data.time,
      duration: data.duration,
      status: data.status,
      paymentStatus: data.paymentStatus,
      type: data.type,
      examType: data.examType,
      notes: data.notes,
      whatsappSent: data.whatsappSent,
      insuranceId: data.insuranceId,
      insuranceName: data.insuranceName,
      discountPercent: data.discountPercent,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      updatedAt: new Date(),
    })
    .where(and(eq(appointments.clinicId, clinicId), eq(appointments.id, id)));
};

export const updateStatus = async (
  clinicId: string,
  id: string,
  status: AppointmentStatus,
): Promise<void> => {
  if (status === APPOINTMENT_STATUS.CANCELLED) {
    const current = (
      await getDb()
        .select()
        .from(appointments)
        .where(and(eq(appointments.clinicId, clinicId), eq(appointments.id, id)))
        .limit(1)
    )[0];

    if (current !== undefined) {
      const appointment = appointmentFromRow(current);
      if (appointment.doctorId.length > 0) {
        await freeSlot(clinicId, appointment.doctorId, appointment.date, appointment.time);
      }
    }
  }

  await updateAppointment(clinicId, id, { status });
};

export const updatePaymentStatus = async (
  clinicId: string,
  id: string,
  paymentStatus: PaymentStatus,
  paymentMethod?: Payment["paymentMethod"],
): Promise<void> => {
  await updateAppointment(
    clinicId,
    id,
    paymentMethod === undefined ? { paymentStatus } : { paymentStatus, paymentMethod },
  );

  await getDb()
    .update(payments)
    .set({
      status: paymentStatus,
      paymentMethod,
      updatedAt: new Date(),
    })
    .where(and(eq(payments.clinicId, clinicId), eq(payments.appointmentId, id)));
};

export const getAppointmentsByRange = async (
  clinicId: string,
  dateRange: { from: Date; to: Date },
): Promise<Appointment[]> => {
  const rows = await getDb()
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.clinicId, clinicId),
        gte(appointments.date, dateFromRange(dateRange.from)),
        lte(appointments.date, dateFromRange(dateRange.to)),
      ),
    )
    .orderBy(asc(appointments.date), asc(appointments.time));

  return rows.map(appointmentFromRow);
};

export const deleteAppointment = async (
  clinicId: string,
  id: string,
): Promise<void> => {
  await getDb()
    .delete(appointments)
    .where(and(eq(appointments.clinicId, clinicId), eq(appointments.id, id)));
};

export const getAppointmentsByDate = async (
  clinicId: string,
  date: string,
): Promise<Appointment[]> => {
  const rows = await getDb()
    .select()
    .from(appointments)
    .where(and(eq(appointments.clinicId, clinicId), eq(appointments.date, date)))
    .orderBy(asc(appointments.time));

  return rows.map(appointmentFromRow);
};

export const getAppointmentsByDoctor = async (
  clinicId: string,
  doctorId: string,
  dateRange: { from: Date; to: Date },
): Promise<Appointment[]> => {
  const rows = await getDb()
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.clinicId, clinicId),
        eq(appointments.doctorId, doctorId),
        gte(appointments.date, dateFromRange(dateRange.from)),
        lte(appointments.date, dateFromRange(dateRange.to)),
      ),
    )
    .orderBy(asc(appointments.date), asc(appointments.time));

  return rows.map(appointmentFromRow);
};

export const getAppointmentsPaginated = async (
  clinicId: string,
  filters: AppointmentFilters,
  _lastDoc: QueryDocumentSnapshot<Appointment> | null,
): Promise<PaginatedResult<Appointment>> => {
  const rows = await getDb()
    .select()
    .from(appointments)
    .where(and(...appointmentConditions(clinicId, filters)))
    .orderBy(asc(appointments.date), asc(appointments.time))
    .limit(16);

  return {
    data: rows.slice(0, 15).map(appointmentFromRow),
    lastDoc: nullLastDoc<Appointment>(),
    hasMore: rows.length > 15,
  };
};

export const getTodayAppointments = (
  clinicId: string,
  date: string,
  callback: (appointments: Appointment[]) => void,
  onError: (message: string) => void,
): Unsubscribe => {
  let active = true;

  void getDb()
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.clinicId, clinicId),
        eq(appointments.date, date),
        inArray(appointments.status, [
          APPOINTMENT_STATUS.SCHEDULED,
          APPOINTMENT_STATUS.CONFIRMED,
        ]),
      ),
    )
    .orderBy(asc(appointments.time))
    .then((rows) => {
      if (active) {
        callback(rows.map(appointmentFromRow));
      }
    })
    .catch((error: unknown) => {
      if (active) {
        onError(error instanceof Error ? error.message : "Erro ao buscar agenda");
      }
    });

  return (): void => {
    active = false;
  };
};

export const appointmentDefaults = {
  status: APPOINTMENT_STATUS.SCHEDULED,
  paymentStatus: PAYMENT_STATUS.PENDING,
};
