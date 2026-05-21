ALTER TABLE "appointments" DROP CONSTRAINT "appointments_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "payments" DROP CONSTRAINT "payments_created_by_users_id_fk";
--> statement-breakpoint
DROP INDEX "payments_clinic_status_created_idx";--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "created_by" SET DATA TYPE varchar(180);--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "created_by" SET DATA TYPE varchar(180);