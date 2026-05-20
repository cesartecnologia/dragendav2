"use client";

import Link from "next/link";
import { BadgeCheck, Calendar, IdCard, Mail, Phone, User } from "lucide-react";
import type { Patient } from "../../lib/types";
import { formatCpf } from "../../lib/utils/cpf";
import { formatDateBR } from "../../lib/utils/date";
import { maskPhone } from "../../lib/utils/masks";

export type PatientCardProps = {
  patient: Patient;
};

export const PatientCard = ({ patient }: PatientCardProps): JSX.Element => {
  return (
    <Link href={`/patients/${patient.id}`} className="block rounded-md border border-clinic-border bg-clinic-surface p-3 transition hover:border-clinic-primary/50 hover:shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-md bg-clinic-bg p-3 text-clinic-primary">
          <User className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold text-clinic-text">{patient.name}</h3>
          <p className="text-sm text-clinic-muted">{patient.active ? "Ativo" : "Inativo"}</p>
        </div>
      </div>
      <div className="mt-3 grid gap-1.5 text-xs text-clinic-muted">
        <div className="flex items-center gap-2">
          <IdCard className="h-4 w-4 text-clinic-primary" />
          <span>{formatCpf(patient.cpf)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-clinic-primary" />
          <span>{maskPhone(patient.phone)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-clinic-primary" />
          <span>{patient.birthDate.length > 0 ? formatDateBR(patient.birthDate) : "Nascimento não informado"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-clinic-primary" />
          <span className="truncate">{patient.email || "Email não informado"}</span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-clinic-success/10 px-3 py-1 text-xs text-clinic-success">
          <BadgeCheck className="h-3.5 w-3.5" />
          Cadastro completo
        </span>
      </div>
    </Link>
  );
};
