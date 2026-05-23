"use client";

import {
  CalendarCheck,
  CalendarClock,
  CalendarX,
  Clock3,
  CloudSun,
  Stethoscope,
  Sun,
  CalendarDays,
  UserRound,
} from "lucide-react";
import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { AppointmentCard } from "../../../components/appointments/AppointmentCard";
import { EmptyState } from "../../../components/shared/EmptyState";
import { LoadingSkeleton } from "../../../components/shared/LoadingSkeleton";
import { useAppointmentsByRange } from "../../../lib/hooks/useAppointments";
import { useAuth } from "../../../lib/hooks/useAuth";
import { createDateRange, formatDateBR, todayISO } from "../../../lib/utils/date";

type WeatherState = {
  temperature: number | null;
  condition: string;
};

const weatherCodeToCondition = (code: number): string => {
  if ([0].includes(code)) {
    return "Céu limpo";
  }

  if ([1, 2, 3].includes(code)) {
    return "Parcialmente nublado";
  }

  if ([45, 48].includes(code)) {
    return "Neblina";
  }

  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return "Chuva";
  }

  if ([95, 96, 99].includes(code)) {
    return "Temporal";
  }

  return "Tempo local";
};

const DashboardPage = (): JSX.Element => {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [now, setNow] = useState(new Date());
  const [weather, setWeather] = useState<WeatherState>({ temperature: null, condition: "Carregando clima" });
  const { user, isLoading: authLoading, error: authError } = useAuth();
  const clinicId = user?.clinicId ?? "";
  const selectedMonthDate = useMemo(() => new Date(`${selectedMonth}-01T12:00:00`), [selectedMonth]);
  const currentRange = useMemo(
    () => createDateRange(startOfMonth(selectedMonthDate), endOfMonth(selectedMonthDate)),
    [selectedMonthDate],
  );
  const previousMonthDate = useMemo(() => subMonths(selectedMonthDate, 1), [selectedMonthDate]);
  const previousRange = useMemo(
    () => createDateRange(startOfMonth(previousMonthDate), endOfMonth(previousMonthDate)),
    [previousMonthDate],
  );
  const appointments = useAppointmentsByRange(clinicId, currentRange);
  const previousAppointments = useAppointmentsByRange(clinicId, previousRange);
  const data = appointments.data ?? [];
  const previousData = previousAppointments.data ?? [];
  const activeData = data.filter((item) => item.status !== "cancelled");
  const previousActiveData = previousData.filter((item) => item.status !== "cancelled");
  const confirmed = activeData.filter((item) => item.status === "confirmed").length;
  const cancelled = data.filter((item) => item.status === "cancelled").length;
  const doctors = new Set(activeData.map((item) => item.doctorId)).size;
  const previousConfirmed = previousActiveData.filter((item) => item.status === "confirmed").length;
  const previousCancelled = previousData.filter((item) => item.status === "cancelled").length;
  const previousDoctors = new Set(previousActiveData.map((item) => item.doctorId)).size;
  const compare = (current: number, previous: number): string => {
    if (previous === 0) {
      return current === 0 ? "igual ao mês anterior" : "+100% vs. mês anterior";
    }

    const percent = Math.round(((current - previous) / previous) * 100);
    return `${percent >= 0 ? "+" : ""}${percent}% vs. mês anterior`;
  };
  const weekdayData = useMemo(
    () =>
      [
        { label: "Seg", dayIndex: 1 },
        { label: "Ter", dayIndex: 2 },
        { label: "Qua", dayIndex: 3 },
        { label: "Qui", dayIndex: 4 },
        { label: "Sex", dayIndex: 5 },
        { label: "Sáb", dayIndex: 6 },
      ].map((weekday) => {
        const count = activeData.filter((appointment) => new Date(`${appointment.date}T12:00:00`).getDay() === weekday.dayIndex).length;
        return { ...weekday, count };
      }),
    [activeData],
  );
  const currentBrazilDate = useMemo(() => todayISO(), [now]);
  const currentBrazilMonth = currentBrazilDate.slice(0, 7);
  const currentWeekdayIndex = new Date(`${currentBrazilDate}T12:00:00`).getDay();
  const maxWeekday = Math.max(1, ...weekdayData.map((item) => item.count));
  const displayName = user?.name ?? "Usuário";
  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    timeZone: "America/Sao_Paulo",
  })
    .format(now)
    .replace(".", "")
    .replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
  const formattedTime = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(now);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadWeather = async (latitude: number, longitude: number): Promise<void> => {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=America%2FSao_Paulo`,
        );
        const payload = (await response.json()) as {
          current?: { temperature_2m?: number; weather_code?: number };
        };
        setWeather({
          temperature: Math.round(payload.current?.temperature_2m ?? 0),
          condition: weatherCodeToCondition(payload.current?.weather_code ?? -1),
        });
      } catch {
        setWeather({ temperature: null, condition: "Clima indisponível" });
      }
    };

    if (!("geolocation" in navigator)) {
      void loadWeather(-15.7939, -47.8828);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        void loadWeather(position.coords.latitude, position.coords.longitude);
      },
      () => {
        void loadWeather(-15.7939, -47.8828);
      },
      { timeout: 5000, maximumAge: 600000 },
    );
  }, []);

  if (authLoading) {
    return <LoadingSkeleton count={4} variant="card" />;
  }

  if (authError !== null) {
    return <EmptyState title="Erro ao autenticar" description={authError} />;
  }

  const kpis = [
    { label: "Agendamentos no mês", value: activeData.length, previous: previousActiveData.length, icon: CalendarClock, tone: "text-clinic-primary" },
    { label: "Confirmados", value: confirmed, previous: previousConfirmed, icon: CalendarCheck, tone: "text-clinic-success" },
    { label: "Cancelados", value: cancelled, previous: previousCancelled, icon: CalendarX, tone: "text-clinic-danger" },
    { label: "Médicos com agenda", value: doctors, previous: previousDoctors, icon: Stethoscope, tone: "text-clinic-secondary" },
  ];

  return (
    <div className="grid gap-5">
      <div className="rounded-lg border border-clinic-border bg-clinic-surface p-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal text-clinic-text md:text-4xl">
              Olá, {displayName}! <span aria-hidden="true">👋</span>
            </h1>
            <p className="mt-2 text-base text-clinic-muted">
              Bem-vindo ao painel de controle da clínica.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[auto_auto_auto]">
            <div className="inline-flex h-12 items-center gap-3 rounded-md border border-clinic-border bg-white px-4 text-sm font-medium text-clinic-text shadow-sm">
              <CalendarDays className="h-4 w-4 text-clinic-primary" />
              {formattedDate}
            </div>
            <div className="inline-flex h-12 items-center gap-3 rounded-md border border-clinic-border bg-white px-4 text-sm font-medium text-clinic-text shadow-sm">
              <Clock3 className="h-4 w-4 text-clinic-primary" />
              {formattedTime}
            </div>
            <div className="inline-flex h-12 items-center gap-3 rounded-md border border-clinic-border bg-white px-4 text-sm font-medium text-clinic-text shadow-sm">
              {weather.condition === "Céu limpo" ? <Sun className="h-5 w-5 text-clinic-danger" /> : <CloudSun className="h-5 w-5 text-clinic-warning" />}
              <span>{weather.temperature === null ? "--" : `${weather.temperature}°C`}</span>
              <span className="text-clinic-muted">{weather.condition}</span>
            </div>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-3 border-t border-clinic-border pt-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-clinic-muted">
            Operação mensal da clínica em {format(selectedMonthDate, "MM/yyyy")}
          </p>
          <label className="flex items-center gap-3 text-sm font-medium text-clinic-muted">
            <span>Mês</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="w-44 rounded-md border border-clinic-border bg-clinic-surface px-3 py-2 text-clinic-text"
            />
          </label>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {kpis.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-lg border border-clinic-border bg-clinic-surface p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-clinic-muted">{item.label}</p>
                <Icon className={`h-5 w-5 ${item.tone}`} />
              </div>
              <p className="mt-8 text-4xl font-semibold text-clinic-text">{item.value}</p>
              <p className={`mt-2 text-sm ${item.value >= item.previous ? "text-clinic-success" : "text-clinic-danger"}`}>
                {compare(item.value, item.previous)}
              </p>
            </div>
          );
        })}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <section className="rounded-lg border border-clinic-border bg-clinic-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-clinic-text">Fluxo de atendimentos</h2>
            <Clock3 className="h-5 w-5 text-clinic-primary" />
          </div>
          <div className="mt-8 grid h-64 grid-cols-6 items-end gap-3">
            {weekdayData.map((item) => (
              <div key={item.label} className="group relative flex h-full flex-col justify-end gap-2">
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-clinic-text px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                  {item.count} agendamento{item.count === 1 ? "" : "s"} no mês
                </div>
                <div
                  className={`rounded-t-md ${
                    selectedMonth === currentBrazilMonth && item.dayIndex === currentWeekdayIndex
                      ? "bg-clinic-primary"
                      : "bg-clinic-border"
                  }`}
                  style={{ height: `${Math.max(8, (item.count / maxWeekday) * 100)}%` }}
                />
                <span className="text-center text-xs text-clinic-muted">{item.label}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-lg border border-clinic-border bg-clinic-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-clinic-text">Resumo de presença</h2>
            <UserRound className="h-5 w-5 text-clinic-secondary" />
          </div>
          <div className="mt-8 flex items-center justify-center">
            <div className="flex h-48 w-48 items-center justify-center rounded-full border-[18px] border-clinic-success/30">
              <div className="text-center">
                <p className="text-4xl font-semibold text-clinic-text">{activeData.length === 0 ? 0 : Math.round((confirmed / activeData.length) * 100)}%</p>
                <p className="text-sm text-clinic-muted">confirmados</p>
              </div>
            </div>
          </div>
        </section>
      </div>
      <section className="grid gap-3">
        <h2 className="text-lg font-semibold text-clinic-text">Próximos agendamentos do mês</h2>
        {appointments.isLoading ? <LoadingSkeleton count={4} /> : null}
        {appointments.error !== null ? <EmptyState title="Erro ao carregar agenda" description={appointments.error.message} /> : null}
        {!appointments.isLoading && appointments.error === null && activeData.length === 0 ? (
          <EmptyState title="Sem agendamentos no mês" description="A agenda do mês ainda está livre." actionHref="/appointments" actionLabel="Abrir agenda" />
        ) : null}
        <div className="grid gap-3 md:grid-cols-2">
          {activeData.slice(0, 4).map((appointment) => (
            <AppointmentCard key={appointment.id} appointment={appointment} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
