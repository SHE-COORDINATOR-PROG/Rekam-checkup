import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { computeStatus, followUpNote } from "@/lib/parse";
import type { Checkup, ResultRow } from "@/lib/types";

export const runtime = "edge";

export async function GET() {
  try {
    const sql = getSql();
    const checkupRows = await sql`
      select id, to_char(date, 'YYYY-MM-DD') as date, source
      from checkups
      order by date desc, created_at desc
    `;
    const resultRows = await sql`
      select id, checkup_id, name, value, unit, range_low, range_high, status, note, resolved
      from results
      order by name
    `;

    const byCheckup: Record<string, ResultRow[]> = {};
    for (const r of resultRows as any[]) {
      const row: ResultRow = {
        id: r.id,
        name: r.name,
        value: Number(r.value),
        unit: r.unit || "",
        rangeLow: r.range_low === null ? null : Number(r.range_low),
        rangeHigh: r.range_high === null ? null : Number(r.range_high),
        status: r.status,
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
    const rows: Array<{
      name: string;
      value: number;
      unit: string;
      rangeLow: number | null;
      rangeHigh: number | null;
      flagRaw?: string;
    }> = body.results || [];

    if (!date || rows.length === 0) {
      return NextResponse.json({ error: "Tanggal dan minimal satu hasil pemeriksaan wajib diisi." }, { status: 400 });
    }

    const sql = getSql();
    const checkupId = crypto.randomUUID();
    await sql`insert into checkups (id, date, source) values (${checkupId}, ${date}, ${source})`;

    for (const row of rows) {
      if (!row.name || row.value === null || row.value === undefined) continue;
      const status = computeStatus(row);
      const note = followUpNote(row, status);
      const resultId = crypto.randomUUID();
      await sql`
        insert into results (id, checkup_id, name, value, unit, range_low, range_high, status, note, resolved)
        values (${resultId}, ${checkupId}, ${row.name}, ${row.value}, ${row.unit || ""}, ${row.rangeLow}, ${row.rangeHigh}, ${status}, ${note}, false)
      `;
    }

    return NextResponse.json({ id: checkupId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal menyimpan checkup." }, { status: 500 });
  }
}
