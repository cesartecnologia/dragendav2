"use client";

import { CalendarDays, List, Plus } from "lucide-react";
import { useState } from "react";
import { AppointmentModal } from "../../../components/appointments/AppointmentModal";
import { CalendarView } from "../../../components/appointments/CalendarView";
import { ListView } from "../../../components/appointments/ListView";
import { PaymentMethodModal } from "../../../components/appointments/PaymentMethodModal";
import { PageHeader } from "../../../components/shared/PageHeader";
import { useAppointments, useCreateAppointment, useUpdateAppointmentPaymentStatus, useUpdateAppointmentStatus } from "../../../lib/hooks/useAppointments";
import { useAuth } from "../../../lib/hooks/useAuth";
import { useDoctors } from "../../../lib/hooks/useDoctors";
import { useInsurances } from "../../../lib/hooks/useInsurances";
import { useExamTypes } from "../../../lib/hooks/useExamTypes";
import { usePatients } from "../../../lib/hooks/usePatients";
import { useAvailableSlots } from "../../../lib/hooks/useSchedule";
import { useClinic } from "../../../lib/hooks/useClinic";
import { APPOINTMENT_STATUS, PAYMENT_STATUS, type Appointment, type PaymentMethod } from "../../../lib/types";
import { buildAppointmentConfirmationMessage, buildWhatsAppLink } from "../../../lib/services/whatsappService";
import { generateAppointmentReceiptPdf } from "../../../lib/utils/receipt";
import { useUiStore } from "../../../lib/stores/uiStore";

