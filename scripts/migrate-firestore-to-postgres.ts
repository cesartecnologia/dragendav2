import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getDb } from "../src/lib/db";
import {
  appointments,
  clinics,
  doctors,
  examTypes,
  insurances,
  patients,
  payments,
  schedules,
  specialties,
  users,
  whatsappLogs,
  whatsappTemplates,
} from "../src/lib/db/schema";
import type {
  Address,
  AppointmentStatus,
  AppointmentType,
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
} from "../src/lib/types";

type FirestoreRecord = Record<string, unknown>;

type ServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
};

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const loadLocalEnv = (): void => {
  const envPath = resolve(process.cwd(), ".env.local");

  if (!existsSync(envPath)) {
    return;
  }

  readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .forEach((line) => {
      const trimmed = line.trim();

      if (trimmed.length === 0 || trimmed.startsWith("#")) {
        return;
      }

      const separatorIndex = trimmed.indexOf("=");

      if (separatorIndex === -1) {
        return;
      }

      const key = trimmed.slice(0, separatorIndex);
      const value = trimmed.slice(separatorIndex + 1);

      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    });
};

const requireEnv = (key: string): string => {
  const value = process.env[key];

  if (value === undefined || value.trim().length === 0) {
    throw new Error(`${key} não configurada`);
  }

  return value;
};

const deterministicUuid = (namespace: string, value: string): string => {
  const hex = createHash("sha1").update(`${namespace}:${value}`).digest("hex").slice(0, 32);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `5${hex.slice(13, 16)}`,
    `${((Number.parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, "0")}${hex.slice(18, 20)}`,
    hex.slice(20, 32),
  ].join("-");
};

const toUuid = (namespace: string, value: string): string =>
  uuidRegex.test(value) ? value : deterministicUuid(namespace, value);

const stringValue = (data: FirestoreRecord, key: string, fallback = ""): string => {
  const value = data[key];
  return typeof value === "string" ? value : fallback;
};

const numberValue = (data: FirestoreRecord, key: string, fallback = 0): number => {
  const value = data[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
};

const booleanValue = (data: FirestoreRecord, key: string, fallback = true): boolean => {
  const value = data[key];
  return typeof value === "boolean" ? value : fallback;
};

const dateValue = (data: FirestoreRecord, key: string): Date | undefined => {
  const value = data[key];

  if (value instanceof Timestamp) {
    return value.toDate();
  }

  if (value instanceof Date) {
    return value;
  }

  return undefined;
};

const arrayValue = <TValue>(data: FirestoreRecord, key: string): TValue[] => {
  const value = data[key];
  return Array.isArray(value) ? (value as TValue[]) : [];
};

const objectValue = <TValue extends object>(
  data: FirestoreRecord,
  key: string,
  fallback: TValue,
): TValue => {
  const value = data[key];
  return typeof value === "object" && value !== null ? (value as TValue) : fallback;
};

const emptyAddress: Address = {
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
};

const initFirebaseAdmin = (): void => {
  if (getApps().length > 0) {
    return;
  }

  const raw = requireEnv("FIREBASE_SERVICE_ACCOUNT_JSON");
  const serviceAccount = JSON.parse(raw) as ServiceAccount;

  initializeApp({
    credential: cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key.replace(/\\n/g, "\n"),
    }),
  });
};

