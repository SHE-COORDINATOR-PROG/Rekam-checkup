import type { Checkup, FitStatus } from "./types";
import { FIT_STATUS_LABEL } from "./types";
import { daysUntil } from "./parse";

export function filterCheckups(
  checkups: Checkup[],
  opts: { from?: string; to?: string; status?: FitStatus | "all" }
): Checkup[] {
  return checkups.filter((c) => {
    if (opts.from && c.date < opts.from) return false;
    if (opts.to && c.date > opts.to) return false;
    if (opts.status && opts.status !== "all" && c.status !== opts.status) return false;
    return true;
  });
}

export function countUnresolvedFollowUps(checkups: Checkup[]): number {
  return checkups.reduce((sum, c) => sum + c.results.filter((r) => r.status !== "normal" && !r.resolved).length, 0);
}

export function countExpiringSoon(checkups: Checkup[], withinDays = 30): Checkup[] {
  // Ambil checkup paling baru saja sebagai representasi "MCU aktif" saat ini,
  // supaya tidak menghitung checkup lama yang sudah digantikan checkup baru.
  if (checkups.length === 0) return [];
  const latest = checkups[0];
  const days = daysUntil(latest.expiryDate);
  return days <= withinDays ? [latest] : [];
}

export function statusDistribution(checkups: Checkup[]): Array<{ status: FitStatus; label: string; count: number }> {
  const order: FitStatus[] = ["fit", "fit_catatan", "tidak_fit_sementara", "tidak_fit"];
  return order.map((status) => ({
    status,
    label: FIT_STATUS_LABEL[status],
    count: checkups.filter((c) => c.status === status).length,
  }));
}

export function abnormalTrend(checkups: Checkup[]): Array<{ date: string; label: string; count: number }> {
  const sorted = [...checkups].sort((a, b) => a.date.localeCompare(b.date));
  return sorted.map((c) => ({
    date: c.date,
    label: new Date(c.date + "T00:00:00").toLocaleDateString("id-ID", { month: "short", year: "2-digit" }),
    count: c.results.filter((r) => r.status !== "normal").length,
  }));
}

export function topAbnormalTests(checkups: Checkup[], limit = 6): Array<{ name: string; count: number }> {
  const counts: Record<string, number> = {};
  checkups.forEach((c) => {
    c.results
      .filter((r) => r.status !== "normal")
      .forEach((r) => {
        counts[r.name] = (counts[r.name] || 0) + 1;
      });
  });
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
