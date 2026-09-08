"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function TrendChart({ data }: { data: Array<{ label: string; count: number }> }) {
  if (data.length === 0) {
    return <div className="chart-empty">Belum ada data untuk ditampilkan.</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--ink-soft)" }} axisLine={{ stroke: "var(--border-strong)" }} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "var(--ink-soft)" }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ fontSize: 12.5, borderRadius: 4, border: "1px solid var(--border-strong)" }}
          labelStyle={{ color: "var(--ink)" }}
          formatter={(v: number) => [v, "Hasil abnormal"]}
        />
        <Line type="monotone" dataKey="count" stroke="var(--rust)" strokeWidth={2.5} dot={{ r: 4, fill: "var(--rust)" }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
