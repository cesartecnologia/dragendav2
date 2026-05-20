"use client";

import type { AppointmentStatus } from "../../lib/types";
import { StatusBadge } from "../shared/StatusBadge";

export type AppointmentStatusBadgeProps = {
  status: AppointmentStatus;
};

export const AppointmentStatusBadge = ({ status }: AppointmentStatusBadgeProps): JSX.Element => {
  return <StatusBadge status={status} />;
};

