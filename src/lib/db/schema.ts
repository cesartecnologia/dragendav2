import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import type {
  Address,
  AppointmentStatus,
  AppointmentType,
  CashFlowType,
  ClinicPlan,
  ConsultationPeriod,
  Gender,
  InsuranceCoverageRule,
  PaymentMethod,
  PaymentStatus,
  Role,
  Slot,
  Vacation,
  WhatsappTemplateName,
  WorkDate,
  WorkDay,
} from "../types";

export const roleEnum = pgEnum("role", ["OWNER", "ADMIN", "RECEPTIONIST"]);
export const clinicPlanEnum = pgEnum("clinic_plan", ["starter", "pro", "enterprise"]);
export const genderEnum = pgEnum("gender", ["M", "F", "O"]);
export const appointmentStatusEnum = pgEnum("appointment_status", [
  "scheduled",
  "confirmed",
  "cancelled",
  "completed",
  "no-show",
]);
export const appointmentTypeEnum = pgEnum("appointment_type", [
  "consultation",
  "return",
  "exam",
  "procedure",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "partial",
  "cancelled",
  "refunded",
]);
export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "credit",
  "debit",
  "pix",
  "insurance",
  "courtesy",
]);
export const cashFlowTypeEnum = pgEnum("cash_flow_type", ["income", "expense"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "trialing",
  "active",
  "past_due",
  "cancelled",
  "blocked",
]);
export const billingProviderEnum = pgEnum("billing_provider", ["asaas", "stripe"]);
export const checkoutPaymentMethodEnum = pgEnum("checkout_payment_method", [
  "credit_card",
  "boleto",
]);
export const checkoutSessionStatusEnum = pgEnum("checkout_session_status", [
  "initiated",
  "waiting_payment",
  "paid",
  "expired",
  "cancelled",
]);
export const onboardingStatusEnum = pgEnum("onboarding_status", [
  "locked",
  "released",
  "processing",
  "completed",
]);

export const clinics = pgTable("clinics", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 180 }).notNull(),
  cnpj: varchar("cnpj", { length: 14 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 180 }).notNull(),
  address: jsonb("address").$type<Address>().notNull(),
  logoUrl: text("logo_url").notNull().default(""),
  logoPublicId: text("logo_public_id").notNull().default(""),
  primaryColor: varchar("primary_color", { length: 20 }).notNull().default("#6B8CAE"),
  whatsappToken: text("whatsapp_token").notNull().default(""),
  whatsappPhone: varchar("whatsapp_phone", { length: 20 }).notNull().default(""),
  whatsappApiUrl: text("whatsapp_api_url").notNull().default(""),
  plan: clinicPlanEnum("plan").$type<ClinicPlan>().notNull().default("starter"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  cnpjIdx: uniqueIndex("clinics_cnpj_idx").on(table.cnpj),
}));

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  firebaseUid: varchar("firebase_uid", { length: 128 }).notNull(),
  clinicId: uuid("clinic_id").notNull().references(() => clinics.id, { onDelete: "cascade" }),
  role: roleEnum("role").$type<Role>().notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  email: varchar("email", { length: 180 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull().default(""),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  firebaseUidIdx: uniqueIndex("users_firebase_uid_idx").on(table.firebaseUid),
  clinicEmailIdx: uniqueIndex("users_clinic_email_idx").on(table.clinicId, table.email),
  clinicRoleIdx: index("users_clinic_role_idx").on(table.clinicId, table.role),
}));

export const doctors = pgTable("doctors", {
  id: uuid("id").primaryKey().defaultRandom(),
  clinicId: uuid("clinic_id").notNull().references(() => clinics.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 180 }).notNull(),
  crm: varchar("crm", { length: 40 }).notNull(),
  specialty: varchar("specialty", { length: 120 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 180 }).notNull(),
  photoUrl: text("photo_url").notNull().default(""),
  photoPublicId: text("photo_public_id").notNull().default(""),
  consultationPrice: integer("consultation_price").notNull().default(0),
  active: boolean("active").notNull().default(true),
  workDays: jsonb("work_days").$type<WorkDay[]>().notNull().default([]),
  workDates: jsonb("work_dates").$type<WorkDate[]>().notNull().default([]),
  periods: jsonb("periods").$type<ConsultationPeriod[]>().notNull().default([]),
  vacations: jsonb("vacations").$type<Vacation[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  clinicActiveSpecialtyIdx: index("doctors_clinic_active_specialty_idx").on(
    table.clinicId,
    table.active,
    table.specialty,
  ),
  clinicCrmIdx: uniqueIndex("doctors_clinic_crm_idx").on(table.clinicId, table.crm),
}));

