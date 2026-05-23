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
      className="rounded-md border border-l-8 border-clinic-border bg-clinic-surface p-4 transition hover:border-clinic-primary/40 hover:shadow-sm sm:p-5"
      style={{ borderLeftColor: specialtyColor.border }}
    >
      <div className="flex items-center gap-4 sm:gap-5">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-clinic-bg sm:h-24 sm:w-24">
          {doctor.photoUrl.length > 0 ? (
            <Image src={doctor.photoUrl} alt={doctor.name} fill sizes="96px" className="object-cover" />
          ) : (
            <Stethoscope className="m-5 h-6 w-6 text-clinic-muted sm:m-8 sm:h-8 sm:w-8" />
          )}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-clinic-text sm:text-lg">{doctor.name}</h3>
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
