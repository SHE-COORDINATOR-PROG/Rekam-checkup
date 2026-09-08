"use client";

import { useState } from "react";
import type { DraftRow } from "@/lib/types";
import { computeStatus } from "@/lib/parse";

type Props = {
  initialRows: DraftRow[];
  initialDate: string;
  source: string;
  parseNote: string;
  saving: boolean;
  onCancel: () => void;
  onSave: (date: string, rows: DraftRow[]) => void;
};

export default function UploadReviewModal({
  initialRows,
  initialDate,
  source,
  parseNote,
  saving,
  onCancel,
  onSave,
}: Props) {
  const [date, setDate] = useState(initialDate);
  const [rows, setRows] = useState<DraftRow[]>(initialRows);

  function updateRow(id: string, field: keyof DraftRow, value: string) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        if (field === "value" || field === "rangeLow" || field === "rangeHigh") {
          const n = value === "" ? null : parseFloat(value.replace(",", "."));
          return { ...r, [field]: isNaN(n as number) ? null : n };
        }
        return { ...r, [field]: value };
      })
    );
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function addRow() {
    setRows((prev) => [
      ...prev,
      { id: "new" + Date.now(), name: "", value: 0, unit: "", rangeLow: null, rangeHigh: null, flagRaw: "" },
    ]);
  }

  function handleSave() {
    const cleaned = rows.filter((r) => r.name.trim().length > 0 && r.value !== null);
    if (cleaned.length === 0) {
      alert("Tambahkan minimal satu hasil pemeriksaan.");
      return;
    }
    onSave(date, cleaned);
  }

  return (
    <div className="overlay">
      <div className="modal">
        <h2>Tinjau hasil ekstraksi</h2>
        <p className="sub">Periksa dan perbaiki data sebelum disimpan — pembacaan otomatis dari PDF tidak selalu sempurna.</p>
        <div className="parse-note">{parseNote}</div>

        <div className="field-row">
          <div className="field">
            <label>Tanggal checkup</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="field" style={{ flex: 1, minWidth: 180 }}>
            <label>Nama file / sumber</label>
            <input type="text" value={source} readOnly />
          </div>
        </div>

        <table className="edit-table">
          <thead>
            <tr>
              <th style={{ width: "26%" }}>Pemeriksaan</th>
              <th style={{ width: "14%" }}>Hasil</th>
              <th style={{ width: "12%" }}>Satuan</th>
              <th style={{ width: "12%" }}>Rujukan min</th>
              <th style={{ width: "12%" }}>Rujukan maks</th>
              <th style={{ width: "16%" }}>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const status = r.value !== null ? computeStatus({ ...r, value: r.value }) : "normal";
              return (
                <tr key={r.id}>
                  <td>
                    <input type="text" value={r.name} onChange={(e) => updateRow(r.id, "name", e.target.value)} />
                  </td>
                  <td>
                    <input
                      className="val-input"
                      type="text"
                      value={r.value ?? ""}
                      onChange={(e) => updateRow(r.id, "value", e.target.value)}
                    />
                  </td>
                  <td>
                    <input type="text" value={r.unit} onChange={(e) => updateRow(r.id, "unit", e.target.value)} />
                  </td>
                  <td>
                    <input
                      className="val-input"
                      type="text"
                      value={r.rangeLow ?? ""}
                      onChange={(e) => updateRow(r.id, "rangeLow", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="val-input"
                      type="text"
                      value={r.rangeHigh ?? ""}
                      onChange={(e) => updateRow(r.id, "rangeHigh", e.target.value)}
                    />
                  </td>
                  <td>
                    <select value={r.flagRaw} onChange={(e) => updateRow(r.id, "flagRaw", e.target.value)}>
                      <option value="">Normal</option>
                      <option value="H">Tinggi</option>
                      <option value="L">Rendah</option>
                    </select>
                  </td>
                  <td>
                    <button className="row-remove" onClick={() => removeRow(r.id)}>
                      ×
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <button className="add-row-btn" onClick={addRow}>
          + Tambah baris
        </button>

        <div className="modal-actions">
          <button className="btn-ghost" onClick={onCancel} disabled={saving}>
            Batal
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan checkup"}
          </button>
        </div>
      </div>
    </div>
  );
}
