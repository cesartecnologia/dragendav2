"use client";

import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import Link from "next/link";

export type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export const EmptyState = ({
  icon: Icon = Inbox,
  title,
  description,
  actionHref,
  actionLabel,
  onAction,
}: EmptyStateProps): JSX.Element => {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-md border border-dashed border-clinic-border bg-clinic-surface p-6 text-center">
      <Icon className="h-10 w-10 text-clinic-muted" aria-hidden="true" />
      <h3 className="mt-4 text-base font-semibold text-clinic-text">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-clinic-muted">{description}</p>
      {actionHref !== undefined && actionLabel !== undefined ? (
        <Link
          href={actionHref}
          className="mt-4 rounded-md bg-clinic-primary px-4 py-2 text-sm font-medium text-white"
        >
          {actionLabel}
        </Link>
      ) : null}
      {onAction !== undefined && actionLabel !== undefined ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 rounded-md bg-clinic-primary px-4 py-2 text-sm font-medium text-white"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
};

