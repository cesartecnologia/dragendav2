"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export type PageHeaderProps = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  actionIcon?: LucideIcon;
};

export const PageHeader = ({
  title,
  description,
  actionHref,
  actionLabel,
  actionIcon: ActionIcon,
}: PageHeaderProps): JSX.Element => {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-clinic-text">{title}</h1>
        <p className="mt-1 text-sm text-clinic-muted">{description}</p>
      </div>
      {actionHref !== undefined && actionLabel !== undefined ? (
        <Link
          href={actionHref}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-clinic-primary px-4 py-2 text-sm font-medium text-white"
        >
          {ActionIcon !== undefined ? <ActionIcon className="h-4 w-4" /> : null}
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
};