export const patients = pgTable("patients", {
  id: uuid("id").primaryKey().defaultRandom(),
  clinicId: uuid("clinic_id").notNull().references(() => clinics.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 180 }).notNull(),
  cpf: varchar("cpf", { length: 11 }).notNull(),
  birthDate: date("birth_date").notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 180 }).notNull(),
  address: jsonb("address").$type<Address>().notNull(),
  gender: genderEnum("gender").$type<Gender>().notNull(),
  healthInsurance: varchar("health_insurance", { length: 180 }).notNull().default(""),
  notes: text("notes").notNull().default(""),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  clinicActiveCreatedIdx: index("patients_clinic_active_created_idx").on(
    table.clinicId,
    table.active,
    table.createdAt,
  ),
  clinicCpfIdx: uniqueIndex("patients_clinic_cpf_idx").on(table.clinicId, table.cpf),
}));

export const appointments = pgTable("appointments", {
  id: uuid("id").primaryKey().defaultRandom(),
  clinicId: uuid("clinic_id").notNull().references(() => clinics.id, { onDelete: "cascade" }),
  patientId: uuid("patient_id").notNull().references(() => patients.id),
  patientName: varchar("patient_name", { length: 180 }).notNull(),
  doctorId: uuid("doctor_id").references(() => doctors.id),
  doctorName: varchar("doctor_name", { length: 180 }).notNull(),
  specialty: varchar("specialty", { length: 120 }).notNull(),
  date: date("date").notNull(),
  time: time("time").notNull(),
  duration: integer("duration").notNull(),
  status: appointmentStatusEnum("status").$type<AppointmentStatus>().notNull().default("scheduled"),
  paymentStatus: paymentStatusEnum("payment_status").$type<PaymentStatus>().notNull().default("pending"),
  type: appointmentTypeEnum("type").$type<AppointmentType>().notNull(),
  examType: varchar("exam_type", { length: 160 }),
  notes: text("notes").notNull().default(""),
  whatsappSent: boolean("whatsapp_sent").notNull().default(false),
  insuranceId: uuid("insurance_id"),
  insuranceName: varchar("insurance_name", { length: 180 }),
  discountPercent: integer("discount_percent").notNull().default(0),
  amount: integer("amount").notNull().default(0),
  paymentMethod: paymentMethodEnum("payment_method").$type<PaymentMethod>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: varchar("created_by", { length: 180 }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  clinicDateStatusIdx: index("appointments_clinic_date_status_idx").on(table.clinicId, table.date, table.status),
  clinicDoctorDateIdx: index("appointments_clinic_doctor_date_idx").on(table.clinicId, table.doctorId, table.date),
  clinicPaymentDateIdx: index("appointments_clinic_payment_date_idx").on(
    table.clinicId,
    table.paymentStatus,
    table.date,
  ),
  clinicWhatsappDateIdx: index("appointments_clinic_whatsapp_date_idx").on(
    table.clinicId,
    table.whatsappSent,
    table.date,
  ),
}));

export const schedules = pgTable("schedules", {
  id: uuid("id").primaryKey().defaultRandom(),
  clinicId: uuid("clinic_id").notNull().references(() => clinics.id, { onDelete: "cascade" }),
  doctorId: uuid("doctor_id").notNull().references(() => doctors.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  slots: jsonb("slots").$type<Slot[]>().notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  clinicDoctorDateIdx: uniqueIndex("schedules_clinic_doctor_date_idx").on(table.clinicId, table.doctorId, table.date),
}));

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  clinicId: uuid("clinic_id").notNull().references(() => clinics.id, { onDelete: "cascade" }),
  appointmentId: uuid("appointment_id").notNull().references(() => appointments.id),
  patientId: uuid("patient_id").notNull().references(() => patients.id),
  patientName: varchar("patient_name", { length: 180 }).notNull(),
  doctorId: uuid("doctor_id").references(() => doctors.id),
  doctorName: varchar("doctor_name", { length: 180 }).notNull(),
  specialty: varchar("specialty", { length: 120 }).notNull(),
  date: date("date").notNull(),
  amount: integer("amount").notNull(),
  paymentMethod: paymentMethodEnum("payment_method").$type<PaymentMethod>().notNull(),
  status: paymentStatusEnum("status").$type<PaymentStatus>().notNull().default("pending"),
  insuranceId: uuid("insurance_id"),
  insuranceName: varchar("insurance_name", { length: 180 }),
  insuranceCoverage: integer("insurance_coverage").notNull().default(0),
  patientCopay: integer("patient_copay").notNull().default(0),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: varchar("created_by", { length: 180 }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  clinicDateStatusIdx: index("payments_clinic_date_status_idx").on(table.clinicId, table.date, table.status),
  clinicDoctorDateIdx: index("payments_clinic_doctor_date_idx").on(table.clinicId, table.doctorId, table.date),
  clinicInsuranceDateIdx: index("payments_clinic_insurance_date_idx").on(table.clinicId, table.insuranceId, table.date),
  clinicStatusCreatedIdx: index("payments_clinic_status_created_idx").on(table.clinicId, table.status, table.createdAt),
}));

