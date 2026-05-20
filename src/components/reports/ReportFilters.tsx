"use client";

import type { DateRange } from "../../lib/types";
import { DateRangePicker } from "../shared/DateRangePicker";

export type ReportFiltersProps = {
  dateRange: DateRange;
  onDateRangeChange: (dateRange: DateRange) => void;
};

export const ReportFilters = ({ dateRange, onDateRangeChange }: ReportFiltersProps): JSX.Element => {
  return (
    <div className="rounded-md border border-clinic-border bg-clinic-surface p-4">
      <DateRangePicker value={dateRange} onChange={onDateRangeChange} />
    </div>
  );
};

