import type { DraftRow, Status } from "./types";

export function toNum(s: string | null | undefined): number | null {
  if (s === undefined || s === null || s === "") return null;
  const direct = parseFloat(s.replace(",", "."));
  if (!isNaN(direct)) return direct;
  const cleaned = parseFloat(s.replace(/\./g, "").replace(",", "."));
  return isNaN(cleaned) ? null : cleaned;
}

const LINE_RE =
  /^([A-Za-zÀ-ÿ0-9()/\-.\s]{3,55}?)\s{1,}([<>]?\s?-?\d+[.,]?\d*)\s*([a-zA-Zµ/%³²^0-9]{0,12})?\s*(H|L|Tinggi|Rendah|TINGGI|RENDAH)?\s*(?:(\d+[.,]?\d*)\s*[-–]\s*(\d+[.,]?\d*))?/;

const SKIP_LINE_RE = /^(hasil|pemeriksaan|nilai rujukan|satuan|nama|tanggal|no\.|halaman|page)\s*$/i;

/** Mengurai baris-baris teks hasil ekstraksi PDF menjadi baris hasil lab kandidat. */
export function parseLines(lines: string[]): DraftRow[] {
  const rows: DraftRow[] = [];
  let counter = 0;
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.length < 4) continue;
    if (SKIP_LINE_RE.test(line)) continue;
    const m = line.match(LINE_RE);
    if (!m) continue;

    let name = m[1].trim().replace(/\s{2,}/g, " ");
    if (name.length < 3 || /^\d+$/.test(name)) continue;

    const value = toNum(m[2]);
    if (value === null) continue;

    rows.push({
      id: "draft" + counter++,
      name,
      value,
      unit: (m[3] || "").trim(),
      rangeLow: m[5] ? toNum(m[5]) : null,
      rangeHigh: m[6] ? toNum(m[6]) : null,
      flagRaw: m[4] ? m[4].toUpperCase() : "",
    });
  }
  return rows;
}

/** Menebak tanggal checkup dari teks PDF (format dd/mm/yyyy atau dd-mm-yyyy). Jatuh ke hari ini bila tidak ketemu. */
export function guessDate(lines: string[]): string {
  const re = /(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})/;
  for (const l of lines) {
    const m = l.match(re);
    if (m) {
      let [, d, mo, y] = m;
      if (y.length === 2) y = "20" + y;
      const dd = d.padStart(2, "0");
      const mm = mo.padStart(2, "0");
      if (+mm >= 1 && +mm <= 12 && +dd >= 1 && +dd <= 31) return `${y}-${mm}-${dd}`;
    }
  }
  return new Date().toISOString().slice(0, 10);
}

export function computeStatus(row: {
  value: number;
  rangeLow: number | null;
  rangeHigh: number | null;
  flagRaw?: string;
}): Status {
  const f = (row.flagRaw || "").toUpperCase();
  if (f === "H" || f === "TINGGI") return "high";
  if (f === "L" || f === "RENDAH") return "low";
  if (row.rangeHigh !== null && row.rangeHigh !== undefined && row.value > row.rangeHigh) return "high";
  if (row.rangeLow !== null && row.rangeLow !== undefined && row.value < row.rangeLow) return "low";
  return "normal";
}

export function followUpNote(
  row: { name: string; value: number; unit: string; rangeLow: number | null; rangeHigh: number | null },
  status: Status
): string {
  if (status === "normal") return "";
  const rangeTxt =
    row.rangeLow != null && row.rangeHigh != null
      ? `normal: ${row.rangeLow}–${row.rangeHigh} ${row.unit || ""}`.trim()
      : "";
  const arah = status === "high" ? "di atas" : "di bawah";
  return `Hasil ${row.name} (${row.value}${row.unit ? " " + row.unit : ""}) berada ${arah} rentang normal${
    rangeTxt ? " (" + rangeTxt + ")" : ""
  }. Sebaiknya didiskusikan dengan dokter.`;
}
