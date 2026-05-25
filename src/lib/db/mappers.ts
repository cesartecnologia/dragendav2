import type { QueryDocumentSnapshot } from "firebase/firestore";
import type {
  Appointment,
  Clinic,
  Doctor,
  Employee,
  ExamType,
  Insurance,
  Patient,
  Payment,
  Schedule,
  Specialty,
  User,
} from "../types";

export const postgresCreatedAt = (value: Date): string => value.toISOString();

export const nullLastDoc = <T>(): QueryDocumentSnapshot<T> | null => null;

export const clinicFromRow = (
  row: typeof import("./schema").clinics.$inferSelect,
): Clinic => ({
  id: row.id,
  name: row.name,
  cnpj: row.cnpj,
  phone: row.phone,
  email: row.email,
  address: row.address,
  logoUrl: row.logoUrl,
  logoPublicId: row.logoPublicId,
  primaryColor: row.primaryColor,
  whatsappToken: row.whatsappToken,
  whatsappPhone: row.whatsappPhone,
  whatsappApiUrl: row.whatsappApiUrl,
  plan: row.plan,
  active: row.active,
  createdAt: postgresCreatedAt(row.createdAt),
});

export const userFromRow = (
  row: typeof import("./schema").users.$inferSelect,
): User => ({
  id: row.firebaseUid,
  clinicId: row.clinicId,
  role: row.role,
  name: row.name,
  email: row.email,
  active: row.active,
  createdAt: postgresCreatedAt(row.createdAt),
});

export const employeeFromRow = (
  row: typeof import("./schema").users.$inferSelect,
): Employee => ({
  id: row.firebaseUid,
  clinicId: row.clinicId,
  name: row.name,
  email: row.email,
  phone: row.phone,
  role: row.role,
  active: row.active,
  createdAt: postgresCreatedAt(row.createdAt),
});

export const specialtyFromRow = (
  row: typeof import("./schema").specialties.$inferSelect,
): Specialty => ({
  id: row.id,
  clinicId: row.clinicId,
  name: row.name,
  active: row.active,
  order: row.order,
  createdAt: postgresCreatedAt(row.createdAt),
});

export const examTypeFromRow = (
  row: typeof import("./schema").examTypes.$inferSelect,
): ExamType => ({
  id: row.id,
  clinicId: row.clinicId,
  name: row.name,
  type: row.type,
  amount: row.amount,
  laboratory: row.laboratory,
  active: row.active,
  createdAt: postgresCreatedAt(row.createdAt),
});

export const insuranceFromRow = (
  row: typeof import("./schema").insurances.$inferSelect,
): Insurance => ({
  id: row.id,
  clinicId: row.clinicId,
  name: row.name,
  ansCode: row.ansCode,
  discountPercent: row.discountPercent,
  active: row.active,
  coverageRules: row.coverageRules,
  createdAt: postgresCreatedAt(row.createdAt),
});

export const doctorFromRow = (
  row: typeof import("./schema").doctors.$inferSelect,
): Doctor => ({
  id: row.id,
  clinicId: row.clinicId,
  name: row.name,
  crm: row.crm,
  specialty: row.specialty,
  phone: row.phone,
  email: row.email,
  photoUrl: row.photoUrl,
  photoPublicId: row.photoPublicId,
  consultationPrice: row.consultationPrice,
  active: row.active,
  workDays: row.workDays,
  workDates: row.workDates,
  periods: row.periods,
  vacations: row.vacations,
  createdAt: postgresCreatedAt(row.createdAt),
});

export const patientFromRow = (
  row: typeof import("./schema").patients.$inferSelect,
): Patient => ({
  id: row.id,
  clinicId: row.clinicId,
  name: row.name,
  cpf: row.cpf,
  birthDate: row.birthDate,
  phone: row.phone,
  email: row.email,
  address: row.address,
  gender: row.gender,
  healthInsurance: row.healthInsurance,
  notes: row.notes,
  active: row.active,
  createdAt: postgresCreatedAt(row.createdAt),
});

export const scheduleFromRow = (
  row: typeof import("./schema").schedules.$inferSelect,
): Schedule => ({
  id: row.id,
  clinicId: row.clinicId,
  doctorId: row.doctorId,
  date: row.date,
  slots: row.slots,
});

export const appointmentFromRow = (
  row: typeof import("./schema").appointments.$inferSelect,
): Appointment => ({
  id: row.id,
  clinicId: row.clinicId,
  patientId: row.patientId,
  patientName: row.patientName,
  doctorId: row.doctorId ?? "",
  doctorName: row.doctorName,
  specialty: row.specialty,
  date: row.date,
  time: row.time.slice(0, 5),
  duration: row.duration,
  status: row.status,
  paymentStatus: row.paymentStatus,
  type: row.type,
  examType: row.examType,
  notes: row.notes,
  whatsappSent: row.whatsappSent,
  insuranceId: row.insuranceId,
  insuranceName: row.insuranceName,
  discountPercent: row.discountPercent,
  amount: row.amount,
  paymentMethod: row.paymentMethod,
  createdAt: postgresCreatedAt(row.createdAt),
  createdBy: row.createdBy,
});

export const paymentFromRow = (
  row: typeof import("./schema").payments.$inferSelect,
): Payment => ({
  id: row.id,
  clinicId: row.clinicId,
  appointmentId: row.appointmentId,
  patientId: row.patientId,
  patientName: row.patientName,
  doctorId: row.doctorId ?? "",
  doctorName: row.doctorName,
  specialty: row.specialty,
  date: row.date,
  amount: row.amount,
  paymentMethod: row.paymentMethod,
  status: row.status,
  insuranceId: row.insuranceId,
  insuranceName: row.insuranceName,
  insuranceCoverage: row.insuranceCoverage,
  patientCopay: row.patientCopay,
  notes: row.notes,
  createdAt: postgresCreatedAt(row.createdAt),
  createdBy: row.createdBy,
});
