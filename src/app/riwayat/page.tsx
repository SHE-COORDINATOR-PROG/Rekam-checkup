"use client";

import { useState } from "react";
import { useCheckups } from "@/lib/useCheckups";
import AppShell from "@/components/AppShell";
import StatusSummary from "@/components/StatusSummary";
import Timeline from "@/components/Timeline";
import AlertPanel from "@/components/AlertPanel";
import DetailPanel from "@/components/DetailPanel";

export default function RiwayatPage() {
  const { checkups, loading, lastUpdated, fetchCheckups, saveCheckup, resolveItem } = useCheckups();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const currentSelected = selectedId ?? checkups[0]?.id ?? null;

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
          <StatusSummary checkups={checkups} />
          <div className="layout">
            <Timeline checkups={checkups} selectedId={currentSelected} onSelect={setSelectedId} />
            <div>
              <AlertPanel checkups={checkups} onResolve={resolveItem} />
              <DetailPanel checkups={checkups} selectedId={currentSelected} />
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
