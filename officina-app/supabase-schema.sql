-- ============================================================
-- Schema per il Gestionale Officina
-- Da eseguire una sola volta in Supabase: Project > SQL Editor > New query
-- Incolla tutto questo file e premi "Run".
-- ============================================================

create table if not exists clients (
  id text primary key,
  nome text default '',
  cognome text default '',
  telefono text default '',
  note text default '',
  "docFronte" text,
  "docRetro" text,
  auto jsonb default '[]'::jsonb,
  "createdAt" bigint
);

create table if not exists appointments (
  id text primary key,
  "clientId" text references clients(id) on delete set null,
  "clientNome" text default '',
  "clientCognome" text default '',
  "clientTelefono" text default '',
  auto jsonb default '{}'::jsonb,
  "fotoAuto" text,
  lavoro text default '',
  note text default '',
  data text,
  ora text,
  preventivo text,
  "createdAt" bigint,
  "updatedAt" bigint
);

create index if not exists appointments_data_idx on appointments (data);
create index if not exists appointments_client_idx on appointments ("clientId");

-- ============================================================
-- Sicurezza: l'app usa la chiave "anon" pubblica direttamente dal
-- browser (non c'è login per Cesare, come richiesto). Le policy qui
-- sotto permettono a chiunque abbia il link dell'app di leggere e
-- scrivere i dati. Va bene per un gestionale interno a un'unica
-- officina, ma tieni presente che chiunque conosca l'URL Supabase e
-- la chiave anon (visibili nel codice del sito) può accedere ai dati.
-- Se in futuro vorrai più sicurezza, si può aggiungere un login.
-- ============================================================

alter table clients enable row level security;
alter table appointments enable row level security;

create policy "consenti tutto ai clienti" on clients
  for all using (true) with check (true);

create policy "consenti tutto agli appuntamenti" on appointments
  for all using (true) with check (true);