const migrate = async (): Promise<void> => {
  loadLocalEnv();
  requireEnv("DATABASE_URL");
  initFirebaseAdmin();

  const firestore = getFirestore();
  const db = getDb();
  const userNameByFirebaseUid = new Map<string, string>();
  const userClinicByFirebaseUid = new Map<string, string>();
  const clinicSnapshots = await firestore.collection("clinics").get();

  for (const clinicSnapshot of clinicSnapshots.docs) {
    const sourceClinicId = clinicSnapshot.id;
    const clinicId = toUuid("clinic", sourceClinicId);
    const data = clinicSnapshot.data() as FirestoreRecord;

    await db
      .insert(clinics)
      .values({
        id: clinicId,
        name: stringValue(data, "name"),
        cnpj: stringValue(data, "cnpj"),
        phone: stringValue(data, "phone"),
        email: stringValue(data, "email"),
        address: objectValue<Address>(data, "address", emptyAddress),
        logoUrl: stringValue(data, "logoUrl"),
        logoPublicId: stringValue(data, "logoPublicId"),
        primaryColor: stringValue(data, "primaryColor", "#6B8CAE"),
        whatsappToken: stringValue(data, "whatsappToken"),
        whatsappPhone: stringValue(data, "whatsappPhone"),
        whatsappApiUrl: stringValue(data, "whatsappApiUrl"),
        plan: stringValue(data, "plan", "starter") as ClinicPlan,
        active: booleanValue(data, "active"),
        createdAt: dateValue(data, "createdAt") ?? new Date(),
      })
      .onConflictDoUpdate({
        target: clinics.id,
        set: {
          name: stringValue(data, "name"),
          cnpj: stringValue(data, "cnpj"),
          phone: stringValue(data, "phone"),
          email: stringValue(data, "email"),
          address: objectValue<Address>(data, "address", emptyAddress),
          logoUrl: stringValue(data, "logoUrl"),
          logoPublicId: stringValue(data, "logoPublicId"),
          primaryColor: stringValue(data, "primaryColor", "#6B8CAE"),
          whatsappToken: stringValue(data, "whatsappToken"),
          whatsappPhone: stringValue(data, "whatsappPhone"),
          whatsappApiUrl: stringValue(data, "whatsappApiUrl"),
          plan: stringValue(data, "plan", "starter") as ClinicPlan,
          active: booleanValue(data, "active"),
          updatedAt: new Date(),
        },
      });

    const usersSnapshot = await firestore.collection("users").where("clinicId", "==", sourceClinicId).get();

    for (const userSnapshot of usersSnapshot.docs) {
      const userData = userSnapshot.data() as FirestoreRecord;
      const userName = stringValue(userData, "name");
      userNameByFirebaseUid.set(userSnapshot.id, userName);
      userClinicByFirebaseUid.set(userSnapshot.id, clinicId);

      await db
        .insert(users)
        .values({
          firebaseUid: userSnapshot.id,
          clinicId,
          role: stringValue(userData, "role", "RECEPTIONIST") as Role,
          name: userName,
          email: stringValue(userData, "email"),
          phone: stringValue(userData, "phone"),
          active: booleanValue(userData, "active"),
          createdAt: dateValue(userData, "createdAt") ?? new Date(),
        })
        .onConflictDoUpdate({
          target: users.firebaseUid,
          set: {
            clinicId,
            role: stringValue(userData, "role", "RECEPTIONIST") as Role,
            name: userName,
            email: stringValue(userData, "email"),
            phone: stringValue(userData, "phone"),
            active: booleanValue(userData, "active"),
            updatedAt: new Date(),
          },
        });
    }

    const doctorsSnapshot = await clinicSnapshot.ref.collection("doctors").get();

    for (const doctorSnapshot of doctorsSnapshot.docs) {
      const doctorData = doctorSnapshot.data() as FirestoreRecord;

      await db
        .insert(doctors)
        .values({
          id: toUuid("doctor", `${clinicId}:${doctorSnapshot.id}`),
          clinicId,
          name: stringValue(doctorData, "name"),
          crm: stringValue(doctorData, "crm", doctorSnapshot.id),
          specialty: stringValue(doctorData, "specialty"),
          phone: stringValue(doctorData, "phone"),
          email: stringValue(doctorData, "email"),
          photoUrl: stringValue(doctorData, "photoUrl"),
          photoPublicId: stringValue(doctorData, "photoPublicId"),
          consultationPrice: numberValue(doctorData, "consultationPrice"),
          active: booleanValue(doctorData, "active"),
          workDays: arrayValue<WorkDay>(doctorData, "workDays"),
          workDates: arrayValue<WorkDate>(doctorData, "workDates"),
          periods: arrayValue<ConsultationPeriod>(doctorData, "periods"),
          vacations: arrayValue<Vacation>(doctorData, "vacations"),
          createdAt: dateValue(doctorData, "createdAt") ?? new Date(),
        })
        .onConflictDoUpdate({
          target: doctors.id,
          set: {
            name: stringValue(doctorData, "name"),
            crm: stringValue(doctorData, "crm", doctorSnapshot.id),
            specialty: stringValue(doctorData, "specialty"),
            phone: stringValue(doctorData, "phone"),
            email: stringValue(doctorData, "email"),
            photoUrl: stringValue(doctorData, "photoUrl"),
            photoPublicId: stringValue(doctorData, "photoPublicId"),
            consultationPrice: numberValue(doctorData, "consultationPrice"),
            active: booleanValue(doctorData, "active"),
            workDays: arrayValue<WorkDay>(doctorData, "workDays"),
            workDates: arrayValue<WorkDate>(doctorData, "workDates"),
            periods: arrayValue<ConsultationPeriod>(doctorData, "periods"),
            vacations: arrayValue<Vacation>(doctorData, "vacations"),
            updatedAt: new Date(),
          },
        });
    }

    const patientsSnapshot = await clinicSnapshot.ref.collection("patients").get();

    for (const patientSnapshot of patientsSnapshot.docs) {
      const patientData = patientSnapshot.data() as FirestoreRecord;

      await db
        .insert(patients)
        .values({
          id: toUuid("patient", `${clinicId}:${patientSnapshot.id}`),
          clinicId,
          name: stringValue(patientData, "name"),
          cpf: stringValue(patientData, "cpf", patientSnapshot.id).replace(/\D/g, "").slice(0, 11),
          birthDate: stringValue(patientData, "birthDate", "1900-01-01"),
          phone: stringValue(patientData, "phone"),
          email: stringValue(patientData, "email"),
          address: objectValue<Address>(patientData, "address", emptyAddress),
          gender: stringValue(patientData, "gender", "O") as Gender,
          healthInsurance: stringValue(patientData, "healthInsurance"),
          notes: stringValue(patientData, "notes"),
          active: booleanValue(patientData, "active"),
          createdAt: dateValue(patientData, "createdAt") ?? new Date(),
        })
        .onConflictDoUpdate({
          target: patients.id,
          set: {
            name: stringValue(patientData, "name"),
            cpf: stringValue(patientData, "cpf", patientSnapshot.id).replace(/\D/g, "").slice(0, 11),
            birthDate: stringValue(patientData, "birthDate", "1900-01-01"),
            phone: stringValue(patientData, "phone"),
            email: stringValue(patientData, "email"),
            address: objectValue<Address>(patientData, "address", emptyAddress),
            gender: stringValue(patientData, "gender", "O") as Gender,
            healthInsurance: stringValue(patientData, "healthInsurance"),
            notes: stringValue(patientData, "notes"),
            active: booleanValue(patientData, "active"),
            updatedAt: new Date(),
          },
        });
    }

    const insurancesSnapshot = await clinicSnapshot.ref.collection("insurances").get();

    for (const insuranceSnapshot of insurancesSnapshot.docs) {
      const insuranceData = insuranceSnapshot.data() as FirestoreRecord;

      await db
        .insert(insurances)
        .values({
          id: toUuid("insurance", `${clinicId}:${insuranceSnapshot.id}`),
          clinicId,
          name: stringValue(insuranceData, "name"),
          ansCode: stringValue(insuranceData, "ansCode"),
          discountPercent: numberValue(insuranceData, "discountPercent"),
          active: booleanValue(insuranceData, "active"),
          coverageRules: arrayValue<InsuranceCoverageRule>(insuranceData, "coverageRules"),
          createdAt: dateValue(insuranceData, "createdAt") ?? new Date(),
        })
        .onConflictDoUpdate({
          target: insurances.id,
          set: {
            name: stringValue(insuranceData, "name"),
            ansCode: stringValue(insuranceData, "ansCode"),
            discountPercent: numberValue(insuranceData, "discountPercent"),
            active: booleanValue(insuranceData, "active"),
            coverageRules: arrayValue<InsuranceCoverageRule>(insuranceData, "coverageRules"),
            updatedAt: new Date(),
          },
        });
    }

    const schedulesSnapshot = await clinicSnapshot.ref.collection("schedules").get();

    for (const scheduleSnapshot of schedulesSnapshot.docs) {
      const scheduleData = scheduleSnapshot.data() as FirestoreRecord;
      const sourceDoctorId = stringValue(scheduleData, "doctorId");

      await db
        .insert(schedules)
        .values({
          id: toUuid("schedule", `${clinicId}:${scheduleSnapshot.id}`),
          clinicId,
          doctorId: toUuid("doctor", `${clinicId}:${sourceDoctorId}`),
          date: stringValue(scheduleData, "date", "1900-01-01"),
          slots: arrayValue<Slot>(scheduleData, "slots").map((slot) => ({
            ...slot,
            appointmentId:
              slot.appointmentId === null
                ? null
                : toUuid("appointment", `${clinicId}:${slot.appointmentId}`),
          })),
        })
        .onConflictDoUpdate({
          target: schedules.id,
          set: {
            slots: arrayValue<Slot>(scheduleData, "slots").map((slot) => ({
              ...slot,
              appointmentId:
                slot.appointmentId === null
                  ? null
                  : toUuid("appointment", `${clinicId}:${slot.appointmentId}`),
            })),
            updatedAt: new Date(),
          },
        });
    }

    const specialtiesSnapshot = await clinicSnapshot.ref.collection("specialties").get();

    for (const specialtySnapshot of specialtiesSnapshot.docs) {
      const specialtyData = specialtySnapshot.data() as FirestoreRecord;

      await db
        .insert(specialties)
        .values({
          id: toUuid("specialty", `${clinicId}:${specialtySnapshot.id}`),
          clinicId,
          name: stringValue(specialtyData, "name"),
          color: stringValue(specialtyData, "color", "#6B8CAE"),
          order: numberValue(specialtyData, "order"),
          active: booleanValue(specialtyData, "active"),
          createdAt: dateValue(specialtyData, "createdAt") ?? new Date(),
        })
        .onConflictDoUpdate({
          target: specialties.id,
          set: {
            name: stringValue(specialtyData, "name"),
            color: stringValue(specialtyData, "color", "#6B8CAE"),
            order: numberValue(specialtyData, "order"),
            active: booleanValue(specialtyData, "active"),
            updatedAt: new Date(),
          },
        });
    }

    const examTypesSnapshot = await clinicSnapshot.ref.collection("examTypes").get();

    for (const examSnapshot of examTypesSnapshot.docs) {
      const examData = examSnapshot.data() as FirestoreRecord;

      await db
        .insert(examTypes)
        .values({
          id: toUuid("exam", `${clinicId}:${examSnapshot.id}`),
          clinicId,
          name: stringValue(examData, "name"),
          type: stringValue(examData, "type"),
          amount: numberValue(examData, "amount"),
          laboratory: stringValue(examData, "laboratory"),
          active: booleanValue(examData, "active"),
          createdAt: dateValue(examData, "createdAt") ?? new Date(),
        })
        .onConflictDoUpdate({
          target: examTypes.id,
          set: {
            name: stringValue(examData, "name"),
            type: stringValue(examData, "type"),
            amount: numberValue(examData, "amount"),
            laboratory: stringValue(examData, "laboratory"),
            active: booleanValue(examData, "active"),
            updatedAt: new Date(),
          },
        });
    }

    const appointmentsSnapshot = await clinicSnapshot.ref.collection("appointments").get();

    for (const appointmentSnapshot of appointmentsSnapshot.docs) {
      const appointmentData = appointmentSnapshot.data() as FirestoreRecord;
      const sourcePatientId = stringValue(appointmentData, "patientId");
      const sourceDoctorId = stringValue(appointmentData, "doctorId");
      const createdBy = stringValue(appointmentData, "createdBy");

      await db
        .insert(appointments)
        .values({
          id: toUuid("appointment", `${clinicId}:${appointmentSnapshot.id}`),
          clinicId,
          patientId: toUuid("patient", `${clinicId}:${sourcePatientId}`),
          patientName: stringValue(appointmentData, "patientName"),
          doctorId: toUuid("doctor", `${clinicId}:${sourceDoctorId}`),
          doctorName: stringValue(appointmentData, "doctorName"),
          specialty: stringValue(appointmentData, "specialty"),
          date: stringValue(appointmentData, "date", "1900-01-01"),
          time: stringValue(appointmentData, "time", "00:00"),
          duration: numberValue(appointmentData, "duration", 30),
          status: stringValue(appointmentData, "status", "scheduled") as AppointmentStatus,
          paymentStatus: stringValue(appointmentData, "paymentStatus", "pending") as PaymentStatus,
          type: stringValue(appointmentData, "type", "consultation") as AppointmentType,
          examType: stringValue(appointmentData, "examType") || null,
          notes: stringValue(appointmentData, "notes"),
          whatsappSent: booleanValue(appointmentData, "whatsappSent", false),
          insuranceId: stringValue(appointmentData, "insuranceId")
            ? toUuid("insurance", `${clinicId}:${stringValue(appointmentData, "insuranceId")}`)
            : null,
          insuranceName: stringValue(appointmentData, "insuranceName") || null,
          discountPercent: numberValue(appointmentData, "discountPercent"),
          amount: numberValue(appointmentData, "amount"),
          paymentMethod: stringValue(appointmentData, "paymentMethod") === ""
            ? null
            : stringValue(appointmentData, "paymentMethod") as PaymentMethod,
          createdBy: userNameByFirebaseUid.get(createdBy) ?? createdBy,
          createdAt: dateValue(appointmentData, "createdAt") ?? new Date(),
        })
        .onConflictDoUpdate({
          target: appointments.id,
          set: {
            status: stringValue(appointmentData, "status", "scheduled") as AppointmentStatus,
            paymentStatus: stringValue(appointmentData, "paymentStatus", "pending") as PaymentStatus,
            notes: stringValue(appointmentData, "notes"),
            whatsappSent: booleanValue(appointmentData, "whatsappSent", false),
            updatedAt: new Date(),
          },
        });
    }

    const paymentsSnapshot = await clinicSnapshot.ref.collection("payments").get();

    for (const paymentSnapshot of paymentsSnapshot.docs) {
      const paymentData = paymentSnapshot.data() as FirestoreRecord;
      const sourceAppointmentId = stringValue(paymentData, "appointmentId");
      const sourcePatientId = stringValue(paymentData, "patientId");
      const sourceDoctorId = stringValue(paymentData, "doctorId");
      const createdBy = stringValue(paymentData, "createdBy");

      await db
        .insert(payments)
        .values({
          id: toUuid("payment", `${clinicId}:${paymentSnapshot.id}`),
          clinicId,
          appointmentId: toUuid("appointment", `${clinicId}:${sourceAppointmentId}`),
          patientId: toUuid("patient", `${clinicId}:${sourcePatientId}`),
          patientName: stringValue(paymentData, "patientName"),
          doctorId: toUuid("doctor", `${clinicId}:${sourceDoctorId}`),
          doctorName: stringValue(paymentData, "doctorName"),
          specialty: stringValue(paymentData, "specialty"),
          date: stringValue(paymentData, "date", "1900-01-01"),
          amount: numberValue(paymentData, "amount"),
          paymentMethod: stringValue(paymentData, "paymentMethod", "cash") as PaymentMethod,
          status: stringValue(paymentData, "status", "pending") as PaymentStatus,
          insuranceId: stringValue(paymentData, "insuranceId")
            ? toUuid("insurance", `${clinicId}:${stringValue(paymentData, "insuranceId")}`)
            : null,
          insuranceName: stringValue(paymentData, "insuranceName") || null,
          insuranceCoverage: numberValue(paymentData, "insuranceCoverage"),
          patientCopay: numberValue(paymentData, "patientCopay"),
          notes: stringValue(paymentData, "notes"),
          createdBy: userNameByFirebaseUid.get(createdBy) ?? createdBy,
          createdAt: dateValue(paymentData, "createdAt") ?? new Date(),
        })
        .onConflictDoUpdate({
          target: payments.id,
          set: {
            amount: numberValue(paymentData, "amount"),
            paymentMethod: stringValue(paymentData, "paymentMethod", "cash") as PaymentMethod,
            status: stringValue(paymentData, "status", "pending") as PaymentStatus,
            notes: stringValue(paymentData, "notes"),
            updatedAt: new Date(),
          },
        });
    }

    const templatesSnapshot = await clinicSnapshot.ref
      .collection("settings")
      .doc("whatsapp")
      .collection("templates")
      .get();

    for (const templateSnapshot of templatesSnapshot.docs) {
      const templateData = templateSnapshot.data() as FirestoreRecord;

      await db
        .insert(whatsappTemplates)
        .values({
          clinicId,
          name: stringValue(templateData, "name", templateSnapshot.id) as WhatsappTemplateName,
          content: stringValue(templateData, "content"),
          createdAt: dateValue(templateData, "createdAt") ?? new Date(),
          updatedAt: dateValue(templateData, "updatedAt") ?? new Date(),
        })
        .onConflictDoUpdate({
          target: [whatsappTemplates.clinicId, whatsappTemplates.name],
          set: {
            content: stringValue(templateData, "content"),
            updatedAt: new Date(),
          },
        });
    }

    const logsSnapshot = await clinicSnapshot.ref.collection("whatsappLogs").get();

    for (const logSnapshot of logsSnapshot.docs) {
      const logData = logSnapshot.data() as FirestoreRecord;

      await db.insert(whatsappLogs).values({
        id: toUuid("whatsapp-log", `${clinicId}:${logSnapshot.id}`),
        clinicId,
        phone: stringValue(logData, "phone"),
        templateName: stringValue(logData, "templateName", "custom") as WhatsappTemplateName,
        status: stringValue(logData, "status"),
        response: stringValue(logData, "response"),
        sentAt: dateValue(logData, "sentAt") ?? new Date(),
      }).onConflictDoNothing({
        target: whatsappLogs.id,
      });
    }

    console.log(`Clínica migrada: ${clinicId}`);
  }

  const allUsersSnapshot = await firestore.collection("users").get();

  for (const userSnapshot of allUsersSnapshot.docs) {
    if (userClinicByFirebaseUid.has(userSnapshot.id)) {
      continue;
    }

    const userData = userSnapshot.data() as FirestoreRecord;
    const clinicId = toUuid("clinic", stringValue(userData, "clinicId"));

    await db
      .insert(users)
      .values({
        firebaseUid: userSnapshot.id,
        clinicId,
        role: stringValue(userData, "role", "RECEPTIONIST") as Role,
        name: stringValue(userData, "name"),
        email: stringValue(userData, "email"),
        phone: stringValue(userData, "phone"),
        active: booleanValue(userData, "active"),
        createdAt: dateValue(userData, "createdAt") ?? new Date(),
      })
      .onConflictDoUpdate({
        target: users.firebaseUid,
        set: {
          clinicId,
          role: stringValue(userData, "role", "RECEPTIONIST") as Role,
          name: stringValue(userData, "name"),
          email: stringValue(userData, "email"),
          phone: stringValue(userData, "phone"),
          active: booleanValue(userData, "active"),
          updatedAt: new Date(),
        },
      });
  }
};

migrate()
  .then(() => {
    console.log("Migração Firestore -> Postgres concluída");
  })
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Erro na migração");
    process.exitCode = 1;
  });
