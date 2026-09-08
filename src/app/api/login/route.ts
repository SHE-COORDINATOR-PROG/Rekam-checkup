import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, computeSessionToken } from "@/lib/auth";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const { passphrase } = await req.json();
  const expectedPassphrase = process.env.APP_PASSPHRASE || "";

  if (!expectedPassphrase) {
    return NextResponse.json(
      { error: "APP_PASSPHRASE belum diset di environment variable server." },
      { status: 500 }
    );
  }

  if (passphrase !== expectedPassphrase) {
    return NextResponse.json({ error: "Kata sandi salah." }, { status: 401 });
  }

  const token = await computeSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
