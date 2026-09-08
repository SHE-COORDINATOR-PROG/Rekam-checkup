import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { computeRiskTier, followUpNote, addMonthsIso, suggestKkrLevel } from "@/lib/parse";
import type { Checkup, RiskTier, ResultRow } from "@/lib/types";

export const runtime = "edge";

export async function GET() {
  try {
    const sql = getSql();
    const checkupRows = await sql`
      select id, to_char(date, 'YYYY-MM-DD') as date, source,
             patient_name, employee_id, position, department, company,
             kkr_level, validity_months, to_char(expiry_date, 'YYYY-MM-DD') as expiry_date
      from checkups
      order by date desc, created_at desc
    `;
    const resultRows = await sql`
      select id, checkup_id, category, name, value, value_text, unit,
             range_low, range_high, range_text, risk_tier, note, resolved
      from results
      order by category, name
    `;

    const byCheckup: Record<string, ResultRow[]> = {};
    for (const r of resultRows as any[]) {
      const row: ResultRow = {
        id: r.id,
        category: r.category || "",
        name: r.name,
        value: r.value === null ? null : Number(r.value),
        valueText: r.value_text || (r.value !== null ? String(Number(r.value)) : ""),
        unit: r.unit || "",
        rangeLow: r.range_low === null ? null : Number(r.range_low),
        rangeHigh: r.range_high === null ? null : Number(r.range_high),
        rangeText: r.range_text || "",
        riskTier: (r.risk_tier || "rendah") as RiskTier,
        note: r.note || "",
        resolved: r.resolved,
      };
      byCheckup[r.checkup_id] = byCheckup[r.checkup_id] || [];
      byCheckup[r.checkup_id].push(row);
    }

    const checkups: Checkup[] = (checkupRows as any[]).map((c) => ({
      id: c.id,
      date: c.date,
      source: c.source || "",
      patientName: c.patient_name || "",
      employeeId: c.employee_id || "",
      position: c.position || "",
      department: c.department || "",
      company: c.company || "",
      kkrLevel: (c.kkr_level || "rendah") as RiskTier,
      validityMonths: c.validity_months ?? 12,
      expiryDate: c.expiry_date || addMonthsIso(c.date, c.validity_months ?? 12),
      results: byCheckup[c.id] || [],
    }));

    return NextResponse.json(checkups);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal memuat data." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const date: string = body.date;
    const source: string = body.source || "";
    const patientName: string = body.patientName || "";
    const employeeId: string = body.employeeId || "";
    const position: string = body.position || "";
    const department: string = body.department || "";
    const company: string = body.company || "";
    const validityMonths: number = Number(body.validityMonths) || 12;
    const rows: Array<{
      category: string;
      name: string;
      value: number | null;
      valueText: string;
      unit: string;
      rangeLow: number | null;
      rangeHigh: number | null;
      rangeText: string;
    }> = body.results || [];

    if (!date || rows.length === 0) {
      return NextResponse.json({ error: "Tanggal dan minimal satu hasil pemeriksaan wajib diisi." }, { status: 400 });
    }

    const computedRows = rows
      .filter((r) => r.name)
      .map((r) => ({ ...r, riskTier: computeRiskTier(r) }));

    const kkrLevel: RiskTier = body.kkrLevel || suggestKkrLevel(computedRows);
    const expiryDate = addMonthsIso(date, validityMonths);

    const sql = getSql();
    const checkupId = crypto.randomUUID();
    await sql`
      insert into checkups (id, date, source, patient_name, employee_id, position, department, company, kkr_level, validity_months, expiry_date)
      values (${checkupId}, ${date}, ${source}, ${patientName}, ${employeeId}, ${position}, ${department}, ${company}, ${kkrLevel}, ${validityMonths}, ${expiryDate})
    `;

    for (const row of computedRows) {
      const note = followUpNote(row, row.riskTier);
      const resultId = crypto.randomUUID();
      await sql`
        insert into results (id, checkup_id, category, name, value, value_text, unit, range_low, range_high, range_text, risk_tier, note, resolved)
        values (${resultId}, ${checkupId}, ${row.category || ""}, ${row.name}, ${row.value}, ${row.valueText || ""}, ${row.unit || ""}, ${row.rangeLow}, ${row.rangeHigh}, ${row.rangeText || ""}, ${row.riskTier}, ${note}, false)
      `;
    }

    return NextResponse.json({ id: checkupId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal menyimpan checkup." }, { status: 500 });
  }
}
