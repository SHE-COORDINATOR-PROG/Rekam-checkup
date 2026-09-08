"use client";

import { useMemo, useState } from "react";
import type { DraftRow, PatientInfo, RiskTier } from "@/lib/types";
import { RISK_TIER_BOX_LABEL } from "@/lib/types";
import { computeRiskTier, parseRangeText, suggestKkrLevel, toNum } from "@/lib/parse";
import type { SaveCheckupInput } from "@/lib/useCheckups";

type Props = {
  initialRows: DraftRow[];
  initialPatientInfo: PatientInfo;
  source: string;
  parseNote: string;
  saving: boolean;
  onCancel: () => void;
  onSave: (input: Omit<SaveCheckupInput, "source">) => void;
};

export default function UploadReviewModal({
  initialRows,
  initialPatientInfo,
  source,
  parseNote,
  saving,
  onCancel,
  onSave,
}: Props) {
  const [date, setDate] = useState(initialPatientInfo.date);
  const [patientName, setPatientName] = useState(initialPatientInfo.patientName);
  const [employeeId, setEmployeeId] = useState(initialPatientInfo.employeeId);
  const [position, setPosition] = useState(initialPatientInfo.position);
  const [department, setDepartment] = useState(initialPatientInfo.department);
  const [company, setCompany] = useState(initialPatientInfo.company);
  const [rows, setRows] = useState<DraftRow[]>(initialRows);
  const [validityMonths, setValidityMonths] = useState(12);
  const [kkrOverride, setKkrOverride] = useState<RiskTier | null>(null);

  const computedRows = useMemo(
    () =>
      rows.map((r) => {
        const { rangeLow, rangeHigh } = r.rangeText ? parseRangeText(r.rangeText) : { rangeLow: r.rangeLow, rangeHigh: r.rangeHigh };
        const value = r.valueText ? toNum(r.valueText) : r.value;
        const riskTier = computeRiskTier({ value, rangeLow, rangeHigh, valueText: r.valueText, rangeText: r.rangeText });
        return { ...r, value, rangeLow, rangeHigh, riskTier };
      }),
    [rows]
  );
  const suggestedKkr = suggestKkrLevel(computedRows);
  const kkrLevel = kkrOverride ?? suggestedKkr;

  function updateRow(id: string, field: keyof DraftRow, value: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function addRow() {
    setRows((prev) => [
      ...prev,
      { id: "new" + Date.now(), category: "", name: "", value: null, valueText: "", unit: "", rangeLow: null, rangeHigh: null, rangeText: "", flagRaw: "" },
    ]);
  }

  function handleSave() {
    const cleaned = computedRows.filter((r) => r.name.trim().length > 0 && r.valueText.trim().length > 0);
    if (cleaned.length === 0) {
      alert("Tambahkan minimal satu hasil pemeriksaan.");
      return;
    }
    if (!patientName.trim()) {
      alert("Nama pasien/karyawan wajib diisi.");
      return;
    }
    onSave({ date, patientName, employeeId, position, department, company, kkrLevel, validityMonths, rows: cleaned });
  }

  return (
    <div className="overlay">
      <div className="modal modal-wide">
        <h2>Tinjau hasil ekstraksi</h2>
        <p className="sub">Periksa dan perbaiki data sebelum disimpan — pembacaan otomatis dari PDF tidak selalu sempurna, terutama baris kualitatif (Positif/Negatif).</p>
        <div className="parse-note">{parseNote}</div>

        <div className="field-row">
          <div className="field">
            <label>Nama pasien / karyawan</label>
            <input type="text" value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="Wajib diisi" />
          </div>
          <div className="field">
            <label>No. Lab / NRP</label>
            <input type="text" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} />
          </div>
          <div className="field">
            <label>Tanggal MCU</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label>Jabatan</label>
            <input type="text" value={position} onChange={(e) => setPosition(e.target.value)} />
          </div>
          <div className="field">
            <label>Departemen</label>
            <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} />
          </div>
          <div className="field" style={{ flex: 1, minWidth: 160 }}>
            <label>Perusahaan</label>
            <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label>Level KKR</label>
            <select value={kkrLevel} onChange={(e) => setKkrOverride(e.target.value as RiskTier)}>
              {(Object.keys(RISK_TIER_BOX_LABEL) as RiskTier[]).map((t) => (
                <option key={t} value={t}>
                  {RISK_TIER_BOX_LABEL[t]}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Masa berlaku</label>
            <select value={validityMonths} onChange={(e) => setValidityMonths(Number(e.target.value))}>
              <option value={6}>6 bulan</option>
              <option value={12}>12 bulan</option>
              <option value={24}>24 bulan</option>
            </select>
          </div>
          <div className="field" style={{ flex: 1, minWidth: 160 }}>
            <label>Sumber</label>
            <input type="text" value={source} readOnly />
          </div>
        </div>

        <table className="edit-table">
          <thead>
            <tr>
              <th style={{ width: "16%" }}>Kategori</th>
              <th style={{ width: "20%" }}>Pemeriksaan</th>
              <th style={{ width: "14%" }}>Hasil</th>
              <th style={{ width: "10%" }}>Satuan</th>
              <th style={{ width: "16%" }}>Rujukan</th>
              <th style={{ width: "12%" }}>Tingkat</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {computedRows.map((r) => (
              <tr key={r.id}>
                <td>
                  <input type="text" value={r.category} onChange={(e) => updateRow(r.id, "category", e.target.value)} />
                </td>
                <td>
                  <input type="text" value={r.name} onChange={(e) => updateRow(r.id, "name", e.target.value)} />
                </td>
                <td>
                  <input type="text" value={r.valueText} onChange={(e) => updateRow(r.id, "valueText", e.target.value)} />
                </td>
                <td>
                  <input type="text" value={r.unit} onChange={(e) => updateRow(r.id, "unit", e.target.value)} />
                </td>
                <td>
                  <input type="text" value={r.rangeText} onChange={(e) => updateRow(r.id, "rangeText", e.target.value)} />
                </td>
                <td>
                  <span className={`pill tier-${r.riskTier}`}>{RISK_TIER_BOX_LABEL[r.riskTier]}</span>
                </td>
                <td>
                  <button className="row-remove" onClick={() => removeRow(r.id)}>
                    ×
                  </button>
                </td>
              </tr>
            ))}
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
