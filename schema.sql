-- Jalankan file ini sekali di Neon SQL Editor (Neon Console > SQL Editor)
-- untuk membuat tabel yang dipakai aplikasi (instalasi baru). Untuk database
-- yang sudah terlanjur dibuat dari versi sebelumnya, JANGAN jalankan file ini
-- lagi -- pakai migration_2_status_validity.sql saja.

create table if not exists checkups (
  id text primary key,
  date date not null,
  source text,
  status text not null default 'fit',              -- fit | fit_catatan | tidak_fit_sementara | tidak_fit
  validity_months integer not null default 12,      -- masa berlaku checkup dalam bulan
  expiry_date date,                                 -- tanggal checkup berikutnya jatuh tempo
  created_at timestamptz not null default now()
);

create table if not exists results (
  id text primary key,
  checkup_id text not null references checkups(id) on delete cascade,
  name text not null,
  value numeric not null,
  unit text,
  range_low numeric,
  range_high numeric,
  status text not null default 'normal',
  note text,
  resolved boolean not null default false
);

create index if not exists idx_results_checkup_id on results(checkup_id);
create index if not exists idx_checkups_date on checkups(date desc);
