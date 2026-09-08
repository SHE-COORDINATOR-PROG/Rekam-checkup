"use client";

import type { FitStatus } from "@/lib/types";
import { FIT_STATUS_LABEL } from "@/lib/types";

type Props = {
  from: string;
  to: string;
  status: FitStatus | "all";
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  onStatusChange: (v: FitStatus | "all") => void;
};

export default function FilterBar({ from, to, status, onFromChange, onToChange, onStatusChange }: Props) {
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
        <label>Status kelayakan</label>
        <select value={status} onChange={(e) => onStatusChange(e.target.value as FitStatus | "all")}>
          <option value="all">Semua status</option>
          {(Object.keys(FIT_STATUS_LABEL) as FitStatus[]).map((s) => (
            <option key={s} value={s}>
              {FIT_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>
      {(from || to || status !== "all") && (
        <button
          className="filter-clear"
          onClick={() => {
            onFromChange("");
            onToChange("");
            onStatusChange("all");
          }}
        >
          Reset filter
        </button>
      )}
    </div>
  );
}
