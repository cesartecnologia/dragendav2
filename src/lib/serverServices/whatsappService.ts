import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { whatsappLogs, whatsappTemplates } from "../db/schema";
import { getClinicById } from "./clinicService";
import { formatWhatsAppPhone } from "../utils/masks";
import {
  defaultWhatsappTemplates,
} from "../services/whatsappService";
import type {
  WhatsappConnectionResult,
  WhatsappSendResult,
  WhatsappTemplate,
  WhatsappTemplateName,
  WhatsappVariables,
} from "../types";

type WhatsAppApiResponse = {
  key?: {
    id?: string;
  };
  messageId?: string;
  id?: string;
};

const applyVariables = (
  template: string,
  variables: WhatsappVariables,
): string => {
  return Object.entries(variables).reduce(
    (message, [key, value]) => message.replaceAll(`{${key}}`, value),
    template,
  );
};

export const getTemplates = async (
  clinicId: string,
): Promise<WhatsappTemplate[]> => {
  const rows = await getDb()
    .select()
    .from(whatsappTemplates)
    .where(eq(whatsappTemplates.clinicId, clinicId));

  if (rows.length === 0) {
    return defaultWhatsappTemplates;
  }

  const templates = new Map<WhatsappTemplateName, WhatsappTemplate>();

  defaultWhatsappTemplates.forEach((template) => {
    templates.set(template.name, template);
  });

  rows.forEach((row) => {
    templates.set(row.name, {
      name: row.name,
      content: row.content,
    });
  });

  return Array.from(templates.values());
};

export const updateTemplate = async (
  clinicId: string,
  templateName: WhatsappTemplateName,
  content: string,
): Promise<void> => {
  await getDb()
    .insert(whatsappTemplates)
    .values({
      clinicId,
      name: templateName,
      content,
    })
    .onConflictDoUpdate({
      target: [whatsappTemplates.clinicId, whatsappTemplates.name],
      set: {
        content,
        updatedAt: new Date(),
      },
    });
};

export const sendMessage = async (
  clinicId: string,
  phone: string,
  templateName: WhatsappTemplateName,
  variables: WhatsappVariables,
): Promise<WhatsappSendResult> => {
  const clinic = await getClinicById(clinicId);

  if (clinic === null) {
    throw new Error("Clínica não encontrada");
  }

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
  const payload = (await response.json().catch(
    (): WhatsAppApiResponse => ({}),
  )) as WhatsAppApiResponse;
  const messageId = payload.key?.id ?? payload.messageId ?? payload.id ?? "";

  await getDb().insert(whatsappLogs).values({
    clinicId,
    phone: formatWhatsAppPhone(phone),
    templateName,
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
  const clinic = await getClinicById(clinicId);

  if (clinic === null) {
    throw new Error("Clínica não encontrada");
  }

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
