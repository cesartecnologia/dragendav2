"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { usePatientSearch } from "../../lib/hooks/usePatients";
import type { Patient } from "../../lib/types";

export type PatientSearchProps = {
  clinicId: string;
  onSelect: (patient: Patient) => void;
};

export const PatientSearch = ({ clinicId, onSelect }: PatientSearchProps): JSX.Element => {
  const [search, setSearch] = useState("");
  const { data = [], isLoading, error } = usePatientSearch(clinicId, search);

  return (
    <div className="grid gap-2">
      <label className="grid gap-1 text-sm text-clinic-text">
        Paciente
        <div className="flex items-center gap-2 rounded-md border border-clinic-border px-3 py-2">
          <Search className="h-4 w-4 text-clinic-muted" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full outline-none" placeholder="Buscar por nome, CPF ou telefone" />
        </div>
      </label>
      {isLoading ? <p className="text-sm text-clinic-muted">Buscando pacientes...</p> : null}
      {error !== null ? <p className="text-sm text-clinic-danger">Erro ao buscar pacientes</p> : null}
      {search.length >= 2 && data.length === 0 && !isLoading ? <p className="text-sm text-clinic-muted">Nenhum paciente encontrado</p> : null}
      <div className="grid gap-1">
        {data.map((patient) => (
          <button key={patient.id} type="button" onClick={() => onSelect(patient)} className="rounded-md border border-clinic-border p-2 text-left text-sm hover:bg-clinic-bg">
            {patient.name}
          </button>
        ))}
      </div>
    </div>
  );
};

