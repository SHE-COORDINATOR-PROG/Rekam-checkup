"use client";

import type { RiskTier } from "@/lib/types";
import { RISK_TIER_BOX_LABEL } from "@/lib/types";

type Props = {
  from: string;
  to: string;
  kkrLevel: RiskTier | "all";
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  onKkrLevelChange: (v: RiskTier | "all") => void;
};

export default function FilterBar({ from, to, kkrLevel, onFromChange, onToChange, onKkrLevelChange }: Props) {
  return (
    <div className="filter-bar">
      <div className="filter-field">
        <label>Dari tanggal</label>
        <input type="date" value={from} onChange={(e) => onFromChange(e.target.value)} />
      </div>
      <div className="filter-field">
        <label>Sampai tanggal</label>
        <input type="date" value={to} onChange={(e) => onToChange(e.target.value)} />
      </div>
      <div className="filter-field">
        <label>Level KKR</label>
        <select value={kkrLevel} onChange={(e) => onKkrLevelChange(e.target.value as RiskTier | "all")}>
          <option value="all">Semua level</option>
          {(Object.keys(RISK_TIER_BOX_LABEL) as RiskTier[]).map((t) => (
            <option key={t} value={t}>
              {RISK_TIER_BOX_LABEL[t]}
            </option>
          ))}
        </select>
      </div>
      {(from || to || kkrLevel !== "all") && (
        <button
          className="filter-clear"
          onClick={() => {
            onFromChange("");
            onToChange("");
            onKkrLevelChange("all");
          }}
        >
          Reset filter
        </button>
      )}
    </div>
  );
}