export const insurances = pgTable("insurances", {
  id: uuid("id").primaryKey().defaultRandom(),
  clinicId: uuid("clinic_id").notNull().references(() => clinics.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 180 }).notNull(),
  ansCode: varchar("ans_code", { length: 40 }).notNull().default(""),
  discountPercent: integer("discount_percent").notNull().default(0),
  active: boolean("active").notNull().default(true),
  coverageRules: jsonb("coverage_rules").$type<InsuranceCoverageRule[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  clinicActiveNameIdx: index("insurances_clinic_active_name_idx").on(table.clinicId, table.active, table.name),
}));

export const examTypes = pgTable("exam_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  clinicId: uuid("clinic_id").notNull().references(() => clinics.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 180 }).notNull(),
  type: varchar("type", { length: 120 }).notNull(),
  amount: integer("amount").notNull().default(0),
  laboratory: varchar("laboratory", { length: 180 }).notNull().default(""),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  clinicActiveNameIdx: index("exam_types_clinic_active_name_idx").on(table.clinicId, table.active, table.name),
}));

export const specialties = pgTable("specialties", {
  id: uuid("id").primaryKey().defaultRandom(),
  clinicId: uuid("clinic_id").notNull().references(() => clinics.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 180 }).notNull(),
  color: varchar("color", { length: 20 }).notNull().default("#6B8CAE"),
  order: integer("order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  clinicNameIdx: uniqueIndex("specialties_clinic_name_idx").on(table.clinicId, table.name),
  clinicOrderIdx: index("specialties_clinic_order_idx").on(table.clinicId, table.order),
}));

export const cashFlow = pgTable("cash_flow", {
  id: uuid("id").primaryKey().defaultRandom(),
  clinicId: uuid("clinic_id").notNull().references(() => clinics.id, { onDelete: "cascade" }),
  type: cashFlowTypeEnum("type").$type<CashFlowType>().notNull(),
  category: varchar("category", { length: 120 }).notNull(),
  description: text("description").notNull(),
  amount: integer("amount").notNull(),
  date: date("date").notNull(),
  paymentMethod: varchar("payment_method", { length: 80 }).notNull(),
  referenceId: uuid("reference_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  clinicDateTypeIdx: index("cash_flow_clinic_date_type_idx").on(table.clinicId, table.date, table.type),
}));

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  clinicId: uuid("clinic_id").notNull().references(() => clinics.id, { onDelete: "cascade" }),
  provider: billingProviderEnum("provider").notNull().default("asaas"),
  providerCustomerId: varchar("provider_customer_id", { length: 120 }).notNull().default(""),
  providerSubscriptionId: varchar("provider_subscription_id", { length: 120 }).notNull().default(""),
  status: subscriptionStatusEnum("status").notNull().default("trialing"),
  plan: clinicPlanEnum("plan").$type<ClinicPlan>().notNull().default("starter"),
  amount: integer("amount").notNull().default(0),
  nextDueDate: date("next_due_date"),
  currentPeriodEnd: date("current_period_end"),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  blockedAt: timestamp("blocked_at", { withTimezone: true }),
  lastEventId: varchar("last_event_id", { length: 160 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  clinicIdx: uniqueIndex("subscriptions_clinic_idx").on(table.clinicId),
  providerSubscriptionIdx: uniqueIndex("subscriptions_provider_subscription_idx").on(
    table.provider,
    table.providerSubscriptionId,
  ),
  statusIdx: index("subscriptions_status_idx").on(table.status),
}));

