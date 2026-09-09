"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import type { DraftRow, PatientInfo } from "@/lib/types";
import { parseLines, extractPatientInfo, extractKkrConclusion } from "@/lib/parse";
import type { KkrConclusion } from "@/lib/parse";
import { extractPdfLines } from "@/lib/pdf-extract";
import type { SaveCheckupInput } from "@/lib/useCheckups";
import UploadReviewModal from "./UploadReviewModal";

type Props = {
  title: string;
  subtitle: string;
  lastUpdated: Date | null;
  onRefresh: () => void;
  onSaved: (newCheckupId: string) => void;
  saveCheckup: (input: SaveCheckupInput) => Promise<string>;
  children: React.ReactNode;
};

export default function AppShell({ title, subtitle, lastUpdated, onRefresh, onSaved, saveCheckup, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [modal, setModal] = useState<{
    rows: DraftRow[];
    patientInfo: PatientInfo;
    source: string;
    parseNote: string;
    officialKkr: KkrConclusion | null;
  } | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const lines = await extractPdfLines(file);
      const rows = parseLines(lines);
      const patientInfo = extractPatientInfo(lines);
      const officialKkr = extractKkrConclusion(lines);
      const kkrNote = officialKkr
        ? ` Kesimpulan resmi terbaca dari halaman "LEVEL KKR ANDA": Level KKR ${officialKkr.level.toUpperCase()} (${officialKkr.rendah} rendah / ${officialKkr.sedang} sedang / ${officialKkr.berat} berat) — dipakai sebagai Level KKR default di bawah.`
        : "";
      setModal({
        rows,
        patientInfo,
        source: file.name,
        officialKkr,
        parseNote:
          (rows.length > 0
            ? `${rows.length} baris hasil terdeteksi otomatis dari tabel hasil lab. Periksa nilai, rujukan, dan data pasien di bawah sebelum menyimpan — baris kualitatif (Positif/Negatif) paling sering butuh koreksi.`
            : `Tidak ada baris yang terbaca otomatis dari tabel hasil lab pada file ini. Tambahkan hasil secara manual di bawah.`) + kkrNote,
      });
    } catch {
      setModal({
        rows: [],
        patientInfo: { patientName: "", employeeId: "", position: "", department: "", company: "", date: new Date().toISOString().slice(0, 10) },
        source: file.name,
        officialKkr: null,
        parseNote: `Gagal membaca PDF ini secara otomatis. Tambahkan hasil secara manual di bawah.`,
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSave(input: Omit<SaveCheckupInput, "source">) {
    setSaving(true);
    setUploadError("");
    try {
      const id = await saveCheckup({ ...input, source: modal?.source || "" });
      setModal(null);
      onSaved(id);
    } catch (e: any) {
      setUploadError(e.message || "Gagal menyimpan checkup.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const navItems = [
    { href: "/", label: "Dashboard", sub: "Ringkasan & grafik" },
    { href: "/riwayat", label: "Riwayat Checkup", sub: "Daftar & detail" },
  ];

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand serif">Rekam Checkup</div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={pathname === item.href ? "active" : ""}>
              <div>{item.label}</div>
              <div className="nav-sub">{item.sub}</div>
            </Link>
          ))}
          <button className="nav-upload" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
            <div>{uploading ? "Membaca PDF..." : "+ Unggah Checkup"}</div>
            <div className="nav-sub">Impor hasil dari PDF</div>
          </button>
          <input
            type="file"
            accept="application/pdf"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </nav>
        <div className="sidebar-footer">
          Level KKR (Rendah/Sedang/Berat) adalah perkiraan otomatis berdasarkan hasil pemeriksaan, mengikuti format
          laporan klinik — bukan alat diagnosis. Selalu rujuk kesimpulan resmi dari dokter/klinik.
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div>
            <h1 className="serif">{title}</h1>
            <p className="sub">{subtitle}</p>
          </div>
          <div className="topbar-meta">
            {lastUpdated && <span>Diperbarui {lastUpdated.toLocaleTimeString("id-ID")}</span>}
            <button className="refresh-btn" onClick={onRefresh}>
              Refresh
            </button>
            <button className="logout-link" onClick={handleLogout}>
              Keluar
            </button>
          </div>
        </div>

        {uploadError && <div className="error-banner">{uploadError}</div>}

        {children}

        <div className="disclaimer">
          Aplikasi ini membantu memantau dan merangkum hasil checkup — bukan alat diagnosis. Ekstraksi otomatis dari
          PDF bisa saja salah baca, jadi selalu periksa ulang hasil sebelum disimpan. Untuk hasil yang ditandai
          perlu ditindaklanjuti, konsultasikan dengan dokter atau tenaga medis.
        </div>
      </main>

      {modal && (
        <UploadReviewModal
          initialRows={modal.rows}
          initialPatientInfo={modal.patientInfo}
          source={modal.source}
          parseNote={modal.parseNote}
          officialKkr={modal.officialKkr}
          saving={saving}
          onCancel={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
