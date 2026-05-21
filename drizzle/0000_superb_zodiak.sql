CREATE TYPE "public"."appointment_status" AS ENUM('scheduled', 'confirmed', 'cancelled', 'completed', 'no-show');--> statement-breakpoint
CREATE TYPE "public"."appointment_type" AS ENUM('consultation', 'return', 'exam', 'procedure');--> statement-breakpoint
CREATE TYPE "public"."billing_provider" AS ENUM('asaas', 'stripe');--> statement-breakpoint
CREATE TYPE "public"."cash_flow_type" AS ENUM('income', 'expense');--> statement-breakpoint
CREATE TYPE "public"."clinic_plan" AS ENUM('starter', 'pro', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('M', 'F', 'O');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'credit', 'debit', 'pix', 'insurance', 'courtesy');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'partial', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('OWNER', 'ADMIN', 'RECEPTIONIST');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('trialing', 'active', 'past_due', 'cancelled', 'blocked');--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"patient_name" varchar(180) NOT NULL,
	"doctor_id" uuid NOT NULL,
	"doctor_name" varchar(180) NOT NULL,
	"specialty" varchar(120) NOT NULL,
	"date" date NOT NULL,
	"time" time NOT NULL,
	"duration" integer NOT NULL,
	"status" "appointment_status" DEFAULT 'scheduled' NOT NULL,
	"payment_status" "payment_status" DEFAULT 'pending' NOT NULL,
	"type" "appointment_type" NOT NULL,
	"exam_type" varchar(160),
	"notes" text DEFAULT '' NOT NULL,
	"whatsapp_sent" boolean DEFAULT false NOT NULL,
	"insurance_id" uuid,
	"insurance_name" varchar(180),
	"discount_percent" integer DEFAULT 0 NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"payment_method" "payment_method",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid,
	"provider" "billing_provider" DEFAULT 'asaas' NOT NULL,
	"provider_event_id" varchar(160) NOT NULL,
	"event_type" varchar(120) NOT NULL,
	"payload" jsonb NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cash_flow" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"type" "cash_flow_type" NOT NULL,
	"category" varchar(120) NOT NULL,
	"description" text NOT NULL,
	"amount" integer NOT NULL,
	"date" date NOT NULL,
	"payment_method" varchar(80) NOT NULL,
	"reference_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(180) NOT NULL,
	"cnpj" varchar(14) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"email" varchar(180) NOT NULL,
	"address" jsonb NOT NULL,
	"logo_url" text DEFAULT '' NOT NULL,
	"logo_public_id" text DEFAULT '' NOT NULL,
	"primary_color" varchar(20) DEFAULT '#6B8CAE' NOT NULL,
	"whatsapp_token" text DEFAULT '' NOT NULL,
	"whatsapp_phone" varchar(20) DEFAULT '' NOT NULL,
	"whatsapp_api_url" text DEFAULT '' NOT NULL,
	"plan" "clinic_plan" DEFAULT 'starter' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "doctors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"name" varchar(180) NOT NULL,
	"crm" varchar(40) NOT NULL,
	"specialty" varchar(120) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"email" varchar(180) NOT NULL,
	"photo_url" text DEFAULT '' NOT NULL,
	"photo_public_id" text DEFAULT '' NOT NULL,
	"consultation_price" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"work_days" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"work_dates" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"periods" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"vacations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"name" varchar(180) NOT NULL,
	"type" varchar(120) NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"laboratory" varchar(180) DEFAULT '' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insurances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"name" varchar(180) NOT NULL,
	"ans_code" varchar(40) DEFAULT '' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"coverage_rules" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"name" varchar(180) NOT NULL,
	"cpf" varchar(11) NOT NULL,
	"birth_date" date NOT NULL,
	"phone" varchar(20) NOT NULL,
	"email" varchar(180) NOT NULL,
	"address" jsonb NOT NULL,
	"gender" "gender" NOT NULL,
	"health_insurance" varchar(180) DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"appointment_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"patient_name" varchar(180) NOT NULL,
	"doctor_id" uuid NOT NULL,
	"doctor_name" varchar(180) NOT NULL,
	"specialty" varchar(120) NOT NULL,
	"date" date NOT NULL,
	"amount" integer NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"insurance_id" uuid,
	"insurance_name" varchar(180),
	"insurance_coverage" integer DEFAULT 0 NOT NULL,
	"patient_copay" integer DEFAULT 0 NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"doctor_id" uuid NOT NULL,
	"date" date NOT NULL,
	"slots" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "specialties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"name" varchar(180) NOT NULL,
	"color" varchar(20) DEFAULT '#6B8CAE' NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"provider" "billing_provider" DEFAULT 'asaas' NOT NULL,
	"provider_customer_id" varchar(120) DEFAULT '' NOT NULL,
	"provider_subscription_id" varchar(120) DEFAULT '' NOT NULL,
	"status" "subscription_status" DEFAULT 'trialing' NOT NULL,
	"plan" "clinic_plan" DEFAULT 'starter' NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"next_due_date" date,
	"current_period_end" date,
	"trial_ends_at" timestamp with time zone,
	"blocked_at" timestamp with time zone,
	"last_event_id" varchar(160),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firebase_uid" varchar(128) NOT NULL,
	"clinic_id" uuid NOT NULL,
	"role" "role" NOT NULL,
	"name" varchar(180) NOT NULL,
	"email" varchar(180) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_events" ADD CONSTRAINT "billing_events_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_flow" ADD CONSTRAINT "cash_flow_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_types" ADD CONSTRAINT "exam_types_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insurances" ADD CONSTRAINT "insurances_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "specialties" ADD CONSTRAINT "specialties_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appointments_clinic_date_status_idx" ON "appointments" USING btree ("clinic_id","date","status");--> statement-breakpoint
