import type { QueryDocumentSnapshot } from "firebase/firestore";
import type {
  PaginatedResult,
  Payment,
  PaymentFilters,
  RevenueByDoctor,
  RevenueByInsurance,
  RevenueByMethod,
  RevenueByPeriod,
  RevenueSummary,
} from "../types";
import { formatMoney } from "../utils/money";
import { callDataService } from "./rpcClient";

export type PaymentCreateInput = Omit<Payment, "id" | "clinicId" | "createdAt">;

export const getRevenueSummary = async (
  clinicId: string,
  dateRange: { from: Date; to: Date },
): Promise<RevenueSummary> =>
  await callDataService<RevenueSummary>("financial", "getRevenueSummary", [clinicId, dateRange]);

export const getRevenueByDay = async (
  clinicId: string,
  dateRange: { from: Date; to: Date },
): Promise<RevenueByPeriod[]> =>
  await callDataService<RevenueByPeriod[]>("financial", "getRevenueByDay", [clinicId, dateRange]);

export const getRevenueByDoctor = async (
  clinicId: string,
  dateRange: { from: Date; to: Date },
): Promise<RevenueByDoctor[]> =>
  await callDataService<RevenueByDoctor[]>("financial", "getRevenueByDoctor", [clinicId, dateRange]);

export const getRevenueByInsurance = async (
  clinicId: string,
  dateRange: { from: Date; to: Date },
): Promise<RevenueByInsurance[]> =>
  await callDataService<RevenueByInsurance[]>("financial", "getRevenueByInsurance", [clinicId, dateRange]);

export const getRevenueByMethod = async (
  clinicId: string,
  dateRange: { from: Date; to: Date },
): Promise<RevenueByMethod[]> =>
  await callDataService<RevenueByMethod[]>("financial", "getRevenueByMethod", [clinicId, dateRange]);

export const getPaymentsPaginated = async (
  clinicId: string,
  filters: PaymentFilters,
  lastDoc: QueryDocumentSnapshot<Payment> | null,
): Promise<PaginatedResult<Payment>> =>
  await callDataService<PaginatedResult<Payment>>("financial", "getPaymentsPaginated", [
    clinicId,
    filters,
    lastDoc,
  ]);

export const getPendingPayments = async (
  clinicId: string,
  daysOverdue: number,
): Promise<Payment[]> =>
  await callDataService<Payment[]>("financial", "getPendingPayments", [clinicId, daysOverdue]);

export const registerPayment = async (
  clinicId: string,
  data: PaymentCreateInput,
): Promise<Payment> =>
  await callDataService<Payment>("financial", "registerPayment", [clinicId, data]);

export const updatePayment = async (
  clinicId: string,
  id: string,
  data: Partial<Payment>,
): Promise<void> => {
  await callDataService<void>("financial", "updatePayment", [clinicId, id, data]);
};

export const bulkMarkAsPaid = async (
  clinicId: string,
  paymentIds: string[],
): Promise<void> => {
  await callDataService<void>("financial", "bulkMarkAsPaid", [clinicId, paymentIds]);
};

export const exportFinancialCSV = (
  clinicId: string,
  data: Payment[],
): string => {
  const header = "Data,Paciente,Médico,Especialidade,Valor,Forma,Status";
  const rows = data.map((payment) =>
    [
      payment.date,
      payment.patientName,
      payment.doctorName,
      payment.specialty,
      formatMoney(payment.amount),
      payment.paymentMethod,
      payment.status,
    ].join(","),
  );
  return [header, ...rows, `Clínica,${clinicId}`].join("\n");
};

export const exportFinancialPDF = async (
  clinicId: string,
  filters: PaymentFilters,
  data: Payment[],
): Promise<Blob> => {
  const jsPDF = (await import("jspdf")).default;
  const autoTable = (await import("jspdf-autotable")).default;
  const pdf = new jsPDF();
  const period =
    filters.dateRange === undefined
      ? "Período não informado"
      : `${filters.dateRange.from.toLocaleDateString("pt-BR")} a ${filters.dateRange.to.toLocaleDateString("pt-BR")}`;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  pdf.text("Relatório financeiro", 105, 16, { align: "center" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text(`Clínica: ${clinicId}`, 105, 22, { align: "center" });
  pdf.text(period, 105, 27, { align: "center" });
  autoTable(pdf, {
    startY: 36,
    head: [["Data", "Paciente", "Médico", "Especialidade", "Valor", "Forma", "Status"]],
    body: data.map((payment) => [
      payment.date,
      payment.patientName,
      payment.doctorName,
      payment.specialty,
      formatMoney(payment.amount),
      payment.paymentMethod,
      payment.status,
    ]),
    styles: { font: "helvetica", fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [107, 140, 174], textColor: [255, 255, 255] },
  });

  return pdf.output("blob");
};
