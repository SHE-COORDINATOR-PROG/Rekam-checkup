"use client";

import { useMemo, useState } from "react";
import { useCheckups } from "@/lib/useCheckups";
import type { FitStatus } from "@/lib/types";
import { FIT_STATUS_LABEL } from "@/lib/types";
import { daysUntil } from "@/lib/parse";
import { filterCheckups, countUnresolvedFollowUps, countExpiringSoon, statusDistribution, abnormalTrend, topAbnormalTests } from "@/lib/stats";
import { formatDate } from "@/components/Timeline";
import AppShell from "@/components/AppShell";
import StatCard from "@/components/StatCard";
import FilterBar from "@/components/FilterBar";
import TrendChart from "@/components/charts/TrendChart";
import StatusDistributionChart from "@/components/charts/StatusDistributionChart";
import TopAbnormalChart from "@/components/charts/TopAbnormalChart";

export default function DashboardPage() {
  const { checkups, loading, lastUpdated, fetchCheckups, saveCheckup } = useCheckups();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState<FitStatus | "all">("all");

  const filtered = useMemo(() => filterCheckups(checkups, { from, to, status }), [checkups, from, to, status]);

  const unresolvedCount = useMemo(() => countUnresolvedFollowUps(filtered), [filtered]);
  const expiring = useMemo(() => countExpiringSoon(checkups), [checkups]); // masa berlaku selalu dari data penuh, bukan hasil filter
  const distribution = useMemo(() => statusDistribution(filtered), [filtered]);
  const trend = useMemo(() => abnormalTrend(filtered), [filtered]);
  const topAbnormal = useMemo(() => topAbnormalTests(filtered), [filtered]);

  const latestStatus = checkups[0]?.status;

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
          <FilterBar from={from} to={to} status={status} onFromChange={setFrom} onToChange={setTo} onStatusChange={setStatus} />

          <div className="stat-grid">
            <StatCard label="Total checkup" value={filtered.length} sub={`dari ${checkups.length} total tersimpan`} />
            <StatCard
              label="Status kelayakan terkini"
              value={latestStatus ? FIT_STATUS_LABEL[latestStatus] : "—"}
              sub={checkups[0] ? `Checkup ${formatDate(checkups[0].date)}` : undefined}
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
              <h3>Distribusi status kelayakan</h3>
              <StatusDistributionChart data={distribution} />
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
                          <div className="name">Checkup {formatDate(c.date)}</div>
                          <div className="meta">Berlaku sampai {formatDate(c.expiryDate)}</div>
                        </div>
                        <span className={`pill ${days < 0 ? "high" : "low"}`}>
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
