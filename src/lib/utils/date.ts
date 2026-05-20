import {
  addDays,
  differenceInCalendarDays,
  differenceInYears,
  endOfDay,
  format,
  isValid,
  parse,
  startOfDay,
} from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";

export const DATE_BR_FORMAT = "dd/MM/yyyy";
export const DATE_ISO_FORMAT = "yyyy-MM-dd";
export const TIME_FORMAT = "HH:mm";
export const BRAZIL_TIME_ZONE = "America/Sao_Paulo";

export const formatDateBR = (date: Date | string): string => {
  const parsedDate =
    typeof date === "string" ? parse(date, DATE_ISO_FORMAT, new Date()) : date;
  return isValid(parsedDate)
    ? format(parsedDate, DATE_BR_FORMAT, { locale: ptBR })
    : "";
};

export const formatTimeBR = (time: string): string => {
  const parsedDate = parse(time, TIME_FORMAT, new Date());
  return isValid(parsedDate) ? format(parsedDate, TIME_FORMAT) : "";
};

export const formatDateTimeBR = (date: string, time: string): string => {
  return `${formatDateBR(date)} às ${formatTimeBR(time)}`;
};

export const parseDateBR = (value: string): Date => {
  return parse(value, DATE_BR_FORMAT, new Date());
};

export const parseDateISO = (value: string): Date => {
  return parse(value, DATE_ISO_FORMAT, new Date());
};

export const toDateISO = (date: Date): string => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BRAZIL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

export const toBrazilDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: BRAZIL_TIME_ZONE,
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
};

export const todayISO = (): string => {
  return toDateISO(new Date());
};

export const currentBrazilTime = (): string => {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: BRAZIL_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
};

export const isPastBrazilDateTime = (date: string, time: string): boolean => {
  const today = todayISO();

  if (date < today) {
    return true;
  }

  if (date > today) {
    return false;
  }

  return time <= currentBrazilTime();
};

export const calculateAge = (birthDate: string): number => {
  const parsedDate = parseDateISO(birthDate);
  return isValid(parsedDate) ? differenceInYears(new Date(), parsedDate) : 0;
};

export const daysBetween = (from: string, to: string): number => {
  return differenceInCalendarDays(parseDateISO(to), parseDateISO(from));
};

export const createDateRange = (from: Date, to: Date): { from: Date; to: Date } => {
  return {
    from: startOfDay(from),
    to: endOfDay(to),
  };
};

export const addDaysISO = (date: string, amount: number): string => {
  return toDateISO(addDays(parseDateISO(date), amount));
};
