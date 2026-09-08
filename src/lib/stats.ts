import type { Checkup, RiskTier } from "./types";
import { RISK_TIER_BOX_LABEL } from "./types";
import { daysUntil } from "./parse";

export function filterCheckups(
  checkups: Checkup[],
  opts: { from?: string; to?: string; kkrLevel?: RiskTier | "all"; name?: string }
): Checkup[] {
  return checkups.filter((c) => {
    if (opts.from && c.date < opts.from) return false;
    if (opts.to && c.date > opts.to) return false;
    if (opts.kkrLevel && opts.kkrLevel !== "all" && c.kkrLevel !== opts.kkrLevel) return false;
    if (opts.name && !c.patientName.toLowerCase().includes(opts.name.toLowerCase())) return false;
    return true;
  });
}

export function countUnresolvedFollowUps(checkups: Checkup[]): number {
  return checkups.reduce((sum, c) => sum + c.results.filter((r) => r.riskTier !== "rendah" && !r.resolved).length, 0);
}

export function countExpiringSoon(checkups: Checkup[], withinDays = 30): Checkup[] {
  if (checkups.length === 0) return [];
  const latest = checkups[0];
  const days = daysUntil(latest.expiryDate);
  return days <= withinDays ? [latest] : [];
}

export function kkrDistribution(checkups: Checkup[]): Array<{ tier: RiskTier; label: string; count: number }> {
  const order: RiskTier[] = ["rendah", "sedang", "berat"];
  return order.map((tier) => ({
    tier,
    label: RISK_TIER_BOX_LABEL[tier],
    count: checkups.filter((c) => c.kkrLevel === tier).length,
  }));
}

export function abnormalTrend(checkups: Checkup[]): Array<{ date: string; label: string; count: number }> {
  const sorted = [...checkups].sort((a, b) => a.date.localeCompare(b.date));
  return sorted.map((c) => ({
    date: c.date,
    label: new Date(c.date + "T00:00:00").toLocaleDateString("id-ID", { month: "short", year: "2-digit" }),
    count: c.results.filter((r) => r.riskTier !== "rendah").length,
  }));
}

export function topAbnormalTests(checkups: Checkup[], limit = 6): Array<{ name: string; count: number }> {
  const counts: Record<string, number> = {};
  checkups.forEach((c) => {
    c.results
      .filter((r) => r.riskTier !== "rendah")
      .forEach((r) => {
        counts[r.name] = (counts[r.name] || 0) + 1;
      });
  });
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
