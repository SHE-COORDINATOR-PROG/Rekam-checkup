"use client";

import type { Checkup } from "@/lib/types";
import { RISK_TIER_RESULT_LABEL } from "@/lib/types";
import LevelKkrCard from "./LevelKkrCard";

export default function DetailPanel({ checkups, selectedId }: { checkups: Checkup[]; selectedId: string | null }) {
  if (!selectedId) {
    return (
      <div className="panel">
        <div className="empty-state">
          <div className="serif">Belum ada data</div>
          <div>Unggah PDF hasil checkup pertama untuk mulai memantau.</div>
        </div>
      </div>
    );
  }

  const rec = checkups.find((c) => c.id === selectedId);
  if (!rec) return <div className="panel" />;

  // Kelompokkan hasil per kategori, urut sesuai kemunculan pertama.
  const groups: Array<{ category: string; rows: typeof rec.results }> = [];
  rec.results.forEach((r) => {
    const cat = r.category || "Lainnya";
    let g = groups.find((x) => x.category === cat);
    if (!g) {
      g = { category: cat, rows: [] };
      groups.push(g);
    }
    g.rows.push(r);
  });

  return (
    <>
      <LevelKkrCard checkup={rec} />
      <div className="panel">
        <h2>Hasil Pemeriksaan</h2>
        <p className="sub">{rec.source}</p>
        {groups.map((g) => (
          <div key={g.category} className="result-group">
            <div className="result-group-title">{g.category}</div>
            <table>
              <thead>
                <tr>
                  <th>Pemeriksaan</th>
                  <th>Flag</th>
                  <th className="num">Hasil</th>
                  <th>Satuan</th>
                  <th>Nilai Normal</th>
                  <th>Tingkat</th>
                </tr>
              </thead>
              <tbody>
                {g.rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td>{r.riskTier !== "rendah" ? "!" : ""}</td>
                    <td className="num">{r.valueText}</td>
                    <td>{r.unit || "—"}</td>
                    <td>{r.rangeText || (r.rangeLow != null && r.rangeHigh != null ? `${r.rangeLow}–${r.rangeHigh}` : "—")}</td>
                    <td>
                      <span className={`pill tier-${r.riskTier}`}>{RISK_TIER_RESULT_LABEL[r.riskTier]}</span>
                      {r.resolved && <span className="trend"> selesai</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </>
  );
}
