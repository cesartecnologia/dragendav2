import {
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import {
  addTypedDoc,
  paymentsCollection,
  getPaginatedDocs,
  updateTypedDoc,
} from "../firebase/firestore";
import { firestoreDb } from "../firebase/config";
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

const dateFromRange = (date: Date): string => date.toISOString().slice(0, 10);

const buildPaymentConstraints = (
  clinicId: string,
  filters: PaymentFilters,
): QueryConstraint[] => {
  const constraints: QueryConstraint[] = [where("clinicId", "==", clinicId)];

  if (filters.doctorId !== undefined) {
    constraints.push(where("doctorId", "==", filters.doctorId));
  }

  if (filters.insuranceId !== undefined) {
    constraints.push(where("insuranceId", "==", filters.insuranceId));
  }

  if (filters.status !== undefined) {
    constraints.push(where("status", "==", filters.status));
  }

  if (filters.paymentMethod !== undefined) {
    constraints.push(where("paymentMethod", "==", filters.paymentMethod));
  }

  if (filters.dateRange !== undefined) {
    constraints.push(where("date", ">=", dateFromRange(filters.dateRange.from)));
    constraints.push(where("date", "<=", dateFromRange(filters.dateRange.to)));
  }

  constraints.push(orderBy("date", "asc"));
  return constraints;
};

const getPaymentsByRange = async (
  clinicId: string,
  filters: PaymentFilters,
): Promise<Payment[]> => {
  const snapshot = await getDocs(
    query(paymentsCollection(clinicId), ...buildPaymentConstraints(clinicId, filters)),
  );
  return snapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
};

export const getRevenueSummary = async (
  clinicId: string,
  dateRange: { from: Date; to: Date },
): Promise<RevenueSummary> => {
  const payments = await getPaymentsByRange(clinicId, { dateRange });
  const paid = payments.filter((item) => item.status === "paid");
  const pending = payments.filter((item) => item.status === "pending");
  const cancelled = payments.filter((item) => item.status === "cancelled");
  const totalPaid = paid.reduce((total, item) => total + item.amount, 0);
  const totalPending = pending.reduce((total, item) => total + item.amount, 0);
  const totalCancelled = cancelled.reduce((total, item) => total + item.amount, 0);

  return {
    totalPaid,
    totalPending,
    totalCancelled,
    avgTicket: paid.length > 0 ? Math.round(totalPaid / paid.length) : 0,
    occupancyRate: payments.length > 0 ? Math.round((paid.length / payments.length) * 100) : 0,
    totalAppointments: payments.length,
  };
};

export const getRevenueByDay = async (
  clinicId: string,
  dateRange: { from: Date; to: Date },
): Promise<RevenueByPeriod[]> => {
  const payments = await getPaymentsByRange(clinicId, { dateRange });
  const grouped = new Map<string, RevenueByPeriod>();

  payments.forEach((payment) => {
    const current =
      grouped.get(payment.date) ??
      { date: payment.date, paid: 0, pending: 0, cancelled: 0 };
    grouped.set(payment.date, {
      ...current,
      paid: current.paid + (payment.status === "paid" ? payment.amount : 0),
      pending: current.pending + (payment.status === "pending" ? payment.amount : 0),
      cancelled:
        current.cancelled + (payment.status === "cancelled" ? payment.amount : 0),
    });
  });

  return Array.from(grouped.values()).sort((a, b) => a.date.localeCompare(b.date));
};

export const getRevenueByDoctor = async (
  clinicId: string,
  dateRange: { from: Date; to: Date },
): Promise<RevenueByDoctor[]> => {
  const payments = await getPaymentsByRange(clinicId, { dateRange });
  const grouped = new Map<string, RevenueByDoctor>();

  payments.forEach((payment) => {
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
  const payments = await getPaymentsByRange(clinicId, { dateRange });
  const grouped = new Map<string, RevenueByInsurance>();

  payments.forEach((payment) => {
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
  const payments = await getPaymentsByRange(clinicId, { dateRange });
  const grouped = new Map<string, RevenueByMethod>();

  payments.forEach((payment) => {
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
  lastDoc: QueryDocumentSnapshot<Payment> | null,
): Promise<PaginatedResult<Payment>> => {
  return await getPaginatedDocs(
    paymentsCollection(clinicId),
    buildPaymentConstraints(clinicId, filters),
    15,
    lastDoc,
  );
};

export const getPendingPayments = async (
  clinicId: string,
  daysOverdue: number,
): Promise<Payment[]> => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysOverdue);
  const snapshot = await getDocs(
    query(
      paymentsCollection(clinicId),
      where("clinicId", "==", clinicId),
      where("status", "==", "pending"),
      where("date", "<=", cutoff.toISOString().slice(0, 10)),
      orderBy("date", "asc"),
    ),
  );
  return snapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
};

export const registerPayment = async (
  clinicId: string,
  data: PaymentCreateInput,
): Promise<Payment> => {
  return await addTypedDoc(paymentsCollection(clinicId), {
    ...data,
    clinicId,
    createdAt: serverTimestamp(),
  } as Omit<Payment, "id">);
};

export const updatePayment = async (
  clinicId: string,
  id: string,
  data: Partial<Payment>,
): Promise<void> => {
  await updateTypedDoc(doc(paymentsCollection(clinicId), id), data);
};

export const bulkMarkAsPaid = async (
  clinicId: string,
  paymentIds: string[],
): Promise<void> => {
  const batch = writeBatch(firestoreDb);

  paymentIds.forEach((paymentId) => {
    batch.update(doc(paymentsCollection(clinicId), paymentId), {
      status: "paid",
    });
  });

  await batch.commit();
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

