-- Jalankan file ini sekali di Neon SQL Editor untuk instalasi BARU.
-- Untuk database yang sudah ada dari versi sebelumnya, JANGAN jalankan
-- ini -- jalankan migration_2_status_validity.sql lalu
-- migration_3_kkr_dan_pasien.sql secara berurutan.

create table if not exists checkups (
  id text primary key,
  date date not null,
  source text,
  patient_name text not null default '',
  employee_id text default '',
  position text default '',
  department text default '',
  company text default '',
  kkr_level text not null default 'rendah',        -- rendah | sedang | berat
  validity_months integer not null default 12,
  expiry_date date,
  created_at timestamptz not null default now()
);

create table if not exists results (
  id text primary key,
  checkup_id text not null references checkups(id) on delete cascade,
  category text default '',                        -- mis. "Hematologi - Jumlah Sel Darah"
  name text not null,
  value numeric,                                    -- kosong untuk hasil kualitatif (Positif/Negatif dst)
  value_text text default '',                       -- teks hasil apa adanya, mis. "Positif 3"
  unit text,
  range_low numeric,
  range_high numeric,
  range_text text default '',                       -- rujukan kualitatif, mis. "Negatif"
  status text not null default 'normal',
  risk_tier text not null default 'rendah',          -- rendah | sedang | berat
  note text,
  resolved boolean not null default false
);

create index if not exists idx_results_checkup_id on results(checkup_id);
create index if not exists idx_checkups_date on checkups(date desc);
create index if not exists idx_checkups_patient_name on checkups (lower(patient_name));
