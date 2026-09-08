"use client";

import type { Checkup } from "@/lib/types";
import { RISK_TIER_BOX_LABEL } from "@/lib/types";

export function formatDate(iso: string) {
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
        const active = c.id === selectedId;
        return (
          <div
            key={c.id}
            className={`tl-item ${active ? "active" : ""} tl-tier-${c.kkrLevel}`}
            onClick={() => onSelect(c.id)}
          >
            <div className="tl-date">{c.patientName || formatDate(c.date)}</div>
            <div className="tl-sub">
              {c.patientName ? formatDate(c.date) + " · " : ""}
              {RISK_TIER_BOX_LABEL[c.kkrLevel]}
            </div>
          </div>
        );
      })}
    </div>
  );
}
