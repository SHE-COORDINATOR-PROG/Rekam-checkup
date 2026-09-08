-- Jalankan ini di Neon SQL Editor HANYA jika database Anda sudah dibuat
-- dari versi aplikasi sebelumnya (yang belum ada status kelayakan & masa
-- berlaku). Aman dijalankan berkali-kali.

alter table checkups add column if not exists status text not null default 'fit';
alter table checkups add column if not exists validity_months integer not null default 12;
alter table checkups add column if not exists expiry_date date;

-- Isi expiry_date untuk baris lama yang belum punya nilai (checkup lama
-- dianggap berlaku 12 bulan sejak tanggal checkup).
update checkups
set expiry_date = date + interval '12 months'
where expiry_date is null;
