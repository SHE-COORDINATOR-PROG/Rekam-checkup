"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Checkup, DraftRow, FitStatus } from "@/lib/types";
import { parseLines, guessDate } from "@/lib/parse";
import { extractPdfLines } from "@/lib/pdf-extract";
import Timeline from "./Timeline";
import AlertPanel from "./AlertPanel";
import DetailPanel from "./DetailPanel";
import UploadReviewModal from "./UploadReviewModal";
import StatusSummary from "./StatusSummary";

export default function Dashboard() {
  const [checkups, setCheckups] = useState<Checkup[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [modal, setModal] = useState<{
    rows: DraftRow[];
    date: string;
    source: string;
    parseNote: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function fetchCheckups(selectAfter?: string) {
    setError("");
    try {
      const res = await fetch("/api/checkups");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memuat data.");
      setCheckups(data);
      if (selectAfter) {
        setSelectedId(selectAfter);
      } else if (!selectedId && data.length > 0) {
        setSelectedId(data[0].id);
      }
    } catch (e: any) {
      setError(e.message || "Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCheckups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const lines = await extractPdfLines(file);
      const rows = parseLines(lines);
      const date = guessDate(lines);
      setModal({
        rows,
        date,
        source: file.name,
        parseNote:
          rows.length > 0
            ? `${rows.length} baris hasil terdeteksi otomatis. Periksa nilai dan rentang normal di bawah sebelum menyimpan.`
            : `Tidak ada baris yang terbaca otomatis dari file ini. Tambahkan hasil secara manual di bawah.`,
      });
    } catch (err) {
      setModal({
        rows: [],
        date: new Date().toISOString().slice(0, 10),
        source: file.name,
        parseNote: `Gagal membaca PDF ini secara otomatis. Tambahkan hasil secara manual di bawah.`,
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSaveCheckup(date: string, status: FitStatus, validityMonths: number, rows: DraftRow[]) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/checkups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          status,
          validityMonths,
          source: modal?.source || "",
          results: rows.map((r) => ({
            name: r.name,
            value: r.value,
            unit: r.unit,
            rangeLow: r.rangeLow,
            rangeHigh: r.rangeHigh,
            flagRaw: r.flagRaw,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan checkup.");
      setModal(null);
      await fetchCheckups(data.id);
    } catch (e: any) {
      setError(e.message || "Gagal menyimpan checkup.");
    } finally {
      setSaving(false);
    }
  }

  async function handleResolve(resultId: string) {
    setError("");
    try {
      const res = await fetch(`/api/results/${resultId}/resolve`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menandai selesai.");
      await fetchCheckups(selectedId || undefined);
    } catch (e: any) {
      setError(e.message || "Gagal menandai selesai.");
    }
  }

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="app">
      <div className="masthead">
        <div>
          <h1>Rekam Checkup</h1>
          <p>Unggah hasil medical checkup dalam PDF. Nilai di luar rentang normal otomatis ditandai untuk ditindaklanjuti.</p>
        </div>
        <div className="header-actions">
          <input
            type="file"
            accept="application/pdf"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <button className="upload-btn" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
            {uploading ? "Membaca PDF..." : "Unggah PDF"}
          </button>
          <button className="logout-link" onClick={handleLogout}>
            Keluar
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="empty-state">Memuat...</div>
      ) : (
        <>
          <StatusSummary checkups={checkups} />
          <div className="layout">
            <Timeline checkups={checkups} selectedId={selectedId} onSelect={setSelectedId} />
            <div>
              <AlertPanel checkups={checkups} onResolve={handleResolve} />
              <DetailPanel checkups={checkups} selectedId={selectedId} />
            </div>
          </div>
        </>
      )}

      <div className="disclaimer">
        Aplikasi ini membantu memantau dan merangkum hasil checkup secara pribadi — bukan alat diagnosis. Ekstraksi
        otomatis dari PDF bisa saja salah baca, jadi selalu periksa ulang hasil sebelum disimpan. Untuk hasil yang
        ditandai perlu ditindaklanjuti, konsultasikan dengan dokter atau tenaga medis.
      </div>

      {modal && (
        <UploadReviewModal
          initialRows={modal.rows}
          initialDate={modal.date}
          source={modal.source}
          parseNote={modal.parseNote}
          saving={saving}
          onCancel={() => setModal(null)}
          onSave={handleSaveCheckup}
        />
      )}
    </div>
  );
}
