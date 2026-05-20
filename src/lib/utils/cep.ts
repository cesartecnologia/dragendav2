import type { Address } from "../types";

export type ViaCepResponse = {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
};

export const fetchAddressByCep = async (cep: string): Promise<Partial<Address>> => {
  const digits = cep.replace(/\D/g, "");

  if (digits.length !== 8) {
    throw new Error("CEP inválido");
  }

  const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);

  if (!response.ok) {
    throw new Error("Erro ao buscar CEP");
  }

  const data = (await response.json()) as ViaCepResponse;

  if (data.erro === true) {
    throw new Error("CEP não encontrado");
  }

  return {
    cep: digits,
    street: data.logradouro,
    complement: data.complemento,
    neighborhood: data.bairro,
    city: data.localidade,
    state: data.uf,
  };
};

