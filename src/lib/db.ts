import { neon } from "@neondatabase/serverless";

export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL belum diset. Tambahkan environment variable DATABASE_URL (connection string Neon) di Vercel."
    );
  }
  return neon(url);
}
