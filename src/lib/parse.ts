import type { DraftRow, PatientInfo, RiskTier } from "./types";

// Penanda batas halaman yang disisipkan oleh pdf-extract.ts di antara halaman
// PDF, supaya parseLines() bisa mereset "section" pembacaan setiap ganti
// halaman (mis. berhenti membaca baris tabel hasil lab begitu masuk ke
// halaman lain seperti resume/kuesioner/KKR).
export const PAGE_BREAK_MARKER = "\u0000PAGE_BREAK\u0000";

export function toNum(s: string | null | undefined): number | null {
  if (s === undefined || s === null || s === "") return null;
  const direct = parseFloat(s.replace(",", "."));
  if (!isNaN(direct)) return direct;
  const cleaned = parseFloat(s.replace(/\./g, "").replace(",", "."));
  return isNaN(cleaned) ? null : cleaned;
}

// ---------------------------------------------------------------------------
// Deteksi baris judul kategori/subkategori, mis. "HEMATOLOGI", "Jumlah Sel Darah"
// ---------------------------------------------------------------------------

const HEADER_SKIP_RE =
  /^(pemeriksaan|flag|hasil|satuan|nilai\s*normal|kualitas\s*adalah\s*prioritas|h30-?pro\s*autoanalyzer)\b/i;

// Baris header kolom tabel hasil lab yang sesungguhnya, mis.
// "PEMERIKSAAN FLAG HASIL SATUAN NILAI NORMAL". Laporan MCU lengkap ("Buku
// Hasil MCU") berisi banyak halaman lain (resume, kuesioner, KKR, DASS-21,
// dst) yang formatnya berbeda dan TIDAK boleh ikut dibaca sebagai baris hasil
// lab — baris header inilah satu-satunya penanda "mulai baca" yang dipakai.
const LAB_TABLE_HEADER_RE = /^pemeriksaan\b.*\bflag\b.*\bhasil\b/i;

function isHeaderLine(line: string): boolean {
  if (line.includes(":")) return false;
  if (line.length < 3 || line.length > 40) return false;
  if (HEADER_SKIP_RE.test(line)) return false;
  if (/\d/.test(line)) return false;
  return /^[A-Za-zÀ-ÿ\s\-/]+$/.test(line);
}

function isAllCaps(line: string): boolean {
  const letters = line.replace(/[^A-Za-zÀ-ÿ]/g, "");
  return letters.length >= 3 && letters === letters.toUpperCase();
}

// ---------------------------------------------------------------------------
// Parsing baris hasil pemeriksaan
// ---------------------------------------------------------------------------

const ROW_NUMERIC_RE =
  /^(.+?)\s*:\s*([+*])?\s*([<>]?-?\d+[.,]?\d*)\s*([a-zA-Zµ%/³²]{0,10})\s*([<>]?\d+[.,]?\d*(?:\s*[-–]\s*\d+[.,]?\d*)?)?\s*$/;

const ROW_LABELED_NUM_RE =
  /^(.+?)\s*:\s*([+*])?\s*([A-Za-z]+)\s*:?\s*([\d.,]+)\s+([A-Za-z]+)\s*:?\s*([\d.,]+)\s*$/;

const QUAL_DOUBLE_RE =
  /^(Negatif|Positif\s*\d*|Normal|Kuning|Reaktif|Non\s*Reaktif)\s+(Negatif|Positif\s*\d*|Normal|Kuning|Reaktif|Non\s*Reaktif)$/i;

let counter = 0;

/**
 * Mengurai baris-baris teks hasil ekstraksi PDF menjadi baris hasil lab kandidat,
 * mengikuti format tabel PEMERIKSAAN | FLAG | HASIL | SATUAN | NILAI NORMAL.
 * Baris kualitatif (Negatif/Positif dst) sering butuh koreksi manual karena
 * ekstraksi teks PDF tidak menyimpan info kolom, hanya urutan kata.
 */
