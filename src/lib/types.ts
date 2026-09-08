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

export type Checkup = {
  id: string;
  date: string; // ISO yyyy-mm-dd
  source: string;
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
