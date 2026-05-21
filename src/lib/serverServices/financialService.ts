import { and, asc, eq, gte, inArray, lte } from "drizzle-orm";
import type { QueryDocumentSnapshot } from "firebase/firestore";
import { getDb } from "../db";
import { nullLastDoc, paymentFromRow } from "../db/mappers";
import { payments } from "../db/schema";
import { formatMoney } from "../utils/money";
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

export type PaymentCreateInput = Omit<Payment, "id" | "clinicId" | "createdAt">;

const dateFromRange = (date: Date | string): string =>
  typeof date === "string" ? date.slice(0, 10) : date.toISOString().slice(0, 10);

const paymentConditions = (clinicId: string, filters: PaymentFilters) => {
  const conditions = [eq(payments.clinicId, clinicId)];

  if (filters.doctorId !== undefined) {
    conditions.push(eq(payments.doctorId, filters.doctorId));
  }

  if (filters.insuranceId !== undefined) {
    conditions.push(eq(payments.insuranceId, filters.insuranceId));
  }

  if (filters.status !== undefined) {
    conditions.push(eq(payments.status, filters.status));
  }

  if (filters.paymentMethod !== undefined) {
    conditions.push(eq(payments.paymentMethod, filters.paymentMethod));
  }

  if (filters.specialty !== undefined) {
    conditions.push(eq(payments.specialty, filters.specialty));
  }

  if (filters.dateRange !== undefined) {
    conditions.push(gte(payments.date, dateFromRange(filters.dateRange.from)));
    conditions.push(lte(payments.date, dateFromRange(filters.dateRange.to)));
  }

  return conditions;
};

const getPaymentsByRange = async (
  clinicId: string,
  filters: PaymentFilters,
): Promise<Payment[]> => {
  const rows = await getDb()
    .select()
    .from(payments)
    .where(and(...paymentConditions(clinicId, filters)))
    .orderBy(asc(payments.date));

  return rows.map(paymentFromRow);
};

export const getRevenueSummary = async (
  clinicId: string,
  dateRange: { from: Date; to: Date },
): Promise<RevenueSummary> => {
  const data = await getPaymentsByRange(clinicId, { dateRange });
  const paid = data.filter((item) => item.status === "paid");
  const pending = data.filter((item) => item.status === "pending");
  const cancelled = data.filter((item) => item.status === "cancelled");
  const totalPaid = paid.reduce((total, item) => total + item.amount, 0);
  const totalPending = pending.reduce((total, item) => total + item.amount, 0);
  const totalCancelled = cancelled.reduce((total, item) => total + item.amount, 0);

  return {
    totalPaid,
    totalPending,
    totalCancelled,
    avgTicket: paid.length > 0 ? Math.round(totalPaid / paid.length) : 0,
    occupancyRate: data.length > 0 ? Math.round((paid.length / data.length) * 100) : 0,
    totalAppointments: data.length,
  };
};

export const getRevenueByDay = async (
  clinicId: string,
  dateRange: { from: Date; to: Date },
): Promise<RevenueByPeriod[]> => {
  const data = await getPaymentsByRange(clinicId, { dateRange });
  const grouped = new Map<string, RevenueByPeriod>();

  data.forEach((payment) => {
    const current =
      grouped.get(payment.date) ??
      { date: payment.date, paid: 0, pending: 0, cancelled: 0 };
    grouped.set(payment.date, {
      ...current,
      paid: current.paid + (payment.status === "paid" ? payment.amount : 0),
      pending: current.pending + (payment.status === "pending" ? payment.amount : 0),
      cancelled: current.cancelled + (payment.status === "cancelled" ? payment.amount : 0),
    });
  });

  return Array.from(grouped.values()).sort((a, b) => a.date.localeCompare(b.date));
};

export const getRevenueByDoctor = async (
  clinicId: string,
  dateRange: { from: Date; to: Date },
): Promise<RevenueByDoctor[]> => {
  const data = await getPaymentsByRange(clinicId, { dateRange });
  const grouped = new Map<string, RevenueByDoctor>();

  data.forEach((payment) => {
    const current =
      grouped.get(payment.doctorId) ??
      {
        doctorId: payment.doctorId,
        doctorName: payment.doctorName,
        total: 0,
        count: 0,
        avgTicket: 0,
      };
    const total = current.total + payment.amount;
    const count = current.count + 1;
    grouped.set(payment.doctorId, {
      ...current,
      total,
      count,
      avgTicket: Math.round(total / count),
    });
  });

  return Array.from(grouped.values());
};

