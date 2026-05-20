export const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export const formatMoney = (cents: number): string => {
  return moneyFormatter.format(cents / 100);
};

export const formatMoneyWithWords = (cents: number): string => {
  return `${formatMoney(cents)} (${numberToPortugueseCurrency(cents)})`;
};

export const currencyToCents = (value: string): number => {
  const digits = value.replace(/\D/g, "");
  return Number(digits);
};

export const centsToCurrencyInput = (cents: number): string => {
  return formatMoney(cents);
};

export const decimalToCents = (value: number): number => {
  return Math.round(value * 100);
};

export const centsToDecimal = (value: number): number => {
  return value / 100;
};

const units = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
const teens = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
const tens = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const hundreds = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

const numberToWordsUnderThousand = (value: number): string => {
  if (value === 0) {
    return "zero";
  }

  if (value === 100) {
    return "cem";
  }

  const parts: string[] = [];
  const hundred = Math.floor(value / 100);
  const rest = value % 100;

  if (hundred > 0) {
    parts.push(hundreds[hundred] ?? "");
  }

  if (rest >= 20) {
    const ten = Math.floor(rest / 10);
    const unit = rest % 10;
    parts.push(unit > 0 ? `${tens[ten]} e ${units[unit]}` : tens[ten] ?? "");
  } else if (rest >= 10) {
    parts.push(teens[rest - 10] ?? "");
  } else if (rest > 0) {
    parts.push(units[rest] ?? "");
  }

  return parts.filter((part) => part.length > 0).join(" e ");
};

const numberToWords = (value: number): string => {
  if (value < 1000) {
    return numberToWordsUnderThousand(value);
  }

  const thousand = Math.floor(value / 1000);
  const rest = value % 1000;
  const thousandText = thousand === 1 ? "mil" : `${numberToWordsUnderThousand(thousand)} mil`;

  return rest > 0 ? `${thousandText} e ${numberToWordsUnderThousand(rest)}` : thousandText;
};

export const numberToPortugueseCurrency = (cents: number): string => {
  const reais = Math.floor(cents / 100);
  const centavos = Math.abs(cents % 100);
  const realText = `${numberToWords(reais)} ${reais === 1 ? "real" : "reais"}`;

  if (centavos === 0) {
    return realText;
  }

  return `${realText} e ${numberToWords(centavos)} ${centavos === 1 ? "centavo" : "centavos"}`;
};
