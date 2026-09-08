"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function TopAbnormalChart({ data }: { data: Array<{ name: string; count: number }> }) {
  if (data.length === 0) {
    return <div className="chart-empty">Belum ada hasil abnormal tercatat.</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "var(--ink-soft)" }}
          axisLine={{ stroke: "var(--border-strong)" }}
          tickLine={false}
          interval={0}
          angle={-20}
          textAnchor="end"
          height={50}
        />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "var(--ink-soft)" }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ fontSize: 12.5, borderRadius: 4, border: "1px solid var(--border-strong)" }} formatter={(v: number) => [v, "Kali abnormal"]} />
        <Bar dataKey="count" fill="var(--rust)" radius={[3, 3, 0, 0]} barSize={26} />
      </BarChart>
    </ResponsiveContainer>
  );
}
