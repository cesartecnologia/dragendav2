"use client";

export type LoadingSkeletonProps = {
  count?: number;
  variant?: "card" | "row" | "table";
};

export const LoadingSkeleton = ({
  count = 15,
  variant = "row",
}: LoadingSkeletonProps): JSX.Element => {
  if (variant === "table") {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="grid grid-cols-1 gap-3 rounded-md border border-clinic-border bg-clinic-surface p-4 md:grid-cols-5"
          >
            <div className="h-4 animate-pulse rounded bg-clinic-border" />
            <div className="h-4 animate-pulse rounded bg-clinic-border" />
            <div className="h-4 animate-pulse rounded bg-clinic-border" />
            <div className="h-4 animate-pulse rounded bg-clinic-border" />
            <div className="h-4 animate-pulse rounded bg-clinic-border" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={variant === "card" ? "grid gap-4 md:grid-cols-3" : "space-y-3"}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="rounded-md border border-clinic-border bg-clinic-surface p-4"
        >
          <div className="h-5 w-2/3 animate-pulse rounded bg-clinic-border" />
          <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-clinic-border" />
          <div className="mt-3 h-4 w-1/3 animate-pulse rounded bg-clinic-border" />
        </div>
      ))}
    </div>
  );
};

