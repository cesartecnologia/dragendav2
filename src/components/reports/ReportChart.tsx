"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ReportRow } from "../../lib/types";

export type ReportChartProps = {
  data: ReportRow[];
  isLoading: boolean;
  error: string | null;
};

export const ReportChart = ({ data, isLoading, error }: ReportChartProps): JSX.Element => {
  if (isLoading) {
    return <div className="h-72 animate-pulse rounded-md bg-clinic-border" />;
  }

  if (error !== null) {
    return <p className="rounded-md bg-clinic-danger/10 p-4 text-clinic-danger">{error}</p>;
  }

  if (data.length === 0) {
    return <p className="rounded-md border border-dashed p-6 text-center text-clinic-muted">Sem dados para exibir.</p>;
  }

  return (
    <div className="mx-auto h-64 w-full max-w-3xl rounded-md border border-clinic-border bg-clinic-surface p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barSize={28}>
          <CartesianGrid stroke="#E5E2DC" vertical={false} />
          <XAxis dataKey={Object.keys(data[0] ?? { label: "" })[0]} />
          <YAxis />
          <Tooltip />
          <Bar dataKey={Object.keys(data[0] ?? { valor: 0 }).find((key) => typeof data[0]?.[key] === "number") ?? "valor"} fill="#6B8CAE" radius={[5, 5, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
