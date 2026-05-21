import { formatWhatsAppPhone } from "../utils/masks";
import { formatDateBR } from "../utils/date";
import { formatMoney } from "../utils/money";
import type {
  Appointment,
  Clinic,
  WhatsappTemplate,
  WhatsappTemplateName,
  WhatsappVariables,
  WhatsappConnectionResult,
  WhatsappSendResult,
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

export const getTemplates = async (
  _clinicId: string,
): Promise<WhatsappTemplate[]> => {
  const response = await fetch("/api/whatsapp/templates", {
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error("Não foi possível carregar templates");
  }

  const payload = (await response.json()) as { templates: WhatsappTemplate[] };
  return payload.templates;
};

export const updateTemplate = async (
  _clinicId: string,
  templateName: WhatsappTemplateName,
  content: string,
): Promise<void> => {
  const response = await fetch("/api/whatsapp/templates", {
    method: "PATCH",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: templateName,
      content,
    }),
  });

  if (!response.ok) {
    throw new Error("Não foi possível salvar template");
  }
};

export const sendMessage = async (
  clinicId: string,
  phone: string,
  templateName: WhatsappTemplateName,
  variables: WhatsappVariables,
): Promise<WhatsappSendResult> => {
  const response = await fetch("/api/whatsapp/send", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      clinicId,
      phone,
      templateName,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error("Não foi possível enviar WhatsApp");
  }

  return (await response.json()) as WhatsappSendResult;
};

export const testConnection = async (
  clinicId: string,
): Promise<WhatsappConnectionResult> => {
  const response = await fetch("/api/whatsapp/test", {
    method: "POST",
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error("Não foi possível testar conexão");
  }

  return (await response.json()) as WhatsappConnectionResult;
};
