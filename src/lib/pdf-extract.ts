// Modul ini hanya dipakai di browser (dipanggil dari komponen client saat user
// memilih file). pdfjs-dist di-import secara dinamis supaya tidak ikut ke bundle
// server / SSR.

import { PAGE_BREAK_MARKER } from "./parse";

const PDFJS_VERSION = "3.11.174";
const WORKER_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;

export async function extractPdfLines(file: File): Promise<string[]> {
  const pdfjsLib: any = await import("pdfjs-dist/build/pdf");
  pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_URL;

  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;

  const lines: string[] = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const byY: Record<number, string[]> = {};
    content.items.forEach((it: any) => {
      const y = Math.round(it.transform[5]);
      byY[y] = byY[y] || [];
      byY[y].push(it.str);
    });
    const ys = Object.keys(byY)
      .map(Number)
      .sort((a, b) => b - a);
    ys.forEach((y) => lines.push(byY[y].join(" ").replace(/\s+/g, " ").trim()));
    lines.push(PAGE_BREAK_MARKER);
  }
  return lines.filter((l) => l.length > 0);
}
