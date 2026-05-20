import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { firestoreDb } from "../firebase/config";
import { clinicDoc } from "../firebase/firestore";
import { formatWhatsAppPhone } from "../utils/masks";
import { formatDateBR } from "../utils/date";
import { formatMoney } from "../utils/money";
import type {
  Appointment,
  Clinic,
  WhatsappConnectionResult,
  WhatsappSendResult,
  WhatsappTemplate,
  WhatsappTemplateName,
  WhatsappVariables,
} from "../types";

export type WhatsAppLinkInput = {
  phone: string;
  message: string;
};

export const buildWhatsAppLink = ({ phone, message }: WhatsAppLinkInput): string => {
  return `https://wa.me/${formatWhatsAppPhone(phone).replace("+", "")}?text=${encodeURIComponent(message)}`;
};

export const buildAppointmentConfirmationMessage = (
  appointment: Appointment,
  clinic: Clinic | null,
): string => {
  const lines = [
    `Olá ${appointment.patientName}! Seu agendamento foi confirmado com sucesso.`,
    "",
    `Data: ${formatDateBR(appointment.date)}`,
    `Horário: ${appointment.time}`,
    `Médico(a): ${appointment.doctorName}`,
    `Especialidade: ${appointment.specialty}`,
    `Valor: ${formatMoney(appointment.amount)}`,
    appointment.insuranceName !== null ? `Convênio: ${appointment.insuranceName}` : "Atendimento: Particular",
    "",
    "Obs.: chegue com 15 minutos de antecedência para fazer sua recepção com tranquilidade.",
    clinic?.phone.trim().length ? `Dúvidas: ${clinic.phone}` : "",
    clinic?.name.trim().length ? clinic.name : "",
  ];

  return lines.filter((line) => line.length > 0).join("\n");
};

export const sendWhatsAppLink = (input: WhatsAppLinkInput): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.open(buildWhatsAppLink(input), "_blank", "noopener,noreferrer");
};

export const defaultWhatsappTemplates: WhatsappTemplate[] = [
  {
    name: "confirmation",
    content:
      "Olá {patient_name}! Seu agendamento foi confirmado com sucesso.\nData: {date} às {time}\nMédico(a): {doctor}\nEspecialidade: {specialty}\nObs.: chegue com 15 minutos de antecedência para fazer sua recepção com tranquilidade.\nDúvidas: {clinic_phone}",
  },
  {
    name: "reminder",
    content:
      "Olá {patient_name}! Lembrete: amanhã você tem consulta.\nData: {date} às {time}\nMédico(a): {doctor}\nPara cancelar ligue: {clinic_phone}",
  },
  {
    name: "cancellation",
    content:
      "Olá {patient_name}, sua consulta do dia {date} às {time}\ncom {doctor} foi cancelada.\nDúvidas: {clinic_phone}",
  },
  {
    name: "payment_reminder",
    content:
      "Olá {patient_name}, sua consulta do dia {date}\ncom {doctor} no valor de R$ {amount} está em aberto.\nPara regularizar: {clinic_phone}",
  },
  {
    name: "custom",
    content: "{message}",
  },
];

const applyVariables = (
  template: string,
  variables: WhatsappVariables,
): string => {
  return Object.entries(variables).reduce(
    (message, [key, value]) => message.replaceAll(`{${key}}`, value),
    template,
  );
};

const getClinic = async (clinicId: string): Promise<Clinic> => {
  const snapshot = await getDoc(clinicDoc(clinicId));

  if (!snapshot.exists()) {
    throw new Error("Clínica não encontrada");
  }

  return { ...snapshot.data(), id: snapshot.id };
};

export const getTemplates = async (
  clinicId: string,
): Promise<WhatsappTemplate[]> => {
  const snapshot = await getDocs(
    collection(firestoreDb, "clinics", clinicId, "settings", "whatsapp", "templates"),
  );

  if (snapshot.empty) {
    return defaultWhatsappTemplates;
  }

  return snapshot.docs.map((item) => item.data() as WhatsappTemplate);
};

export const updateTemplate = async (
  clinicId: string,
  templateName: WhatsappTemplateName,
  content: string,
): Promise<void> => {
  await setDoc(
    doc(
      firestoreDb,
      "clinics",
      clinicId,
      "settings",
      "whatsapp",
      "templates",
      templateName,
    ),
    {
      name: templateName,
      content,
      updatedAt: serverTimestamp(),
    },
  );
};

export const sendMessage = async (
  clinicId: string,
  phone: string,
  templateName: WhatsappTemplateName,
  variables: WhatsappVariables,
): Promise<WhatsappSendResult> => {
  const clinic = await getClinic(clinicId);
  const templates = await getTemplates(clinicId);
  const template = templates.find((item) => item.name === templateName);

  if (template === undefined) {
    throw new Error("Template não encontrado");
  }

  const message = applyVariables(template.content, variables);
  const response = await fetch(`${clinic.whatsappApiUrl}/message/sendText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${clinic.whatsappToken}`,
    },
    body: JSON.stringify({
      number: formatWhatsAppPhone(phone),
      text: message,
    }),
  });
  const payload = (await response.json().catch(() => ({
    key: { id: "" },
  }))) as { key?: { id?: string } };
  const messageId = payload.key?.id ?? "";

  await setDoc(doc(collection(firestoreDb, "clinics", clinicId, "whatsappLogs")), {
    phone: formatWhatsAppPhone(phone),
    templateName,
    sentAt: serverTimestamp(),
    status: response.ok ? "sent" : "error",
    response: messageId,
  });

  return {
    success: response.ok,
    messageId,
  };
};

export const testConnection = async (
  clinicId: string,
): Promise<WhatsappConnectionResult> => {
  const clinic = await getClinic(clinicId);
  const response = await fetch(`${clinic.whatsappApiUrl}/instance/connectionState`, {
    headers: {
      Authorization: `Bearer ${clinic.whatsappToken}`,
    },
  });

  return {
    connected: response.ok,
    phone: clinic.whatsappPhone,
  };
};
