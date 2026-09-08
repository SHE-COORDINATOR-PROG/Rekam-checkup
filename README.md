# Rekam Checkup

Dashboard pribadi untuk memantau hasil medical checkup. Unggah PDF hasil lab,
sistem otomatis membaca nilai-nilainya, dan hasil yang di luar rentang normal
ditandai untuk ditindaklanjuti. Dibangun dengan Next.js, disimpan di Neon
Postgres, di-deploy lewat Vercel.

Data disimpan sebagai satu akun pribadi (dilindungi satu kata sandi bersama) —
bukan aplikasi multi-user.

---

## 1. Siapkan database di Neon

1. Buat akun/project baru di [neon.tech](https://neon.tech) (gratis untuk skala pribadi).
2. Di dashboard Neon, buka **SQL Editor**, tempel isi file `schema.sql` dari
   proyek ini, lalu jalankan (Run). Ini membuat tabel `checkups` dan `results`.
3. Buka **Connection Details**, salin **connection string** yang berbentuk
   pooled connection, contoh:
   ```
   postgresql://user:password@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require
   ```
   Simpan ini — akan dipakai sebagai `DATABASE_URL` di Vercel.

## 2. Unggah kode ke GitHub

Proyek ini sudah disiapkan sebagai git repository lokal (`git init` + commit
pertama sudah dijalankan). Anda tinggal membuat repo kosong di GitHub lalu
menghubungkannya:

```bash
# di dalam folder proyek ini
git remote add origin https://github.com/USERNAME/rekam-checkup.git
git branch -M main
git push -u origin main
```

Ganti `USERNAME` dan nama repo sesuai punya Anda. Jika lebih suka pakai GitHub
CLI: `gh repo create rekam-checkup --private --source=. --push`.

## 3. Deploy ke Vercel

1. Buka [vercel.com](https://vercel.com) → **Add New Project** → pilih repo
   `rekam-checkup` yang baru di-push.
2. Vercel otomatis mendeteksi ini sebagai proyek Next.js — biarkan default.
3. Sebelum klik Deploy, buka bagian **Environment Variables** dan tambahkan tiga
   variabel berikut (nilainya lihat `.env.example`):

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | connection string dari Neon (langkah 1) |
   | `APP_PASSPHRASE` | kata sandi pilihan Anda sendiri untuk masuk ke dashboard |
   | `SESSION_SECRET` | string acak panjang, misal hasil dari `openssl rand -hex 32` |

4. Klik **Deploy**. Setelah selesai, buka URL yang diberikan Vercel — Anda akan
   diarahkan ke halaman login, masukkan `APP_PASSPHRASE` yang tadi diset.

Setiap kali Anda `git push` ke branch `main`, Vercel otomatis build & deploy
ulang.

## 4. Menjalankan secara lokal (opsional)

```bash
npm install
cp .env.example .env.local   # isi DATABASE_URL, APP_PASSPHRASE, SESSION_SECRET
npm run dev
```
Buka http://localhost:3000

## Catatan

- Ekstraksi PDF berjalan di browser (client-side) memakai pdf.js — file PDF
  tidak pernah diunggah utuh ke server, hanya baris hasil yang sudah Anda
  tinjau dan simpan yang dikirim ke database.
- Aplikasi ini alat bantu pemantauan pribadi, bukan alat diagnosis medis.
  Selalu konsultasikan hasil yang ditandai abnormal dengan dokter.
- Kalau parsing PDF sering salah baca untuk format lab tertentu, sesuaikan
  pola regex di `src/lib/parse.ts`.
