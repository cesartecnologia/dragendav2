import type { QueryDocumentSnapshot, Timestamp } from "firebase/firestore";

export const ROLES = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  RECEPTIONIST: "RECEPTIONIST",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const APPOINTMENT_STATUS = {
  SCHEDULED: "scheduled",
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
  NO_SHOW: "no-show",
} as const;

export type AppointmentStatus =
  (typeof APPOINTMENT_STATUS)[keyof typeof APPOINTMENT_STATUS];

export const PAYMENT_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  PARTIAL: "partial",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export const PAYMENT_METHOD = {
  CASH: "cash",
  CREDIT: "credit",
  DEBIT: "debit",
  PIX: "pix",
  INSURANCE: "insurance",
  COURTESY: "courtesy",
} as const;

export type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

export const APPOINTMENT_TYPE = {
  CONSULTATION: "consultation",
  RETURN: "return",
  EXAM: "exam",
  PROCEDURE: "procedure",
} as const;

export type AppointmentType =
  (typeof APPOINTMENT_TYPE)[keyof typeof APPOINTMENT_TYPE];

export const CLINIC_PLAN = {
  STARTER: "starter",
  PRO: "pro",
  ENTERPRISE: "enterprise",
} as const;

export type ClinicPlan = (typeof CLINIC_PLAN)[keyof typeof CLINIC_PLAN];

export const GENDER = {
  MALE: "M",
  FEMALE: "F",
  OTHER: "O",
} as const;

export type Gender = (typeof GENDER)[keyof typeof GENDER];

export const CASH_FLOW_TYPE = {
  INCOME: "income",
  EXPENSE: "expense",
} as const;

export type CashFlowType = (typeof CASH_FLOW_TYPE)[keyof typeof CASH_FLOW_TYPE];

