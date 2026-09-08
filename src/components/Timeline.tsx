"use client";

import type { Checkup } from "@/lib/types";

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export default function Timeline({
  checkups,
  selectedId,
  onSelect,
}: {
  checkups: Checkup[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (checkups.length === 0) {
    return (
      <div className="timeline">
        <div className="timeline-empty">Belum ada checkup tersimpan.</div>
      </div>
    );
  }

  return (
    <div className="timeline">
      {checkups.map((c) => {
        const abnormalCount = c.results.filter((r) => r.status !== "normal" && !r.resolved).length;
        const active = c.id === selectedId;
        return (
          <div
            key={c.id}
            className={`tl-item ${active ? "active" : ""} ${abnormalCount > 0 ? "has-alert" : ""}`}
            onClick={() => onSelect(c.id)}
          >
            <div className="tl-date">{formatDate(c.date)}</div>
            <div className="tl-sub">{abnormalCount > 0 ? `${abnormalCount} perlu perhatian` : "Semua normal"}</div>
          </div>
        );
      })}
    </div>
  );
}

export { formatDate };