export const getRevenueByInsurance = async (
  clinicId: string,
  dateRange: { from: Date; to: Date },
): Promise<RevenueByInsurance[]> => {
  const data = await getPaymentsByRange(clinicId, { dateRange });
  const grouped = new Map<string, RevenueByInsurance>();

  data.forEach((payment) => {
    const key = payment.insuranceId ?? "particular";
    const current =
      grouped.get(key) ??
      {
        insuranceId: key,
        insuranceName: payment.insuranceName ?? "Particular",
        total: 0,
        coverage: 0,
        copay: 0,
        count: 0,
      };
    grouped.set(key, {
      ...current,
      total: current.total + payment.amount,
      coverage: current.coverage + payment.insuranceCoverage,
      copay: current.copay + payment.patientCopay,
      count: current.count + 1,
    });
  });

  return Array.from(grouped.values());
};

export const getRevenueByMethod = async (
  clinicId: string,
  dateRange: { from: Date; to: Date },
): Promise<RevenueByMethod[]> => {
  const data = await getPaymentsByRange(clinicId, { dateRange });
  const grouped = new Map<string, RevenueByMethod>();

  data.forEach((payment) => {
    const current =
      grouped.get(payment.paymentMethod) ??
      { method: payment.paymentMethod, total: 0, count: 0 };
    grouped.set(payment.paymentMethod, {
      method: payment.paymentMethod,
      total: current.total + payment.amount,
      count: current.count + 1,
    });
  });

  return Array.from(grouped.values());
};

export const getPaymentsPaginated = async (
  clinicId: string,
  filters: PaymentFilters,
  _lastDoc: QueryDocumentSnapshot<Payment> | null,
): Promise<PaginatedResult<Payment>> => {
  const rows = await getDb()
    .select()
    .from(payments)
    .where(and(...paymentConditions(clinicId, filters)))
    .orderBy(asc(payments.date))
    .limit(16);

  return {
    data: rows.slice(0, 15).map(paymentFromRow),
    lastDoc: nullLastDoc<Payment>(),
    hasMore: rows.length > 15,
  };
};

export const getPendingPayments = async (
  clinicId: string,
  daysOverdue: number,
): Promise<Payment[]> => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysOverdue);
  const rows = await getDb()
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.clinicId, clinicId),
        eq(payments.status, "pending"),
        lte(payments.date, cutoff.toISOString().slice(0, 10)),
      ),
    )
    .orderBy(asc(payments.date));

  return rows.map(paymentFromRow);
};

export const registerPayment = async (
  clinicId: string,
  data: PaymentCreateInput,
): Promise<Payment> => {
  const row = (
    await getDb()
      .insert(payments)
      .values({
        clinicId,
        appointmentId: data.appointmentId,
        patientId: data.patientId,
        patientName: data.patientName,
        doctorId: data.doctorId,
        doctorName: data.doctorName,
        specialty: data.specialty,
        date: data.date,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        status: data.status,
        insuranceId: data.insuranceId,
        insuranceName: data.insuranceName,
        insuranceCoverage: data.insuranceCoverage,
        patientCopay: data.patientCopay,
        notes: data.notes,
        createdBy: data.createdBy,
      })
      .returning()
  )[0];

  if (row === undefined) {
    throw new Error("Não foi possível registrar pagamento");
  }

  return paymentFromRow(row);
};

export const updatePayment = async (
  clinicId: string,
  id: string,
  data: Partial<Payment>,
): Promise<void> => {
  await getDb()
    .update(payments)
    .set({
      appointmentId: data.appointmentId,
      patientId: data.patientId,
      patientName: data.patientName,
      doctorId: data.doctorId,
      doctorName: data.doctorName,
      specialty: data.specialty,
      date: data.date,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      status: data.status,
      insuranceId: data.insuranceId,
      insuranceName: data.insuranceName,
      insuranceCoverage: data.insuranceCoverage,
      patientCopay: data.patientCopay,
      notes: data.notes,
      updatedAt: new Date(),
    })
    .where(and(eq(payments.clinicId, clinicId), eq(payments.id, id)));
};

export const bulkMarkAsPaid = async (
  clinicId: string,
  paymentIds: string[],
): Promise<void> => {
  if (paymentIds.length === 0) {
    return;
  }

  await getDb()
    .update(payments)
    .set({ status: "paid", updatedAt: new Date() })
    .where(and(eq(payments.clinicId, clinicId), inArray(payments.id, paymentIds)));
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
  _filters: PaymentFilters,
  data: Payment[],
): Promise<Blob> => {
  const jsPDF = (await import("jspdf")).default;
  const autoTable = (await import("jspdf-autotable")).default;
  const pdf = new jsPDF();
  pdf.text("Relatório financeiro", 14, 16);
  pdf.text(`Clínica: ${clinicId}`, 14, 24);
  autoTable(pdf, {
    head: [["Data", "Paciente", "Médico", "Valor", "Status"]],
    body: data.map((payment) => [
      payment.date,
      payment.patientName,
      payment.doctorName,
      formatMoney(payment.amount),
      payment.status,
    ]),
  });
  return pdf.output("blob");
};
