"use client";

import Image from "next/image";
import Link from "next/link";
import { Stethoscope } from "lucide-react";
import type { Doctor } from "../../lib/types";
import { getSpecialtyColor } from "../../lib/utils/specialtyColor";

export type DoctorCardProps = {
  doctor: Doctor;
};

export const DoctorCard = ({ doctor }: DoctorCardProps): JSX.Element => {
  const specialtyColor = getSpecialtyColor(doctor.specialty);

  return (
    <Link
      href={`/medicos/${doctor.id}`}
      className="rounded-md border border-l-8 border-clinic-border bg-clinic-surface p-5 transition hover:border-clinic-primary/40 hover:shadow-sm"
      style={{ borderLeftColor: specialtyColor.border }}
    >
      <div className="flex items-center gap-5">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-clinic-bg">
          {doctor.photoUrl.length > 0 ? (
            <Image src={doctor.photoUrl} alt={doctor.name} fill sizes="96px" className="object-cover" />
          ) : (
            <Stethoscope className="m-8 h-8 w-8 text-clinic-muted" />
          )}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold text-clinic-text">{doctor.name}</h3>
          <p className="mt-1 text-sm text-clinic-muted">CRM {doctor.crm}</p>
          <p
            className="mt-1 text-sm font-medium"
            style={{ color: specialtyColor.text }}
          >
            {doctor.specialty}
          </p>
        </div>
      </div>
    </Link>
  );
};
