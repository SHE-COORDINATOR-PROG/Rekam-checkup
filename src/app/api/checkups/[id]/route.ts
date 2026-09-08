import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export const runtime = "edge";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sql = getSql();
    await sql`delete from checkups where id = ${params.id}`;
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal menghapus checkup." }, { status: 500 });
  }
}
