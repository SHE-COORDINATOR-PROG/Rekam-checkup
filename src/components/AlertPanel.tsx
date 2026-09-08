"use client";

import type { Checkup } from "@/lib/types";
import { formatDate } from "./Timeline";

export default function AlertPanel({
  checkups,
  onResolve,
}: {
  checkups: Checkup[];
  onResolve: (resultId: string) => void;
}) {
  const items = checkups
    .flatMap((c) =>
      c.results
        .filter((r) => r.status !== "normal" && !r.resolved)
        .map((r) => ({ ...r, date: c.date }))
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  if (items.length === 0) return null;

  return (
    <div className="alert-panel">
      <h2>Perlu ditindaklanjuti</h2>
      <p className="sub">{items.length} hasil di luar rentang normal yang belum ditandai selesai.</p>
      {items.map((it) => (
        <div className="alert-row" key={it.id}>
          <div>
            <div className="name">
              {it.name} <span className={`pill ${it.status}`}>{it.status === "high" ? "Tinggi" : "Rendah"}</span>
            </div>
            <div className="note">{it.note}</div>
            <div className="meta">{formatDate(it.date)}</div>
          </div>
          <button className="resolve-btn" onClick={() => onResolve(it.id)}>
            Tandai selesai
          </button>
        </div>
      ))}
    </div>
  );
}
