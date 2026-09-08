"use client";

import { useCallback, useEffect, useState } from "react";
import type { Checkup, DraftRow, FitStatus } from "./types";

export function useCheckups() {
  const [checkups, setCheckups] = useState<Checkup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchCheckups = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/checkups");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memuat data.");
      setCheckups(data);
      setLastUpdated(new Date());
      return data as Checkup[];
    } catch (e: any) {
      setError(e.message || "Gagal memuat data.");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCheckups();
  }, [fetchCheckups]);

  async function saveCheckup(
    date: string,
    status: FitStatus,
    validityMonths: number,
    source: string,
    rows: DraftRow[]
  ) {
    const res = await fetch("/api/checkups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        status,
        validityMonths,
        source,
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
    await fetchCheckups();
    return data.id as string;
  }

  async function resolveItem(resultId: string) {
    const res = await fetch(`/api/results/${resultId}/resolve`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal menandai selesai.");
    await fetchCheckups();
  }

  return { checkups, loading, error, lastUpdated, fetchCheckups, saveCheckup, resolveItem };
}