const AppointmentsPage = (): JSX.Element => {
  const [view, setView] = useState<"list" | "calendar">("calendar");
  const [modalOpen, setModalOpen] = useState(false);
  const [paymentAppointment, setPaymentAppointment] = useState<Appointment | null>(null);
  const [slotDoctorId, setSlotDoctorId] = useState("");
  const [slotDate, setSlotDate] = useState("");
  const [initialDate, setInitialDate] = useState("");
  const [initialTime, setInitialTime] = useState("");
  const { user } = useAuth();
  const pushToast = useUiStore((state) => state.pushToast);
  const clinicId = user?.clinicId ?? "";
  const filters = {};
  const appointments = useAppointments(clinicId, filters);
  const create = useCreateAppointment(clinicId, filters);
  const updateStatus = useUpdateAppointmentStatus(clinicId, filters);
  const updatePaymentStatus = useUpdateAppointmentPaymentStatus(clinicId, filters);
  const doctors = useDoctors(clinicId, { active: true });
  const clinic = useClinic(clinicId);
  const patients = usePatients(clinicId, { active: true });
  const insurances = useInsurances(clinicId);
  const examTypes = useExamTypes(clinicId);
  const slots = useAvailableSlots(clinicId, slotDoctorId, slotDate);
  const data = appointments.data?.data ?? [];
  const attendantName =
    user?.name?.trim() ??
    clinic.data?.name?.trim() ??
    "Funcionário não identificado";
  const handleOpenNewAppointment = (date = "", time = ""): void => {
    setInitialDate(date);
    setInitialTime(time);
    setModalOpen(true);
  };
  const handleWhatsApp = (appointment: Appointment): void => {
    const patient = patients.data?.data.find((item) => item.id === appointment.patientId);
    const url = buildWhatsAppLink({
      phone: patient?.phone ?? "",
      message: buildAppointmentConfirmationMessage(appointment, clinic.data ?? null),
    });
    window.open(url, "_blank", "noopener,noreferrer");
    pushToast({ type: "success", title: "WhatsApp aberto", description: "A mensagem do agendamento foi preparada." });
  };
  const handleConfirm = (appointment: Appointment): void => {
    updateStatus.mutate(
      { id: appointment.id, status: APPOINTMENT_STATUS.CONFIRMED },
      {
        onSuccess: () => pushToast({ type: "success", title: "Agendamento confirmado", description: "O status foi atualizado com sucesso." }),
        onError: () => pushToast({ type: "error", title: "Erro ao confirmar", description: "Não foi possível atualizar o agendamento." }),
      },
    );
  };
  const handleCancel = (appointment: Appointment): void => {
    updateStatus.mutate(
      { id: appointment.id, status: APPOINTMENT_STATUS.CANCELLED },
      {
        onSuccess: () => pushToast({ type: "success", title: "Agendamento cancelado", description: "O horário foi liberado para novo agendamento." }),
        onError: () => pushToast({ type: "error", title: "Erro ao cancelar", description: "Não foi possível cancelar o agendamento." }),
      },
    );
  };
  const handlePayment = (appointment: Appointment, paymentMethod: PaymentMethod): void => {
    updatePaymentStatus.mutate(
      { id: appointment.id, paymentStatus: PAYMENT_STATUS.PAID, paymentMethod },
      {
        onSuccess: () => {
          setPaymentAppointment(null);
          pushToast({ type: "success", title: "Pagamento confirmado", description: "Forma de pagamento registrada com sucesso." });
        },
        onError: () => pushToast({ type: "error", title: "Erro no pagamento", description: "Não foi possível registrar o pagamento." }),
      },
    );
  };

  return (
    <div className="grid gap-6">
      <PageHeader title="Agenda" description="Calendário, lista e reagendamento." />
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
        <div className="inline-flex rounded-md border border-clinic-border bg-clinic-surface p-1">
          <button type="button" onClick={() => setView("calendar")} className={`rounded p-2 text-sm ${view === "calendar" ? "bg-clinic-primary text-white" : ""}`} aria-label="Calendário"><CalendarDays className="h-4 w-4" /></button>
          <button type="button" onClick={() => setView("list")} className={`rounded p-2 text-sm ${view === "list" ? "bg-clinic-primary text-white" : ""}`} aria-label="Lista"><List className="h-4 w-4" /></button>
        </div>
        <button type="button" onClick={() => handleOpenNewAppointment()} className="inline-flex items-center justify-center gap-2 rounded-md bg-clinic-primary px-4 py-2 text-sm text-white"><Plus className="h-4 w-4" />Novo agendamento</button>
      </div>
      {view === "list" ? (
        <ListView
          appointments={data}
          isLoading={appointments.isLoading}
          error={appointments.error?.message ?? null}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          onMarkPaid={(appointment) => setPaymentAppointment(appointment)}
          onReschedule={() => handleOpenNewAppointment()}
          onPrint={(appointment) => {
            void generateAppointmentReceiptPdf(appointment, clinic.data ?? null);
            pushToast({ type: "success", title: "Comprovante gerado", description: "O PDF do agendamento foi aberto." });
          }}
          onWhatsApp={handleWhatsApp}
        />
      ) : (
        <CalendarView
          appointments={data}
          isLoading={appointments.isLoading}
          error={appointments.error?.message ?? null}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          onMarkPaid={(appointment) => setPaymentAppointment(appointment)}
          onReschedule={() => handleOpenNewAppointment()}
          onPrint={(appointment) => {
            void generateAppointmentReceiptPdf(appointment, clinic.data ?? null);
            pushToast({ type: "success", title: "Comprovante gerado", description: "O PDF do agendamento foi aberto." });
          }}
          onWhatsApp={handleWhatsApp}
          onEmptySlot={(date, time) => handleOpenNewAppointment(date, time)}
        />
      )}
      <AppointmentModal
        open={modalOpen}
        isPending={create.isPending}
        patients={patients.data?.data ?? []}
        doctors={doctors.data ?? []}
        insurances={insurances.data ?? []}
        examTypes={examTypes.data ?? []}
        slots={slots.data ?? []}
        slotsLoading={slots.isLoading}
        initialDate={initialDate}
        initialTime={initialTime}
        onDoctorDateChange={(doctorId, date) => {
          setSlotDoctorId(doctorId);
          setSlotDate(date);
        }}
        onClose={() => setModalOpen(false)}
        onSubmit={async (values) => {
          try {
            const appointment = await create.mutateAsync({
              ...values,
              status: APPOINTMENT_STATUS.SCHEDULED,
              paymentStatus:
                values.type === "return" || values.paymentMethod !== null
                  ? PAYMENT_STATUS.PAID
                  : PAYMENT_STATUS.PENDING,
              whatsappSent: true,
              createdBy: attendantName,
            });
            await generateAppointmentReceiptPdf(appointment, clinic.data ?? null);
            const url = buildWhatsAppLink({
              phone: values.patientPhone,
              message: buildAppointmentConfirmationMessage(appointment, clinic.data ?? null),
            });
            window.open(url, "_blank", "noopener,noreferrer");
            pushToast({ type: "success", title: "Agendamento criado", description: "Comprovante e WhatsApp foram preparados." });
            setModalOpen(false);
          } catch {
            pushToast({ type: "error", title: "Erro ao criar agendamento", description: "Não foi possível salvar o agendamento." });
          }
        }}
      />
      <PaymentMethodModal
        appointment={paymentAppointment}
        isPending={updatePaymentStatus.isPending}
        onClose={() => setPaymentAppointment(null)}
        onConfirm={handlePayment}
      />
    </div>
  );
};

export default AppointmentsPage;
