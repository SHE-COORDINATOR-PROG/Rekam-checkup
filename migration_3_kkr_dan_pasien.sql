-- Jalankan di Neon SQL Editor. Aman dijalankan berkali-kali.
-- Menambahkan data identitas pasien/karyawan dan sistem Level KKR
-- (Rendah/Sedang/Berat) menggantikan status kelayakan 4-tingkat sebelumnya,
-- mengikuti format laporan "Level KKR Anda" dari Klinik Ultra Medica.

alter table checkups add column if not exists patient_name text not null default '';
alter table checkups add column if not exists employee_id text default '';
alter table checkups add column if not exists position text default '';
alter table checkups add column if not exists department text default '';
alter table checkups add column if not exists company text default '';
alter table checkups add column if not exists kkr_level text not null default 'rendah'; -- rendah | sedang | berat

alter table results alter column value drop not null;
alter table results add column if not exists value_text text default '';
alter table results add column if not exists range_text text default '';
alter table results add column if not exists category text default '';
alter table results add column if not exists risk_tier text not null default 'rendah'; -- rendah | sedang | berat

create index if not exists idx_checkups_patient_name on checkups (lower(patient_name));
