"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLORS: Record<string, string> = {
  fit: "#2f6e68",
  fit_catatan: "#3e5f8a",
  tidak_fit_sementara: "#a6552b",
  tidak_fit: "#7a2e2e",
};

export default function StatusDistributionChart({
  data,
}: {
  data: Array<{ status: string; label: string; count: number }>;
}) {
  const hasData = data.some((d) => d.count > 0);
  if (!hasData) {
    return <div className="chart-empty">Belum ada data untuk ditampilkan.</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid stroke="var(--border)" horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "var(--ink-soft)" }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="label"
          width={130}
          tick={{ fontSize: 12, fill: "var(--ink-soft)" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip contentStyle={{ fontSize: 12.5, borderRadius: 4, border: "1px solid var(--border-strong)" }} formatter={(v: number) => [v, "Checkup"]} />
        <Bar dataKey="count" radius={[0, 3, 3, 0]} barSize={18}>
          {data.map((d) => (
            <Cell key={d.status} fill={COLORS[d.status] || "var(--ink-soft)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
