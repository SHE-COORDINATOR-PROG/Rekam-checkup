-- Jalankan file ini sekali di Neon SQL Editor (Neon Console > SQL Editor)
-- untuk membuat tabel yang dipakai aplikasi.

create table if not exists checkups (
  id text primary key,
  date date not null,
  source text,
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
