import type { QueryDocumentSnapshot, Unsubscribe } from "firebase/firestore";
import {
  APPOINTMENT_STATUS,
  PAYMENT_STATUS,
  type Appointment,
  type AppointmentFilters,
  type AppointmentStatus,
  type PaginatedResult,
  type Payment,
  type PaymentStatus,
} from "../types";
import { callDataService } from "./rpcClient";

export type AppointmentCreateInput = Omit<
  Appointment,
  "id" | "clinicId" | "createdAt"
>;

export type TodayAppointmentsListener = {
  unsubscribe: Unsubscribe;
};

export const createAppointment = async (
  clinicId: string,
  data: AppointmentCreateInput,
): Promise<Appointment> =>
  await callDataService<Appointment>("appointments", "createAppointment", [clinicId, data]);

export const updateAppointment = async (
  clinicId: string,
  id: string,
  data: Partial<Appointment>,
): Promise<void> => {
  await callDataService<void>("appointments", "updateAppointment", [clinicId, id, data]);
};

export const updateStatus = async (
  clinicId: string,
  id: string,
  status: AppointmentStatus,
): Promise<void> => {
  await callDataService<void>("appointments", "updateStatus", [clinicId, id, status]);
};

export const updatePaymentStatus = async (
  clinicId: string,
  id: string,
  paymentStatus: PaymentStatus,
  paymentMethod?: Payment["paymentMethod"],
): Promise<void> => {
  await callDataService<void>("appointments", "updatePaymentStatus", [
    clinicId,
    id,
    paymentStatus,
    paymentMethod,
  ]);
};

export const getAppointmentsByRange = async (
  clinicId: string,
  dateRange: { from: Date; to: Date },
): Promise<Appointment[]> =>
  await callDataService<Appointment[]>("appointments", "getAppointmentsByRange", [clinicId, dateRange]);

export const deleteAppointment = async (
  clinicId: string,
  id: string,
): Promise<void> => {
  await callDataService<void>("appointments", "deleteAppointment", [clinicId, id]);
};

export const getAppointmentsByDate = async (
  clinicId: string,
  date: string,
): Promise<Appointment[]> =>
  await callDataService<Appointment[]>("appointments", "getAppointmentsByDate", [clinicId, date]);

export const getAppointmentsByDoctor = async (
  clinicId: string,
  doctorId: string,
  dateRange: { from: Date; to: Date },
): Promise<Appointment[]> =>
  await callDataService<Appointment[]>("appointments", "getAppointmentsByDoctor", [
    clinicId,
    doctorId,
    dateRange,
  ]);

export const getAppointmentsPaginated = async (
  clinicId: string,
  filters: AppointmentFilters,
  lastDoc: QueryDocumentSnapshot<Appointment> | null,
): Promise<PaginatedResult<Appointment>> =>
  await callDataService<PaginatedResult<Appointment>>("appointments", "getAppointmentsPaginated", [
    clinicId,
    filters,
    lastDoc,
  ]);

export const getTodayAppointments = (
  clinicId: string,
  date: string,
  callback: (appointments: Appointment[]) => void,
  onError: (message: string) => void,
): Unsubscribe => {
  let active = true;

  void callDataService<Appointment[]>("appointments", "getAppointmentsByDate", [clinicId, date])
    .then((appointments) => {
      if (active) {
        callback(
          appointments.filter(
            (appointment) =>
              appointment.status === APPOINTMENT_STATUS.SCHEDULED ||
              appointment.status === APPOINTMENT_STATUS.CONFIRMED,
          ),
        );
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
