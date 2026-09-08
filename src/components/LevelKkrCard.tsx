"use client";

import type { Checkup, RiskTier } from "@/lib/types";
import { RISK_TIER_BOX_LABEL, RISK_TIER_RESULT_LABEL } from "@/lib/types";
import { daysUntil } from "@/lib/parse";
import { formatDate } from "./Timeline";

function countByTier(checkup: Checkup, tier: RiskTier) {
  return checkup.results.filter((r) => r.riskTier === tier).length;
}

export default function LevelKkrCard({ checkup }: { checkup: Checkup }) {
  const days = daysUntil(checkup.expiryDate);
  const rendah = countByTier(checkup, "rendah");
  const sedang = countByTier(checkup, "sedang");
  const berat = countByTier(checkup, "berat");

  return (
    <div className="kkr-card">
      <div className="kkr-card-title">LEVEL KKR ANDA</div>

      <div className="kkr-info-grid">
        <div>
          <span className="kkr-info-label">No. Lab</span>
          <span className="kkr-info-value">{checkup.employeeId || "—"}</span>
        </div>
        <div>
          <span className="kkr-info-label">Jabatan</span>
          <span className="kkr-info-value">{checkup.position || "—"}</span>
        </div>
        <div>
          <span className="kkr-info-label">Nama Lengkap</span>
          <span className="kkr-info-value">{checkup.patientName || "—"}</span>
        </div>
        <div>
          <span className="kkr-info-label">Departemen</span>
          <span className="kkr-info-value">{checkup.department || "—"}</span>
        </div>
        <div>
          <span className="kkr-info-label">Perusahaan</span>
          <span className="kkr-info-value">{checkup.company || "—"}</span>
        </div>
        <div>
          <span className="kkr-info-label">Tgl. MCU</span>
          <span className="kkr-info-value">{formatDate(checkup.date)}</span>
        </div>
      </div>

      <div className="kkr-sub">Berdasarkan Indikator Level Tingkat Risiko Anda:</div>
      <div className="kkr-box-grid">
        <div className="kkr-box kkr-box-rendah">
          <div className="kkr-box-label">JML INDIKATOR KKR RENDAH</div>
          <div className="kkr-box-count">{rendah}</div>
        </div>
        <div className="kkr-box kkr-box-sedang">
          <div className="kkr-box-label">JML INDIKATOR KKR SEDANG</div>
          <div className="kkr-box-count">{sedang}</div>
        </div>
        <div className="kkr-box kkr-box-berat">
          <div className="kkr-box-label">JML INDIKATOR KKR BERAT</div>
          <div className="kkr-box-count">{berat}</div>
        </div>
      </div>

      <div className="kkr-conclusion">
        Maka Level KKR Anda: <span className={`kkr-conclusion-value tier-${checkup.kkrLevel}`}>{RISK_TIER_BOX_LABEL[checkup.kkrLevel]}</span>
      </div>

      <div className={`validity-text ${days < 0 ? "validity-expired" : days <= 30 ? "validity-warn" : "validity-ok"}`}>
        {days < 0
          ? `Masa berlaku sudah lewat sejak ${formatDate(checkup.expiryDate)}`
          : `Berlaku sampai ${formatDate(checkup.expiryDate)} (${days} hari lagi)`}
      </div>

      {checkup.kkrLevel !== "rendah" && <KkrFollowUp checkup={checkup} />}
    </div>
  );
}

/**
 * Ditampilkan hanya bila Level KKR "Sedang" atau "Berat": daftar temuan
 * (hasil yang tidak normal) dan pesan wajib follow up, meniru bunyi
 * instruksi pada laporan "LEVEL KKR ANDA" dari klinik.
 */
function KkrFollowUp({ checkup }: { checkup: Checkup }) {
  const temuan = checkup.results.filter((r) => r.riskTier !== "rendah");
  const isBerat = checkup.kkrLevel === "berat";

  return (
    <div className={`kkr-followup ${isBerat ? "kkr-followup-berat" : "kkr-followup-sedang"}`}>
      <div className="kkr-followup-title">Temuan yang perlu ditindaklanjuti</div>
      {temuan.length > 0 && (
        <ul className="kkr-followup-list">
          {temuan.map((r) => (
            <li key={r.id}>
              <span className="kkr-followup-name">{r.name}</span>
              {r.note ? `: ${r.note}` : ""}
              <span className={`pill tier-${r.riskTier}`}> {RISK_TIER_RESULT_LABEL[r.riskTier]}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="kkr-followup-action">
        {isBerat
          ? <>Level KKR Anda <strong>&ldquo;BERAT&rdquo;</strong> — segera lakukan <strong>Follow Up MCU</strong> ke klinik agar Level KKR Anda dinyatakan <strong>CLOSED</strong> di sistem INCA.</>
          : <>Level KKR Anda <strong>&ldquo;SEDANG&rdquo;</strong> — disarankan melakukan <strong>Follow Up MCU</strong> ke klinik agar Level KKR Anda dinyatakan <strong>CLOSED</strong> di sistem INCA.</>}
      </div>
    </div>
  );
}
