"use client";

import { useMemo, useState } from "react";
import { useCheckups } from "@/lib/useCheckups";
import { filterCheckups } from "@/lib/stats";
import AppShell from "@/components/AppShell";
import Timeline from "@/components/Timeline";
import AlertPanel from "@/components/AlertPanel";
import DetailPanel from "@/components/DetailPanel";

export default function RiwayatPage() {
  const { checkups, loading, lastUpdated, fetchCheckups, saveCheckup, resolveItem } = useCheckups();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => filterCheckups(checkups, { name: search }), [checkups, search]);
  const currentSelected = filtered.some((c) => c.id === selectedId) ? selectedId : filtered[0]?.id ?? null;

  async function handleSaved(newId: string) {
    await fetchCheckups();
    setSelectedId(newId);
  }

  return (
    <AppShell
      title="Riwayat Checkup"
      subtitle="Daftar checkup tersimpan beserta detail hasil pemeriksaan"
      lastUpdated={lastUpdated}
      onRefresh={fetchCheckups}
      onSaved={handleSaved}
      saveCheckup={saveCheckup}
    >
      {loading ? (
        <div className="empty-state">Memuat...</div>
      ) : (
        <>
          <input
            type="text"
            className="search-input"
            placeholder="Cari nama pasien/karyawan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="layout">
            <Timeline checkups={filtered} selectedId={currentSelected} onSelect={setSelectedId} />
            <div>
              <AlertPanel checkups={filtered} onResolve={resolveItem} />
              <DetailPanel checkups={filtered} selectedId={currentSelected} />
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
