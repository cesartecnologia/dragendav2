import { getAppointmentsByDoctor } from "./appointmentService";
import {
  getRevenueByDoctor,
  getRevenueByInsurance,
  getRevenueByMethod,
  getRevenueSummary,
} from "./financialService";
import type { ReportData, ReportFilters } from "../types";
import { paymentMethodLabel } from "../utils/labels";

const emptyReport = (title: string): ReportData => ({
  title,
  rows: [],
  totals: {},
});

export const getAppointmentsReport = async (
  clinicId: string,
  filters: ReportFilters,
): Promise<ReportData> => {
  if (filters.doctorId === undefined) {
    return emptyReport("Agendamentos por período");
  }

  const appointments = await getAppointmentsByDoctor(
    clinicId,
    filters.doctorId,
    filters.dateRange,
  );

  return {
    title: "Agendamentos por período",
    rows: appointments.map((appointment) => ({
      data: appointment.date,
      horario: appointment.time,
      paciente: appointment.patientName,
      medico: appointment.doctorName,
      status: appointment.status,
    })),
    totals: {
      total: appointments.length,
    },
  };
};

export const getDoctorProductionReport = async (
  clinicId: string,
  filters: ReportFilters,
): Promise<ReportData> => {
  const data = await getRevenueByDoctor(clinicId, filters.dateRange);
  return {
    title: "Produção por médico",
    rows: data.map((item) => ({
      medico: item.doctorName,
      consultas: item.count,
      receita: item.total,
      ticketMedio: item.avgTicket,
    })),
    totals: {
      receita: data.reduce((total, item) => total + item.total, 0),
      consultas: data.reduce((total, item) => total + item.count, 0),
    },
  };
};

export const getPatientFlowReport = async (): Promise<ReportData> => {
  return emptyReport("Pacientes novos vs retorno");
};

export const getCancellationReport = async (): Promise<ReportData> => {
  return emptyReport("Cancelamentos e faltas");
};

export const getOccupancyReport = async (
  clinicId: string,
  filters: ReportFilters,
): Promise<ReportData> => {
  const summary = await getRevenueSummary(clinicId, filters.dateRange);
  return {
    title: "Ocupação da agenda",
    rows: [{ ocupacao: summary.occupancyRate }],
    totals: { ocupacao: summary.occupancyRate },
  };
};

export const getInsuranceReport = async (
  clinicId: string,
  filters: ReportFilters,
): Promise<ReportData> => {
  const data = await getRevenueByInsurance(clinicId, filters.dateRange);
  return {
    title: "Convênios",
    rows: data.map((item) => ({
      convenio: item.insuranceName,
      total: item.total,
      cobertura: item.coverage,
      copay: item.copay,
      consultas: item.count,
    })),
    totals: {
      total: data.reduce((total, item) => total + item.total, 0),
    },
  };
};

export const getFinancialReport = async (
  clinicId: string,
  filters: ReportFilters,
): Promise<ReportData> => {
  const methods = await getRevenueByMethod(clinicId, filters.dateRange);
  return {
    title: "Financeiro consolidado",
    rows: methods.map((item) => ({
      forma: paymentMethodLabel(item.method),
      total: item.total,
      quantidade: item.count,
    })),
    totals: {
      total: methods.reduce((total, item) => total + item.total, 0),
    },
  };
};
