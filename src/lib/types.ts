// Tingkat risiko per indikator maupun kesimpulan keseluruhan checkup, mengikuti
// format "Level KKR" (Kelompok Kesehatan Resiko) yang dipakai laporan klinik.
export type RiskTier = "rendah" | "sedang" | "berat";

// Label untuk pill per-hasil pemeriksaan (sesuai instruksi: normal/sedang/berat).
export const RISK_TIER_RESULT_LABEL: Record<RiskTier, string> = {
  rendah: "Normal",
  sedang: "Sedang",
  berat: "Berat",
};

// Label untuk kotak ringkasan jumlah indikator (meniru teks asli laporan klinik).
export const RISK_TIER_BOX_LABEL: Record<RiskTier, string> = {
  rendah: "RENDAH",
  sedang: "SEDANG",
  berat: "BERAT",
};

export type ResultRow = {
  id: string;
  category: string; // mis. "Hematologi - Jumlah Sel Darah"
  name: string;
  value: number | null; // null untuk hasil kualitatif
  valueText: string; // teks hasil apa adanya, mis. "16.4" atau "Positif 3"
  unit: string;
  rangeLow: number | null;
  rangeHigh: number | null;
  rangeText: string; // rujukan kualitatif apa adanya, mis. "Negatif"
  riskTier: RiskTier;
  note: string;
  resolved: boolean;
};

export type Checkup = {
  id: string;
  date: string; // ISO yyyy-mm-dd, tanggal MCU
  source: string;
  patientName: string;
  employeeId: string; // No. Lab / NRP
  position: string; // Jabatan
  department: string; // Departemen
  company: string; // Perusahaan
  kkrLevel: RiskTier;
  validityMonths: number;
  expiryDate: string; // ISO yyyy-mm-dd
  results: ResultRow[];
};

// Baris mentah hasil parsing PDF, sebelum di-review dan disimpan.
export type DraftRow = {
  id: string;
  category: string;
  name: string;
  value: number | null;
  valueText: string;
  unit: string;
  rangeLow: number | null;
  rangeHigh: number | null;
  rangeText: string;
  flagRaw: string; // "", "+", "*" - penanda dari kolom FLAG di laporan asli
};

export type PatientInfo = {
  patientName: string;
  employeeId: string;
  position: string;
  department: string;
  company: string;
  date: string; // tebakan tanggal MCU, ISO yyyy-mm-dd
};
