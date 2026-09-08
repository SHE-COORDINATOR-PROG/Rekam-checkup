"use client";

import { useMemo, useState } from "react";
import { useCheckups } from "@/lib/useCheckups";
import type { RiskTier } from "@/lib/types";
import { RISK_TIER_BOX_LABEL } from "@/lib/types";
import { daysUntil } from "@/lib/parse";
import { filterCheckups, countUnresolvedFollowUps, countExpiringSoon, kkrDistribution, abnormalTrend, topAbnormalTests } from "@/lib/stats";
import { formatDate } from "@/components/Timeline";
import AppShell from "@/components/AppShell";
import StatCard from "@/components/StatCard";
import FilterBar from "@/components/FilterBar";
import TrendChart from "@/components/charts/TrendChart";
import KkrDistributionChart from "@/components/charts/KkrDistributionChart";
import TopAbnormalChart from "@/components/charts/TopAbnormalChart";

export default function DashboardPage() {
  const { checkups, loading, lastUpdated, fetchCheckups, saveCheckup } = useCheckups();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [kkrLevel, setKkrLevel] = useState<RiskTier | "all">("all");

  const filtered = useMemo(() => filterCheckups(checkups, { from, to, kkrLevel }), [checkups, from, to, kkrLevel]);

  const unresolvedCount = useMemo(() => countUnresolvedFollowUps(filtered), [filtered]);
  const expiring = useMemo(() => countExpiringSoon(checkups), [checkups]); // masa berlaku selalu dari data penuh, bukan hasil filter
  const distribution = useMemo(() => kkrDistribution(filtered), [filtered]);
  const trend = useMemo(() => abnormalTrend(filtered), [filtered]);
  const topAbnormal = useMemo(() => topAbnormalTests(filtered), [filtered]);

  const latestLevel = checkups[0]?.kkrLevel;

  return (
    <AppShell
      title="Dashboard"
      subtitle="Ringkasan hasil dan kepatuhan medical checkup"
      lastUpdated={lastUpdated}
      onRefresh={fetchCheckups}
      onSaved={fetchCheckups}
      saveCheckup={saveCheckup}
    >
      {loading ? (
        <div className="empty-state">Memuat...</div>
      ) : (
        <>
          <FilterBar from={from} to={to} kkrLevel={kkrLevel} onFromChange={setFrom} onToChange={setTo} onKkrLevelChange={setKkrLevel} />

          <div className="stat-grid">
            <StatCard label="Total checkup" value={filtered.length} sub={`dari ${checkups.length} total tersimpan`} />
            <StatCard
              label="Level KKR terkini"
              value={latestLevel ? RISK_TIER_BOX_LABEL[latestLevel] : "—"}
              sub={checkups[0] ? `${checkups[0].patientName} · ${formatDate(checkups[0].date)}` : undefined}
              alert={latestLevel === "berat"}
            />
            <StatCard label="Perlu ditindaklanjuti" value={unresolvedCount} sub="hasil di luar rentang normal" alert={unresolvedCount > 0} />
            <StatCard
              label="Akan kadaluarsa ≤ 30 hari"
              value={expiring.length}
              sub={expiring[0] ? `berlaku sampai ${formatDate(expiring[0].expiryDate)}` : "tidak ada"}
              alert={expiring.length > 0}
            />
          </div>

          <div className="chart-grid">
            <div className="chart-panel">
              <h3>Tren hasil abnormal per checkup</h3>
              <TrendChart data={trend} />
            </div>
            <div className="chart-panel">
              <h3>Distribusi Level KKR</h3>
              <KkrDistributionChart data={distribution} />
            </div>
          </div>

          <div className="chart-grid">
            <div className="chart-panel">
              <h3>Pemeriksaan paling sering abnormal</h3>
              <TopAbnormalChart data={topAbnormal} />
            </div>
            <div className="chart-panel">
              <h3>Akan kadaluarsa ≤ 30 hari</h3>
              {expiring.length === 0 ? (
                <div className="chart-empty">Tidak ada checkup yang mendekati masa kadaluarsa.</div>
              ) : (
                <div className="expiry-list">
                  {expiring.map((c) => {
                    const days = daysUntil(c.expiryDate);
                    return (
                      <div className="expiry-row" key={c.id}>
                        <div>
                          <div className="name">{c.patientName || `Checkup ${formatDate(c.date)}`}</div>
                          <div className="meta">Berlaku sampai {formatDate(c.expiryDate)}</div>
                        </div>
                        <span className={`pill tier-${days < 0 ? "berat" : "sedang"}`}>
                          {days < 0 ? `Lewat ${Math.abs(days)} hari` : `${days} hari lagi`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
