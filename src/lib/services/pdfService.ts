import { formatDateBR } from "../utils/date";
import { sentenceCase } from "../utils/labels";
import { maskCnpj, maskPhone } from "../utils/masks";
import { formatMoney } from "../utils/money";
import { drawClinicLogo } from "../utils/pdfLogo";
import type { Clinic, DateRange, ReportData, ReportRow } from "../types";

const moneyColumns = new Set([
  "amount",
  "valor",
  "total",
  "receita",
  "ticketMedio",
  "cobertura",
  "copay",
  "desconto",
]);

const buildClinicAddress = (clinic: Clinic | null): string => {
  if (clinic === null) {
    return "";
  }

  return [
    clinic.address.street,
    clinic.address.number,
    clinic.address.neighborhood,
    clinic.address.city,
    clinic.address.state,
  ]
    .filter((item) => item.trim().length > 0)
    .join(", ");
};

const formatReportCell = (
  row: ReportRow,
  column: string,
): string => {
  const value = row[column];
  if (typeof value === "number") {
    return moneyColumns.has(column) ? formatMoney(value) : String(value);
  }

  if (typeof value === "boolean") {
    return value ? "Sim" : "Não";
  }

  return String(value ?? "");
};

export const generateReportPDF = async (
  clinic: Clinic | null,
  type: string,
  data: ReportData,
  filters: { dateRange: DateRange },
): Promise<Blob> => {
  const jsPDF = (await import("jspdf")).default;
  const autoTable = (await import("jspdf-autotable")).default;
  const pdf = new jsPDF();
  const columns = Object.keys(data.rows[0] ?? { mensagem: "Sem dados" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const title = data.title || type;
  const clinicName = clinic?.name ?? "Clínica";
  const clinicDetails = [
    clinic?.cnpj !== undefined && clinic.cnpj.length > 0
      ? `CNPJ: ${maskCnpj(clinic.cnpj)}`
      : "",
    clinic?.phone !== undefined && clinic.phone.length > 0
      ? `Telefone: ${maskPhone(clinic.phone)}`
      : "",
    clinic?.email ?? "",
  ].filter((item) => item.trim().length > 0);
  const clinicAddress = buildClinicAddress(clinic);

  pdf.setFillColor(247, 245, 242);
  pdf.rect(0, 0, pageWidth, 42, "F");
  await drawClinicLogo(pdf, clinic?.logoUrl, 14, 7, 26, 26);
  pdf.setTextColor(44, 44, 42);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  pdf.text(clinicName, pageWidth / 2, 13, { align: "center" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.text(clinicDetails.join("  |  "), pageWidth / 2, 20, { align: "center" });
  if (clinicAddress.length > 0) {
    pdf.text(clinicAddress, pageWidth / 2, 26, { align: "center" });
  }
  pdf.setDrawColor(229, 226, 220);
  pdf.line(14, 42, pageWidth - 14, 42);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.text(title, 14, 54);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text(
    `Período: ${formatDateBR(filters.dateRange.from)} a ${formatDateBR(filters.dateRange.to)}`,
    14,
    61,
  );
  autoTable(pdf, {
    startY: 70,
    head: [columns.map((column) => sentenceCase(column))],
    body:
      data.rows.length > 0
        ? data.rows.map((row) =>
            columns.map((column) => formatReportCell(row, column)),
          )
        : [["Sem dados"]],
    headStyles: {
      fillColor: [107, 140, 174],
      fontStyle: "bold",
      textColor: [255, 255, 255],
    },
    alternateRowStyles: {
      fillColor: [247, 245, 242],
    },
    styles: {
      cellPadding: 3,
      fontSize: 9,
      lineColor: [229, 226, 220],
      lineWidth: 0.1,
      textColor: [44, 44, 42],
    },
    margin: {
      left: 14,
      right: 14,
    },
  });

  return pdf.output("blob");
};

export const generateInsuranceRepasse = async (
  clinic: Clinic | null,
  insuranceId: string,
  dateRange: DateRange,
  data: ReportData,
): Promise<Blob> => {
  return await generateReportPDF(clinic, `Repasse ${insuranceId}`, data, {
    dateRange,
  });
};
