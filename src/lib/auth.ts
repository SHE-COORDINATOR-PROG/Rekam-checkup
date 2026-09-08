// Autentikasi sederhana berbasis satu passphrase bersama (aplikasi untuk
// pemakaian pribadi, bukan multi-user). Token sesi = SHA-256(passphrase + secret),
// dihitung ulang di middleware untuk memverifikasi cookie tanpa perlu database sesi.

export const SESSION_COOKIE = "mc_session";

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function computeSessionToken(): Promise<string> {
  const passphrase = process.env.APP_PASSPHRASE || "";
  const secret = process.env.SESSION_SECRET || "";
  return sha256Hex(`${passphrase}::${secret}`);
}
