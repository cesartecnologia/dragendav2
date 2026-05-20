import type { Appointment, Clinic } from "../types";
import { formatDateBR } from "./date";
import { formatMoneyWithWords } from "./money";
import { maskCnpj, maskPhone } from "./masks";

const statusLabels: Record<string, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  completed: "Concluído",
  "no-show": "Não compareceu",
  pending: "Pendente",
  paid: "Pago",
  partial: "Parcial",
  refunded: "Reembolsado",
};

const paymentMethodLabels: Record<string, string> = {
  cash: "Dinheiro",
  credit: "Crédito",
  debit: "Débito",
  pix: "Pix",
  insurance: "Convênio",
  courtesy: "Cortesia",
};

const formatAttendantName = (value: string): string => {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return "Funcionário não identificado";
  }

  if (/^[A-Za-z0-9]{20,}$/.test(trimmed) && !trimmed.includes(" ")) {
    return "Funcionário não identificado";
  }

  return trimmed;
};

const formatClinicAddress = (clinic: Clinic | null): string => {
  if (clinic === null) {
    return "";
  }

  const parts = [
    clinic.address.street,
    clinic.address.number,
    clinic.address.neighborhood,
    clinic.address.city,
    clinic.address.state,
  ].filter((part) => part.trim().length > 0);

  return parts.join(", ");
};

export const generateAppointmentReceiptPdf = async (
  appointment: Appointment,
  clinic: Clinic | null,
): Promise<void> => {
  const jsPDF = (await import("jspdf")).default;
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const centerX = pageWidth / 2;
  const clinicDetails = [
    clinic?.cnpj !== undefined && clinic.cnpj.trim().length > 0
      ? `CNPJ: ${maskCnpj(clinic.cnpj)}`
      : "",
    clinic?.phone !== undefined && clinic.phone.trim().length > 0
      ? `Telefone: ${maskPhone(clinic.phone)}`
      : "",
  ].filter((item) => item.trim().length > 0);
  const clinicAddress = formatClinicAddress(clinic);
  let y = 54;

  pdf.setFillColor(247, 245, 242);
  pdf.rect(0, 0, pageWidth, 42, "F");
  pdf.setTextColor(44, 44, 42);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  pdf.text(clinic?.name ?? "Clínica", centerX, 13, { align: "center" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.text(clinicDetails.join("  |  "), centerX, 20, { align: "center" });
  if (clinicAddress.length > 0) {
    pdf.text(clinicAddress, centerX, 26, { align: "center" });
  }
  pdf.setDrawColor(229, 226, 220);
  pdf.line(14, 42, pageWidth - 14, 42);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(44, 44, 42);
  pdf.setFontSize(13);
  pdf.text("Comprovante de agendamento", 18, y);
  y += 7;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(107, 105, 102);
  pdf.text("Documento gerado automaticamente para confirmação do atendimento", 18, y);
  y += 10;

  const rows: Array<[string, string]> = [
    ["Paciente", appointment.patientName],
    ["Médico(a)", appointment.doctorName],
    ["Especialidade", appointment.specialty],
    ["Data e horário", `${formatDateBR(appointment.date)} às ${appointment.time}`],
    ["Tipo", appointment.type === "return" ? "Retorno" : appointment.type === "exam" ? "Exame" : appointment.type === "procedure" ? "Procedimento" : "Consulta"],
    ["Convênio", appointment.insuranceName ?? "Particular"],
    ["Status do agendamento", statusLabels[appointment.status] ?? appointment.status],
    ["Status do pagamento", statusLabels[appointment.paymentStatus] ?? appointment.paymentStatus],
    ["Forma de pagamento", appointment.paymentMethod === null ? "Pagar depois" : paymentMethodLabels[appointment.paymentMethod] ?? appointment.paymentMethod],
    ["Agendado por", formatAttendantName(appointment.createdBy)],
    ["Valor", formatMoneyWithWords(appointment.amount)],
  ];

  const detailBoxY = y;
  const rowHeight = 8;
  const detailBoxHeight = rows.length * rowHeight + 18;
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(229, 226, 220);
  pdf.roundedRect(18, detailBoxY, pageWidth - 36, detailBoxHeight, 2, 2, "FD");
  y += 10;

  pdf.setFontSize(11);
  rows.forEach(([label, value]) => {
    pdf.setTextColor(44, 44, 42);
    pdf.setFont("helvetica", "bold");
    pdf.text(`${label}:`, 24, y);
    pdf.setTextColor(107, 105, 102);
    pdf.setFont("helvetica", "normal");
    pdf.text(value, 72, y);
    y += rowHeight;
  });

  y = detailBoxY + detailBoxHeight + 10;
  pdf.setFillColor(107, 140, 174);
  pdf.roundedRect(18, y, pageWidth - 36, 22, 3, 3, "F");
  y += 8;
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text("Orientação ao paciente", 24, y);
  y += 7;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text("Chegue com 15 minutos de antecedência para fazer sua recepção com tranquilidade.", 24, y);

  if (appointment.notes.trim().length > 0) {
    y += 16;
    pdf.setTextColor(44, 44, 42);
    pdf.setFont("helvetica", "bold");
    pdf.text("Observações:", 24, y);
    y += 7;
    pdf.setTextColor(107, 105, 102);
    pdf.setFont("helvetica", "normal");
    const notes = pdf.splitTextToSize(appointment.notes, pageWidth - 48) as string[];
    pdf.text(notes, 24, y);
    y += notes.length * 6;
  }

  y += 16;
  pdf.setDrawColor(229, 226, 220);
  pdf.line(52, y, pageWidth - 52, y);
  y += 6;
  pdf.setFontSize(9);
  pdf.setTextColor(107, 105, 102);
  pdf.text("Assinatura / confirmação", centerX, y, { align: "center" });

  const blobUrl = URL.createObjectURL(pdf.output("blob"));
  window.open(blobUrl, "_blank", "noopener,noreferrer");
};