CREATE INDEX "appointments_clinic_doctor_date_idx" ON "appointments" USING btree ("clinic_id","doctor_id","date");--> statement-breakpoint
CREATE INDEX "appointments_clinic_payment_date_idx" ON "appointments" USING btree ("clinic_id","payment_status","date");--> statement-breakpoint
CREATE INDEX "appointments_clinic_whatsapp_date_idx" ON "appointments" USING btree ("clinic_id","whatsapp_sent","date");--> statement-breakpoint
CREATE UNIQUE INDEX "billing_events_provider_event_idx" ON "billing_events" USING btree ("provider","provider_event_id");--> statement-breakpoint
CREATE INDEX "billing_events_clinic_processed_idx" ON "billing_events" USING btree ("clinic_id","processed_at");--> statement-breakpoint
CREATE INDEX "cash_flow_clinic_date_type_idx" ON "cash_flow" USING btree ("clinic_id","date","type");--> statement-breakpoint
CREATE UNIQUE INDEX "clinics_cnpj_idx" ON "clinics" USING btree ("cnpj");--> statement-breakpoint
CREATE INDEX "doctors_clinic_active_specialty_idx" ON "doctors" USING btree ("clinic_id","active","specialty");--> statement-breakpoint
CREATE UNIQUE INDEX "doctors_clinic_crm_idx" ON "doctors" USING btree ("clinic_id","crm");--> statement-breakpoint
CREATE INDEX "exam_types_clinic_active_name_idx" ON "exam_types" USING btree ("clinic_id","active","name");--> statement-breakpoint
CREATE INDEX "insurances_clinic_active_name_idx" ON "insurances" USING btree ("clinic_id","active","name");--> statement-breakpoint
CREATE INDEX "patients_clinic_active_created_idx" ON "patients" USING btree ("clinic_id","active","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "patients_clinic_cpf_idx" ON "patients" USING btree ("clinic_id","cpf");--> statement-breakpoint
CREATE INDEX "payments_clinic_date_status_idx" ON "payments" USING btree ("clinic_id","date","status");--> statement-breakpoint
CREATE INDEX "payments_clinic_doctor_date_idx" ON "payments" USING btree ("clinic_id","doctor_id","date");--> statement-breakpoint
CREATE INDEX "payments_clinic_insurance_date_idx" ON "payments" USING btree ("clinic_id","insurance_id","date");--> statement-breakpoint
CREATE INDEX "payments_clinic_status_created_idx" ON "payments" USING btree ("clinic_id","status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "schedules_clinic_doctor_date_idx" ON "schedules" USING btree ("clinic_id","doctor_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "specialties_clinic_name_idx" ON "specialties" USING btree ("clinic_id","name");--> statement-breakpoint
CREATE INDEX "specialties_clinic_order_idx" ON "specialties" USING btree ("clinic_id","order");--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_clinic_idx" ON "subscriptions" USING btree ("clinic_id");--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_provider_subscription_idx" ON "subscriptions" USING btree ("provider","provider_subscription_id");--> statement-breakpoint
CREATE INDEX "subscriptions_status_idx" ON "subscriptions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "users_firebase_uid_idx" ON "users" USING btree ("firebase_uid");--> statement-breakpoint
CREATE UNIQUE INDEX "users_clinic_email_idx" ON "users" USING btree ("clinic_id","email");--> statement-breakpoint
CREATE INDEX "users_clinic_role_idx" ON "users" USING btree ("clinic_id","role");