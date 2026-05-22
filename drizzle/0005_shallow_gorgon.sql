CREATE TYPE "public"."checkout_payment_method" AS ENUM('credit_card', 'boleto');--> statement-breakpoint
CREATE TYPE "public"."checkout_session_status" AS ENUM('initiated', 'waiting_payment', 'paid', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."onboarding_status" AS ENUM('locked', 'released', 'processing', 'completed');--> statement-breakpoint
CREATE TABLE "checkout_onboarding" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"status" "onboarding_status" DEFAULT 'locked' NOT NULL,
	"user_id" uuid,
	"clinic_id" uuid,
	"released_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checkout_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid,
	"asaas_payment_id" varchar(120) NOT NULL,
	"status" varchar(80),
	"method" "checkout_payment_method",
	"value" integer,
	"invoice_url" text,
	"asaas_customer_id" varchar(120),
	"asaas_subscription_id" varchar(120),
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checkout_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" varchar(80) DEFAULT 'starter' NOT NULL,
	"plan_name" varchar(120) DEFAULT 'Plano Premium' NOT NULL,
	"value" integer DEFAULT 9990 NOT NULL,
	"payment_method" "checkout_payment_method" NOT NULL,
	"status" "checkout_session_status" DEFAULT 'initiated' NOT NULL,
	"asaas_checkout_id" varchar(120),
	"asaas_payment_link_id" varchar(120),
	"asaas_customer_id" varchar(120),
	"asaas_subscription_id" varchar(120),
	"payment_id" varchar(120),
	"payment_status" varchar(80),
	"checkout_url" text,
	"invoice_url" text,
	"payer_name" varchar(180),
	"payer_email" varchar(180),
	"payer_phone" varchar(30),
	"payer_cpf_cnpj" varchar(20),
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "checkout_onboarding" ADD CONSTRAINT "checkout_onboarding_session_id_checkout_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."checkout_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_onboarding" ADD CONSTRAINT "checkout_onboarding_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_onboarding" ADD CONSTRAINT "checkout_onboarding_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_payments" ADD CONSTRAINT "checkout_payments_session_id_checkout_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."checkout_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "checkout_onboarding_session_idx" ON "checkout_onboarding" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "checkout_onboarding_status_idx" ON "checkout_onboarding" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "checkout_payments_asaas_payment_idx" ON "checkout_payments" USING btree ("asaas_payment_id");--> statement-breakpoint
CREATE INDEX "checkout_payments_session_idx" ON "checkout_payments" USING btree ("session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "checkout_sessions_asaas_checkout_idx" ON "checkout_sessions" USING btree ("asaas_checkout_id");--> statement-breakpoint
CREATE UNIQUE INDEX "checkout_sessions_asaas_payment_link_idx" ON "checkout_sessions" USING btree ("asaas_payment_link_id");--> statement-breakpoint
CREATE INDEX "checkout_sessions_asaas_subscription_idx" ON "checkout_sessions" USING btree ("asaas_subscription_id");--> statement-breakpoint
CREATE INDEX "checkout_sessions_payment_idx" ON "checkout_sessions" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "checkout_sessions_status_idx" ON "checkout_sessions" USING btree ("status");