export const billingEvents = pgTable("billing_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  clinicId: uuid("clinic_id").references(() => clinics.id, { onDelete: "set null" }),
  provider: billingProviderEnum("provider").notNull().default("asaas"),
  providerEventId: varchar("provider_event_id", { length: 160 }).notNull(),
  eventType: varchar("event_type", { length: 120 }).notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  providerEventIdx: uniqueIndex("billing_events_provider_event_idx").on(table.provider, table.providerEventId),
  clinicProcessedIdx: index("billing_events_clinic_processed_idx").on(table.clinicId, table.processedAt),
}));

export const checkoutSessions = pgTable("checkout_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  planId: varchar("plan_id", { length: 80 }).notNull().default("starter"),
  planName: varchar("plan_name", { length: 120 }).notNull().default("Plano Premium"),
  value: integer("value").notNull().default(9990),
  paymentMethod: checkoutPaymentMethodEnum("payment_method").notNull(),
  status: checkoutSessionStatusEnum("status").notNull().default("initiated"),
  asaasCheckoutId: varchar("asaas_checkout_id", { length: 120 }),
  asaasPaymentLinkId: varchar("asaas_payment_link_id", { length: 120 }),
  asaasCustomerId: varchar("asaas_customer_id", { length: 120 }),
  asaasSubscriptionId: varchar("asaas_subscription_id", { length: 120 }),
  paymentId: varchar("payment_id", { length: 120 }),
  paymentStatus: varchar("payment_status", { length: 80 }),
  checkoutUrl: text("checkout_url"),
  invoiceUrl: text("invoice_url"),
  payerName: varchar("payer_name", { length: 180 }),
  payerEmail: varchar("payer_email", { length: 180 }),
  payerPhone: varchar("payer_phone", { length: 30 }),
  payerCpfCnpj: varchar("payer_cpf_cnpj", { length: 20 }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  asaasCheckoutIdx: uniqueIndex("checkout_sessions_asaas_checkout_idx").on(table.asaasCheckoutId),
  asaasPaymentLinkIdx: uniqueIndex("checkout_sessions_asaas_payment_link_idx").on(table.asaasPaymentLinkId),
  asaasSubscriptionIdx: index("checkout_sessions_asaas_subscription_idx").on(table.asaasSubscriptionId),
  paymentIdx: index("checkout_sessions_payment_idx").on(table.paymentId),
  statusIdx: index("checkout_sessions_status_idx").on(table.status),
}));

export const checkoutOnboarding = pgTable("checkout_onboarding", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").notNull().references(() => checkoutSessions.id, { onDelete: "cascade" }),
  status: onboardingStatusEnum("status").notNull().default("locked"),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  clinicId: uuid("clinic_id").references(() => clinics.id, { onDelete: "set null" }),
  releasedAt: timestamp("released_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  sessionIdx: uniqueIndex("checkout_onboarding_session_idx").on(table.sessionId),
  statusIdx: index("checkout_onboarding_status_idx").on(table.status),
}));

export const checkoutPayments = pgTable("checkout_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").references(() => checkoutSessions.id, { onDelete: "set null" }),
  asaasPaymentId: varchar("asaas_payment_id", { length: 120 }).notNull(),
  status: varchar("status", { length: 80 }),
  method: checkoutPaymentMethodEnum("method"),
  value: integer("value"),
  invoiceUrl: text("invoice_url"),
  asaasCustomerId: varchar("asaas_customer_id", { length: 120 }),
  asaasSubscriptionId: varchar("asaas_subscription_id", { length: 120 }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  paymentIdx: uniqueIndex("checkout_payments_asaas_payment_idx").on(table.asaasPaymentId),
  sessionIdx: index("checkout_payments_session_idx").on(table.sessionId),
}));

export const whatsappTemplates = pgTable("whatsapp_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  clinicId: uuid("clinic_id").notNull().references(() => clinics.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 80 }).$type<WhatsappTemplateName>().notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  clinicNameIdx: uniqueIndex("whatsapp_templates_clinic_name_idx").on(table.clinicId, table.name),
}));

export const whatsappLogs = pgTable("whatsapp_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  clinicId: uuid("clinic_id").notNull().references(() => clinics.id, { onDelete: "cascade" }),
  phone: varchar("phone", { length: 24 }).notNull(),
  templateName: varchar("template_name", { length: 80 }).$type<WhatsappTemplateName>().notNull(),
  status: varchar("status", { length: 40 }).notNull(),
  response: text("response").notNull().default(""),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  clinicSentIdx: index("whatsapp_logs_clinic_sent_idx").on(table.clinicId, table.sentAt),
}));
