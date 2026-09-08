"use client";

import { useCallback, useEffect, useState } from "react";
import type { Checkup, DraftRow, RiskTier } from "./types";

export type SaveCheckupInput = {
  date: string;
  source: string;
  patientName: string;
  employeeId: string;
  position: string;
  department: string;
  company: string;
  kkrLevel: RiskTier;
  validityMonths: number;
  rows: DraftRow[];
};

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

  async function saveCheckup(input: SaveCheckupInput) {
    const res = await fetch("/api/checkups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: input.date,
        source: input.source,
        patientName: input.patientName,
        employeeId: input.employeeId,
        position: input.position,
        department: input.department,
        company: input.company,
        kkrLevel: input.kkrLevel,
        validityMonths: input.validityMonths,
        results: input.rows.map((r) => ({
          category: r.category,
          name: r.name,
          value: r.value,
          valueText: r.valueText,
          unit: r.unit,
          rangeLow: r.rangeLow,
          rangeHigh: r.rangeHigh,
          rangeText: r.rangeText,
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
