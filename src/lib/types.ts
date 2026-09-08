export type Status = "normal" | "high" | "low";

export type ResultRow = {
  id: string;
  name: string;
  value: number;
  unit: string;
  rangeLow: number | null;
  rangeHigh: number | null;
  status: Status;
  note: string;
  resolved: boolean;
};

// Status kelayakan hasil medical checkup (kategori umum MCU kesehatan kerja
// di Indonesia): fit, fit dengan catatan, tidak fit sementara, tidak fit.
export type FitStatus = "fit" | "fit_catatan" | "tidak_fit_sementara" | "tidak_fit";

export const FIT_STATUS_LABEL: Record<FitStatus, string> = {
  fit: "Fit / Sehat",
  fit_catatan: "Fit dengan Catatan",
  tidak_fit_sementara: "Tidak Fit Sementara",
  tidak_fit: "Tidak Fit",
};

export type Checkup = {
  id: string;
  date: string; // ISO yyyy-mm-dd
  source: string;
  status: FitStatus;
  validityMonths: number;
  expiryDate: string; // ISO yyyy-mm-dd, tanggal checkup berikutnya jatuh tempo
  results: ResultRow[];
};

// Baris mentah hasil parsing PDF, sebelum di-review dan disimpan.
export type DraftRow = {
  id: string;
  name: string;
  value: number | null;
  unit: string;
  rangeLow: number | null;
  rangeHigh: number | null;
  flagRaw: string; // "", "H", "L"
};
