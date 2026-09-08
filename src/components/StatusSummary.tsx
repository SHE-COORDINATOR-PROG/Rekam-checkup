"use client";

import type { Checkup } from "@/lib/types";
import { FIT_STATUS_LABEL } from "@/lib/types";
import { daysUntil } from "@/lib/parse";
import { formatDate } from "./Timeline";

const STATUS_CLASS: Record<string, string> = {
  fit: "fit",
  fit_catatan: "fit-catatan",
  tidak_fit_sementara: "tidak-fit-sementara",
  tidak_fit: "tidak-fit",
};

export default function StatusSummary({ checkups }: { checkups: Checkup[] }) {
  if (checkups.length === 0) return null;
  const latest = checkups[0];
  const days = daysUntil(latest.expiryDate);

  let validityClass = "validity-ok";
  let validityText = `Berlaku sampai ${formatDate(latest.expiryDate)} (${days} hari lagi)`;
  if (days < 0) {
    validityClass = "validity-expired";
    validityText = `Sudah kadaluarsa sejak ${formatDate(latest.expiryDate)}`;
  } else if (days <= 30) {
    validityClass = "validity-warn";
    validityText = `Berlaku sampai ${formatDate(latest.expiryDate)} — tinggal ${days} hari, jadwalkan checkup berikutnya`;
  }

  return (
    <div className="status-summary">
      <div className="status-summary-item">
        <div className="status-summary-label">Status kelayakan terkini</div>
        <span className={`status-badge ${STATUS_CLASS[latest.status]}`}>{FIT_STATUS_LABEL[latest.status]}</span>
        <div className="status-summary-sub">Dari checkup {formatDate(latest.date)}</div>
      </div>
      <div className="status-summary-item">
        <div className="status-summary-label">Masa berlaku</div>
        <div className={`validity-text ${validityClass}`}>{validityText}</div>
      </div>
    </div>
  );
}
