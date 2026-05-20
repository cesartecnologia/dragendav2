"use client";

import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RevenueByPeriod } from "../../lib/types";
import { formatDateBR } from "../../lib/utils/date";
import { formatMoney } from "../../lib/utils/money";

export type RevenueChartProps = {
  data: RevenueByPeriod[];
  isLoading: boolean;
  error: string | null;
};

const tooltipLabel = (name: string): string => {
  const labels: Record<string, string> = {
    paid: "Recebido",
    pending: "A receber",
    total: "Total previsto",
  };

  return labels[name] ?? name;
};

export const RevenueChart = ({ data, isLoading, error }: RevenueChartProps): JSX.Element => {
  const totalPaid = data.reduce((total, item) => total + item.paid, 0);
  const totalPending = data.reduce((total, item) => total + item.pending, 0);
  const chartData = data.map((item) => ({
    ...item,
    total: item.paid + item.pending,
  }));

  if (isLoading) {
    return <div className="h-72 animate-pulse rounded-md bg-clinic-border" />;
  }

  if (error !== null) {
    return <p className="rounded-md bg-clinic-danger/10 p-4 text-clinic-danger">{error}</p>;
  }

  if (data.length === 0) {
    return <p className="rounded-md border border-dashed p-6 text-center text-clinic-muted">Sem dados financeiros no período.</p>;
  }

  return (
    <div className="w-full rounded-md border border-clinic-border bg-clinic-surface p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-clinic-muted">Receita do período</p>
          <h2 className="mt-1 text-2xl font-semibold text-clinic-text">
            {formatMoney(totalPaid + totalPending)}
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-md bg-clinic-success/10 px-3 py-2">
            <p className="text-clinic-muted">Recebido</p>
            <p className="font-semibold text-clinic-text">{formatMoney(totalPaid)}</p>
          </div>
          <div className="rounded-md bg-clinic-warning/10 px-3 py-2">
            <p className="text-clinic-muted">A receber</p>
            <p className="font-semibold text-clinic-text">{formatMoney(totalPending)}</p>
          </div>
        </div>
      </div>
      <div className="mt-5 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="revenueTotalGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#6B8CAE" stopOpacity={0.24} />
                <stop offset="95%" stopColor="#6B8CAE" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#E5E2DC" strokeDasharray="4 6" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDateBR}
              tick={{ fill: "#6B6966", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              minTickGap={18}
            />
            <YAxis
              tickFormatter={(value: number) => formatMoney(value)}
              tick={{ fill: "#6B6966", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={86}
            />
            <Tooltip
              cursor={{ fill: "#F7F5F2" }}
              labelFormatter={(label) => formatDateBR(String(label))}
              formatter={(value, name) => [
                formatMoney(Number(value)),
                tooltipLabel(String(name)),
              ]}
              contentStyle={{
                border: "1px solid #E5E2DC",
                borderRadius: 8,
                boxShadow: "0 10px 30px rgba(44,44,42,0.10)",
              }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#6B8CAE"
              strokeWidth={2}
              fill="url(#revenueTotalGradient)"
              name="total"
            />
            <Bar dataKey="paid" barSize={12} fill="#7AAB8A" name="paid" radius={[5, 5, 0, 0]} />
            <Bar dataKey="pending" barSize={12} fill="#C9A96E" name="pending" radius={[5, 5, 0, 0]} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
