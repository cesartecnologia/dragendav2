import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import {
  addTypedDoc,
  appointmentsCollection,
  deleteTypedDoc,
  getPaginatedDocs,
  paymentsCollection,
  updateTypedDoc,
} from "../firebase/firestore";
import { APPOINTMENT_STATUS, APPOINTMENT_TYPE, PAYMENT_STATUS, type Appointment, type AppointmentFilters, type AppointmentStatus, type PaginatedResult, type Payment, type PaymentStatus } from "../types";
import { bookSlot, freeSlot } from "./scheduleService";

export type AppointmentCreateInput = Omit<
  Appointment,
  "id" | "clinicId" | "createdAt"
>;

export type TodayAppointmentsListener = {
  unsubscribe: Unsubscribe;
};

const buildAppointmentConstraints = (
  clinicId: string,
  filters: AppointmentFilters,
): QueryConstraint[] => {
  const constraints: QueryConstraint[] = [where("clinicId", "==", clinicId)];

  if (filters.doctorId !== undefined) {
    constraints.push(where("doctorId", "==", filters.doctorId));
  }

  if (filters.status !== undefined) {
    constraints.push(where("status", "==", filters.status));
  }

  if (filters.paymentStatus !== undefined) {
    constraints.push(where("paymentStatus", "==", filters.paymentStatus));
  }

  if (filters.dateRange !== undefined) {
    constraints.push(where("date", ">=", filters.dateRange.from.toISOString().slice(0, 10)));
    constraints.push(where("date", "<=", filters.dateRange.to.toISOString().slice(0, 10)));
  }

  constraints.push(orderBy("date", "asc"));
  return constraints;
};

export const createAppointment = async (
  clinicId: string,
  data: AppointmentCreateInput,
): Promise<Appointment> => {
  const appointment = await addTypedDoc(appointmentsCollection(clinicId), {
    ...data,
    clinicId,
    createdAt: serverTimestamp(),
  } as Omit<Appointment, "id">);

  await bookSlot(clinicId, appointment.doctorId, appointment.date, appointment.time, appointment.id);
  if (appointment.type !== APPOINTMENT_TYPE.RETURN) {
    await addTypedDoc(paymentsCollection(clinicId), {
      clinicId,
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      patientName: appointment.patientName,
      doctorId: appointment.doctorId,
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
      createdAt: serverTimestamp(),
      createdBy: appointment.createdBy,
    } as Omit<Payment, "id">);
  }

  return appointment;
};

export const updateAppointment = async (
  clinicId: string,
  id: string,
  data: Partial<Appointment>,
): Promise<void> => {
  await updateTypedDoc(doc(appointmentsCollection(clinicId), id), data);
};

export const updateStatus = async (
  clinicId: string,
  id: string,
  status: AppointmentStatus,
): Promise<void> => {
  if (status === APPOINTMENT_STATUS.CANCELLED) {
    const appointmentSnapshot = await getDoc(doc(appointmentsCollection(clinicId), id));

    if (appointmentSnapshot.exists()) {
      const appointment = appointmentSnapshot.data();
      await freeSlot(clinicId, appointment.doctorId, appointment.date, appointment.time);
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
  const updateData: Partial<Appointment> = paymentMethod === undefined
    ? { paymentStatus }
    : { paymentStatus, paymentMethod };
  await updateAppointment(clinicId, id, updateData);

  const paymentsSnapshot = await getDocs(
    query(
      paymentsCollection(clinicId),
      where("clinicId", "==", clinicId),
      where("appointmentId", "==", id),
    ),
  );

  await Promise.all(
    paymentsSnapshot.docs.map((payment) =>
      updateTypedDoc(doc(paymentsCollection(clinicId), payment.id), {
        status: paymentStatus,
        ...(paymentMethod === undefined ? {} : { paymentMethod }),
      }),
    ),
  );
};

export const getAppointmentsByRange = async (
  clinicId: string,
  dateRange: { from: Date; to: Date },
): Promise<Appointment[]> => {
  const snapshot = await getDocs(
    query(
      appointmentsCollection(clinicId),
      where("clinicId", "==", clinicId),
      where("date", ">=", dateRange.from.toISOString().slice(0, 10)),
      where("date", "<=", dateRange.to.toISOString().slice(0, 10)),
      orderBy("date", "asc"),
    ),
  );

  return snapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
};

export const deleteAppointment = async (
  clinicId: string,
  id: string,
): Promise<void> => {
  await deleteTypedDoc(doc(appointmentsCollection(clinicId), id));
};

export const getAppointmentsByDate = async (
  clinicId: string,
  date: string,
): Promise<Appointment[]> => {
  const snapshot = await getDocs(
    query(
      appointmentsCollection(clinicId),
      where("clinicId", "==", clinicId),
      where("date", "==", date),
      orderBy("time", "asc"),
    ),
  );
  return snapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
};

export const getAppointmentsByDoctor = async (
  clinicId: string,
  doctorId: string,
  dateRange: { from: Date; to: Date },
): Promise<Appointment[]> => {
  const snapshot = await getDocs(
    query(
      appointmentsCollection(clinicId),
      where("clinicId", "==", clinicId),
      where("doctorId", "==", doctorId),
      where("date", ">=", dateRange.from.toISOString().slice(0, 10)),
      where("date", "<=", dateRange.to.toISOString().slice(0, 10)),
      orderBy("date", "asc"),
    ),
  );
  return snapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
};

export const getAppointmentsPaginated = async (
  clinicId: string,
  filters: AppointmentFilters,
  lastDoc: QueryDocumentSnapshot<Appointment> | null,
): Promise<PaginatedResult<Appointment>> => {
  return await getPaginatedDocs(
    appointmentsCollection(clinicId),
    buildAppointmentConstraints(clinicId, filters),
    15,
    lastDoc,
  );
};

export const getTodayAppointments = (
  clinicId: string,
  date: string,
  callback: (appointments: Appointment[]) => void,
  onError: (message: string) => void,
): Unsubscribe => {
  return onSnapshot(
    query(
      appointmentsCollection(clinicId),
      where("clinicId", "==", clinicId),
      where("date", "==", date),
      where("status", "in", [
        APPOINTMENT_STATUS.SCHEDULED,
        APPOINTMENT_STATUS.CONFIRMED,
      ]),
      orderBy("time", "asc"),
    ),
    (snapshot) => {
      callback(snapshot.docs.map((item) => ({ ...item.data(), id: item.id })));
    },
    (error) => {
      onError(error.message);
    },
  );
};

export const appointmentDefaults = {
  status: APPOINTMENT_STATUS.SCHEDULED,
  paymentStatus: PAYMENT_STATUS.PENDING,
};