export type Address = {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

export type Clinic = {
  id: string;
  name: string;
  cnpj: string;
  phone: string;
  email: string;
  address: Address;
  logoUrl: string;
  logoPublicId: string;
  primaryColor: string;
  whatsappToken: string;
  whatsappPhone: string;
  whatsappApiUrl: string;
  plan: ClinicPlan;
  active: boolean;
  createdAt: Timestamp;
};

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type WorkDay = {
  weekday: Weekday;
  startTime: string;
  endTime: string;
  slotMin: number;
  maxPatients: number;
};

export type WorkDate = {
  date: string;
  startTime: string;
  endTime: string;
  slotMin: number;
};

export type ConsultationPeriod = {
  id: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  slotMin: number;
  maxPatients: number;
};

export type Vacation = {
  start: string;
  end: string;
};

export type Doctor = {
  id: string;
  clinicId: string;
  name: string;
  crm: string;
  specialty: string;
  phone: string;
  email: string;
  photoUrl: string;
  photoPublicId: string;
  consultationPrice: number;
  active: boolean;
  workDays: WorkDay[];
  workDates: WorkDate[];
  periods: ConsultationPeriod[];
  vacations: Vacation[];
  createdAt: Timestamp;
};

export type Patient = {
  id: string;
  clinicId: string;
  name: string;
  cpf: string;
  birthDate: string;
  phone: string;
  email: string;
  address: Address;
  gender: Gender;
  healthInsurance: string;
  notes: string;
  active: boolean;
  createdAt: Timestamp;
};

export type Appointment = {
  id: string;
  clinicId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  duration: number;
  status: AppointmentStatus;
  paymentStatus: PaymentStatus;
  type: AppointmentType;
  examType: string | null;
  notes: string;
  whatsappSent: boolean;
  insuranceId: string | null;
  insuranceName: string | null;
  discountPercent: number;
  amount: number;
  paymentMethod: PaymentMethod | null;
  createdAt: Timestamp;
  createdBy: string;
};

export type ExamType = {
  id: string;
  clinicId: string;
  name: string;
  type: string;
  amount: number;
  laboratory: string;
  active: boolean;
  createdAt: Timestamp;
};

export type Schedule = {
  id: string;
  clinicId: string;
  doctorId: string;
  date: string;
  slots: Slot[];
};

export type Slot = {
  time: string;
  available: boolean;
  appointmentId: string | null;
};

export type Payment = {
  id: string;
  clinicId: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  date: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  insuranceId: string | null;
  insuranceName: string | null;
  insuranceCoverage: number;
  patientCopay: number;
  notes: string;
  createdAt: Timestamp;
  createdBy: string;
};

export type Insurance = {
  id: string;
  clinicId: string;
  name: string;
  ansCode: string;
  discountPercent: number;
  active: boolean;
  coverageRules: InsuranceCoverageRule[];
  createdAt: Timestamp;
};

export type InsuranceCoverageRule = {
  specialty: string;
  coveredAmount: number;
  copayAmount: number;
};

export type Specialty = {
  id: string;
  clinicId: string;
  name: string;
  active: boolean;
  order: number;
  createdAt: Timestamp;
};

export type Employee = {
  id: string;
  clinicId: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  active: boolean;
  createdAt: Timestamp;
};

export type CashFlow = {
  id: string;
  clinicId: string;
  type: CashFlowType;
  category: string;
  description: string;
  amount: number;
  date: string;
  paymentMethod: string;
  referenceId: string | null;
  createdAt: Timestamp;
};

export type User = {
  id: string;
  clinicId: string;
  role: Role;
  name: string;
  email: string;
  active: boolean;
  createdAt: Timestamp;
};

export type CloudinaryUploadResult = {
  url: string;
  publicId: string;
};

export type RevenueByPeriod = {
  date: string;
  paid: number;
  pending: number;
  cancelled: number;
};

export type RevenueByDoctor = {
  doctorId: string;
  doctorName: string;
  total: number;
  count: number;
  avgTicket: number;
};

export type RevenueByInsurance = {
  insuranceId: string;
  insuranceName: string;
  total: number;
  coverage: number;
  copay: number;
  count: number;
};

export type RevenueByMethod = {
  method: PaymentMethod;
  total: number;
  count: number;
};

export type RevenueSummary = {
  totalPaid: number;
  totalPending: number;
  totalCancelled: number;
  avgTicket: number;
  occupancyRate: number;
  totalAppointments: number;
};

export type PaginatedResult<T> = {
  data: T[];
  lastDoc: QueryDocumentSnapshot<T> | null;
  hasMore: boolean;
};

export type DateRange = {
  from: Date;
  to: Date;
};

export type AppointmentFilters = {
  doctorId?: string;
  specialty?: string;
  status?: AppointmentStatus;
  paymentStatus?: PaymentStatus;
  dateRange?: DateRange;
};

export type PatientFilters = {
  active?: boolean;
  healthInsurance?: string;
  createdAtRange?: DateRange;
  search?: string;
};

export type DoctorFilters = {
  active?: boolean;
  specialty?: string;
};

export type PaymentFilters = {
  doctorId?: string;
  specialty?: string;
  insuranceId?: string;
  status?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  dateRange?: DateRange;
};

export type ReportFilters = {
  dateRange: DateRange;
  doctorId?: string;
  specialty?: string;
  status?: AppointmentStatus;
  insuranceId?: string;
};

export type ReportRow = Record<string, string | number | boolean | null>;

export type ReportData = {
  title: string;
  rows: ReportRow[];
  totals: Record<string, number>;
};

export type WhatsappTemplateName =
  | "confirmation"
  | "reminder"
  | "cancellation"
  | "payment_reminder"
  | "custom";

export type WhatsappTemplate = {
  name: WhatsappTemplateName;
  content: string;
};

export type WhatsappVariables = Record<string, string>;

export type WhatsappSendResult = {
  success: boolean;
  messageId: string;
};

export type WhatsappConnectionResult = {
  connected: boolean;
  phone: string;
};

export type ApiErrorResponse = {
  message: string;
};

export type MutationContext<T> = {
  previousData: T | undefined;
};
