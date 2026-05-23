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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold leading-tight text-clinic-text sm:text-2xl">{title}</h1>
        <p className="mt-1 text-sm text-clinic-muted">{description}</p>
      </div>
      {actionHref !== undefined && actionLabel !== undefined ? (
        <Link
          href={actionHref}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-clinic-primary px-4 py-2 text-sm font-medium text-white sm:w-auto"
        >
          {ActionIcon !== undefined ? <ActionIcon className="h-4 w-4" /> : null}
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
};