export function parseLines(lines: string[]): DraftRow[] {
  const rows: DraftRow[] = [];
  let topCategory = "";
  let subCategory = "";
  // Hanya baris di dalam tabel hasil lab asli (antara header "PEMERIKSAAN
  // FLAG HASIL SATUAN NILAI NORMAL" dan akhir halaman) yang boleh diproses.
  // Direset setiap ganti halaman supaya halaman non-lab (resume, kuesioner,
  // KKR, DASS-21, dst) tidak pernah ikut menghasilkan baris palsu.
  let inLabTable = false;

  for (const rawLine of lines) {
    if (rawLine === PAGE_BREAK_MARKER) {
      inLabTable = false;
      continue;
    }

    const line = rawLine.trim();
    if (line.length < 2) continue;

    if (LAB_TABLE_HEADER_RE.test(line)) {
      inLabTable = true;
      continue;
    }
    if (!inLabTable) continue;

    if (isHeaderLine(line)) {
      if (isAllCaps(line)) {
        topCategory = line;
        subCategory = "";
      } else {
        subCategory = line;
      }
      continue;
    }

    if (!line.includes(":")) continue;
    if (/^(tgl|no\.?\s*lab|nama|umur|j\.?\s*kel|dokter|nrp|jabatan|departemen|perusahaan|mess)/i.test(line)) continue;

    const category = [topCategory, subCategory].filter(Boolean).join(" - ");

    // Kasus khusus: "Label : angka Label : angka" (mis. hasil imunoserologi ber-titer)
    const labeledMatch = line.match(ROW_LABELED_NUM_RE);
    if (labeledMatch) {
      const [, rawName, flag, w1, n1, w2, n2] = labeledMatch;
      const name = rawName.trim();
      if (name.length >= 2) {
        rows.push({
          id: "draft" + counter++,
          category,
          name,
          value: null,
          valueText: `${w1} : ${n1}`,
          unit: "",
          rangeLow: null,
          rangeHigh: null,
          rangeText: `${w2} : ${n2}`,
          flagRaw: flag ? flag.toUpperCase() : "",
        });
        continue;
      }
    }

    const numMatch = line.match(ROW_NUMERIC_RE);
    if (numMatch) {
      const [, rawName, flag, rawValue, rawUnit, rawRange] = numMatch;
      const name = rawName.trim();
      const value = toNum(rawValue);
      if (name.length >= 2 && value !== null) {
        let rangeLow: number | null = null;
        let rangeHigh: number | null = null;
        if (rawRange) {
          const parts = rawRange.split(/[-–]/).map((p) => p.trim());
          if (parts.length === 2) {
            rangeLow = toNum(parts[0]);
            rangeHigh = toNum(parts[1]);
          } else if (rawRange.startsWith("<")) {
            rangeHigh = toNum(rawRange.slice(1));
          } else if (rawRange.startsWith(">")) {
            rangeLow = toNum(rawRange.slice(1));
          }
        }
        rows.push({
          id: "draft" + counter++,
          category,
          name,
          value,
          valueText: rawValue.trim(),
          unit: (rawUnit || "").trim(),
          rangeLow,
          rangeHigh,
          rangeText: rawRange ? rawRange.trim() : "",
          flagRaw: flag ? flag.toUpperCase() : "",
        });
        continue;
      }
    }

    // Fallback kualitatif: "Nama : [flag] hasil ... rujukan ..."
    const colonIdx = line.indexOf(":");
    const name = line.slice(0, colonIdx).trim();
    let rest = line.slice(colonIdx + 1).trim();
    if (name.length < 2 || name.length > 60) continue;

    let flag = "";
    const flagMatch = rest.match(/^([+*])\s*/);
    if (flagMatch) {
      flag = flagMatch[1];
      rest = rest.slice(flagMatch[0].length);
    }
    if (!rest) continue;

    const qualMatch = rest.match(QUAL_DOUBLE_RE);
    let valueText = rest;
    let rangeText = "";
    if (qualMatch) {
      valueText = qualMatch[1].trim();
      rangeText = qualMatch[2].trim();
    }

    rows.push({
      id: "draft" + counter++,
      category,
      name,
      value: null,
      valueText,
      unit: "",
      rangeLow: null,
      rangeHigh: null,
      rangeText,
      flagRaw: flag,
    });
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Ekstraksi info pasien/karyawan dari header laporan
// ---------------------------------------------------------------------------

const PATIENT_LABELS = [
  "No. Lab",
  "NRP",
  "Nama Lengkap",
  "Jabatan",
  "Departemen",
  "Perusahaan",
  "Tgl. MCU",
  "Tgl Periksa",
  "Nama",
  "No",
];

function extractField(fullText: string, label: string, stopLabels: string[]): string {
  const esc = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const stopAlt = stopLabels
    .filter((l) => l !== label)
    .map((l) => l.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const re = new RegExp(`(?:^|\\s)${esc}\\s*:?\\s*(.+?)(?=\\s+(?:${stopAlt})\\s*:|$)`, "i");
  const m = fullText.match(re);
  return m ? m[1].trim() : "";
}

/** Menebak identitas pasien/karyawan dan tanggal MCU dari teks header laporan. */
export function extractPatientInfo(lines: string[]): PatientInfo {
  const fullText = lines.filter((l) => l !== PAGE_BREAK_MARKER).join("   ");

  const nameFromFull = extractField(fullText, "Nama Lengkap", PATIENT_LABELS) || extractField(fullText, "Nama", PATIENT_LABELS);

  const rawDate =
    extractField(fullText, "Tgl. MCU", PATIENT_LABELS) || extractField(fullText, "Tgl Periksa", PATIENT_LABELS);

  return {
    patientName: nameFromFull,
    employeeId: extractField(fullText, "NRP", PATIENT_LABELS) || extractField(fullText, "No. Lab", PATIENT_LABELS),
    position: extractField(fullText, "Jabatan", PATIENT_LABELS),
    department: extractField(fullText, "Departemen", PATIENT_LABELS),
    company: extractField(fullText, "Perusahaan", PATIENT_LABELS),
    date: parseDateLoose(rawDate) || guessDate(lines),
  };
}

function parseDateLoose(s: string): string | null {
  if (!s) return null;
  // format "28-Aug-26" atau "28/08/26 14:43"
  const monthMap: Record<string, string> = {
    jan: "01",
    feb: "02",
    mar: "03",
    apr: "04",
    may: "05",
    mei: "05",
    jun: "06",
    jul: "07",
    aug: "08",
    agu: "08",
    sep: "09",
    oct: "10",
    okt: "10",
    nov: "11",
    dec: "12",
    des: "12",
  };
  const m1 = s.match(/(\d{1,2})[-\s]([A-Za-z]{3,})[-\s](\d{2,4})/);
  if (m1) {
    const [, d, monStr, y] = m1;
    const mon = monthMap[monStr.slice(0, 3).toLowerCase()];
    if (mon) {
      const year = y.length === 2 ? "20" + y : y;
      return `${year}-${mon}-${d.padStart(2, "0")}`;
    }
  }
  const m2 = s.match(/(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})/);
  if (m2) {
    let [, d, mo, y] = m2;
    if (y.length === 2) y = "20" + y;
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return null;
}

/** Menebak tanggal checkup dari teks PDF (format dd/mm/yyyy atau dd-mm-yyyy). Jatuh ke hari ini bila tidak ketemu. */
export function guessDate(lines: string[]): string {
  for (const l of lines) {
    const found = parseDateLoose(l);
    if (found) return found;
  }
  return new Date().toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Klasifikasi tingkat risiko (Rendah / Sedang / Berat)
// ---------------------------------------------------------------------------

/** Mengurai teks rujukan bebas (mis. "70 - 100", "< 45", "> 35") menjadi batas angka. */
export function parseRangeText(rangeText: string): { rangeLow: number | null; rangeHigh: number | null } {
  const t = (rangeText || "").trim();
  if (!t) return { rangeLow: null, rangeHigh: null };
  if (t.startsWith("<")) return { rangeLow: null, rangeHigh: toNum(t.slice(1)) };
  if (t.startsWith(">")) return { rangeLow: toNum(t.slice(1)), rangeHigh: null };
  const parts = t.split(/[-–]/).map((p) => p.trim());
  if (parts.length === 2 && toNum(parts[0]) !== null && toNum(parts[1]) !== null) {
    return { rangeLow: toNum(parts[0]), rangeHigh: toNum(parts[1]) };
  }
  return { rangeLow: null, rangeHigh: null };
}

/**
 * Perkiraan tingkat risiko per indikator berdasarkan seberapa jauh hasil
 * menyimpang dari rentang rujukan (untuk hasil numerik) atau kata kunci
 * "Positif/Reaktif" (untuk hasil kualitatif). Ini adalah pendekatan umum,
 * BUKAN replikasi persis algoritma penilaian klinik — selalu bisa diubah
 * manual agar sesuai laporan asli.
 */
export function computeRiskTier(row: {
  value: number | null;
  rangeLow: number | null;
  rangeHigh: number | null;
  valueText: string;
  rangeText: string;
  flagRaw?: string;
}): RiskTier {
  const flagged = !!(row.flagRaw && row.flagRaw.trim());

  let tier: RiskTier;
  if (row.value === null) {
    const v = (row.valueText || "").toLowerCase();
    const isAbnormalQual = /positif|reaktif/.test(v) && !/non\s*reaktif/.test(v);
    if (!isAbnormalQual) {
      tier = "rendah";
    } else {
      const gradeMatch = v.match(/(\d+)/);
      const grade = gradeMatch ? parseInt(gradeMatch[1], 10) : 1;
      tier = grade >= 3 ? "berat" : "sedang";
    }
  } else if (row.rangeLow === null && row.rangeHigh === null) {
    tier = "rendah";
  } else {
    let overBy = 0;
    if (row.rangeHigh !== null && row.value > row.rangeHigh) {
      const span = row.rangeHigh - (row.rangeLow ?? 0) || row.rangeHigh || 1;
      overBy = (row.value - row.rangeHigh) / span;
    } else if (row.rangeLow !== null && row.value < row.rangeLow) {
      const span = (row.rangeHigh ?? row.rangeLow * 2) - row.rangeLow || row.rangeLow || 1;
      overBy = (row.rangeLow - row.value) / span;
    }
    tier = overBy <= 0 ? "rendah" : overBy > 0.5 ? "berat" : "sedang";
  }

  // Kolom FLAG ("+"/"*") pada laporan asli selalu dicetak MERAH untuk menandai
  // hasil di luar rentang normal. Kalau baris ini berflag tapi tebakan
  // rentang/angka di atas keliru menyimpulkan "rendah", jangan pernah
  // menurunkan status merah itu jadi normal — minimal naikkan ke "sedang".
  if (flagged && tier === "rendah") return "sedang";
  return tier;
}

/** Level KKR keseluruhan = tingkat risiko terburuk di antara semua indikator. */
export function suggestKkrLevel(rows: Array<{ riskTier: RiskTier }>): RiskTier {
  if (rows.some((r) => r.riskTier === "berat")) return "berat";
  if (rows.some((r) => r.riskTier === "sedang")) return "sedang";
  return "rendah";
}

/** Format ringkas untuk daftar follow-up, mis. "135 mg/dL (rujukan 70-100) — perlu tindak lanjut / follow up segera". */
export function followUpNote(row: { valueText: string; unit: string; rangeText: string }, tier: RiskTier): string {
  if (tier === "rendah") return "";
  const valTxt = `${row.valueText}${row.unit ? " " + row.unit : ""}`;
  const base = row.rangeText ? `${valTxt} (rujukan ${row.rangeText})` : valTxt;
  return tier === "berat" ? `${base} — perlu tindak lanjut / follow up segera` : base;
}

/** Menambah sejumlah bulan ke tanggal ISO (yyyy-mm-dd), dipakai untuk menghitung masa berlaku checkup. */
export function addMonthsIso(dateIso: string, months: number): string {
  const d = new Date(dateIso + "T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

/** Sisa hari sampai tanggal kadaluarsa (negatif berarti sudah lewat). */
export function daysUntil(dateIso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateIso + "T00:00:00");
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

// ---------------------------------------------------------------------------
// Kesimpulan resmi "LEVEL KKR ANDA" (kalau ada di PDF, mis. dokumen "Buku
// Hasil MCU" lengkap dari klinik)
// ---------------------------------------------------------------------------

export type KkrConclusion = {
  rendah: number;
  sedang: number;
  berat: number;
  level: RiskTier;
};

/**
 * Membaca kesimpulan RESMI dari halaman "LEVEL KKR ANDA" milik klinik —
 * "JML INDIKATOR KKR RENDAH/SEDANG/BERAT" beserta kesimpulan akhirnya
 * (mis. `LEVEL KKR Anda "BERAT"`). Level KKR ini dihitung klinik dari 41
 * parameter (termasuk kuesioner, fisik, EKG, dll) yang jauh lebih lengkap
 * daripada baris hasil lab yang berhasil diparsing aplikasi ini — jadi kalau
 * halaman ini ditemukan, kesimpulannya HARUS dipakai apa adanya, bukan
 * ditimpa oleh tebakan `suggestKkrLevel()` dari baris lab saja. Halaman lain
 * seperti "RESUME HASIL MEDICAL CHECK UP" berisi ringkasan naratif yang
 * kadang keliru (mis. menyebut nilai yang sebenarnya masih normal sebagai
 * "meningkat") — TIDAK dipakai di sini, hanya kotak & kesimpulan resmi ini.
 */
export function extractKkrConclusion(lines: string[]): KkrConclusion | null {
  const fullText = lines.filter((l) => l !== PAGE_BREAK_MARKER).join("   ");

  const countsMatch = fullText.match(
    /JML\s*INDIKATOR\s*KKR\s*RENDAH.*?JML\s*INDIKATOR\s*KKR\s*SEDANG.*?JML\s*INDIKATOR\s*KKR\s*BERAT\D*(\d+)\D+?(\d+)\D+?(\d+)/i
  );
  const levelMatch = fullText.match(/LEVEL\s*KKR\s*Anda\s*[""'“”]*\s*(RENDAH|SEDANG|BERAT)/i);

  if (!countsMatch && !levelMatch) return null;

  const level: RiskTier = levelMatch ? (levelMatch[1].toLowerCase() as RiskTier) : "rendah";

  return {
    rendah: countsMatch ? parseInt(countsMatch[1], 10) : 0,
    sedang: countsMatch ? parseInt(countsMatch[2], 10) : 0,
    berat: countsMatch ? parseInt(countsMatch[3], 10) : 0,
    level,
  };
}
