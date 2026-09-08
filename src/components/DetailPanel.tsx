"use client";

import type { Checkup } from "@/lib/types";
import { FIT_STATUS_LABEL } from "@/lib/types";
import { formatDate } from "./Timeline";

const statusLabel: Record<string, string> = { normal: "Normal", high: "Tinggi", low: "Rendah" };
const FIT_CLASS: Record<string, string> = {
  fit: "fit",
  fit_catatan: "fit-catatan",
  tidak_fit_sementara: "tidak-fit-sementara",
  tidak_fit: "tidak-fit",
};

export default function DetailPanel({ checkups, selectedId }: { checkups: Checkup[]; selectedId: string | null }) {
  if (!selectedId) {
    return (
      <div className="panel">
        <div className="empty-state">
          <div className="serif">Belum ada data</div>
          <div>Unggah PDF hasil checkup pertama Anda untuk mulai memantau.</div>
        </div>
      </div>
    );
  }

  const idx = checkups.findIndex((c) => c.id === selectedId);
  const rec = checkups[idx];
  if (!rec) return <div className="panel" />;

  // checkups terurut desc berdasarkan tanggal — checkup lebih lama ada di index sesudahnya
  const prevRec = checkups.slice(idx + 1).find((c) => c.date <= rec.date);
  const prevValues: Record<string, number> = {};
  if (prevRec) {
    prevRec.results.forEach((r) => {
      prevValues[r.name.toLowerCase()] = r.value;
    });
  }

  return (
    <div className="panel">
      <h2>{formatDate(rec.date)}</h2>
      <p className="sub">
        {rec.source} · <span className={`status-badge ${FIT_CLASS[rec.status]}`}>{FIT_STATUS_LABEL[rec.status]}</span>{" "}
        · berlaku sampai {formatDate(rec.expiryDate)}
      </p>
      <table>
        <thead>
          <tr>
            <th>Pemeriksaan</th>
            <th className="num">Hasil</th>
            <th>Satuan</th>
            <th>Rujukan</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rec.results.map((r) => {
            const range =
              r.rangeLow != null && r.rangeHigh != null
                ? `${r.rangeLow}–${r.rangeHigh}`
                : r.rangeLow != null
                ? `>${r.rangeLow}`
                : r.rangeHigh != null
                ? `<${r.rangeHigh}`
                : "—";
            const prev = prevValues[r.name.toLowerCase()];
            const trend = prev !== undefined && prev !== r.value ? (r.value > prev ? "↑" : "↓") : null;
            return (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td className="num">
                  {r.value}
                  {trend && (
                    <span className="trend">
                      {trend} dari {prev}
                    </span>
                  )}
                </td>
                <td>{r.unit || "—"}</td>
                <td>{range}</td>
                <td>
                  <span className={`pill ${r.status}`}>{statusLabel[r.status]}</span>
                  {r.resolved && <span className="trend"> selesai</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
