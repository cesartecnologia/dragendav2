export const onlyNumbers = (value: string): string => value.replace(/\D/g, "");

export const maskPhone = (value: string): string => {
  const digits = onlyNumbers(value).slice(0, 11);

  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
};

export const maskCep = (value: string): string => {
  return onlyNumbers(value).slice(0, 8).replace(/^(\d{5})(\d)/, "$1-$2");
};

export const maskCnpj = (value: string): string => {
  return onlyNumbers(value)
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
};

export const maskCpf = (value: string): string => {
  return onlyNumbers(value)
    .slice(0, 11)
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
};

export const formatWhatsAppPhone = (value: string): string => {
  const digits = onlyNumbers(value);
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  return `+${withCountry}`;
};
