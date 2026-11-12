-- =============================================================================
-- King of the Streets Cup — Supabase Postgres & Realtime Schema
-- Run this script in your Supabase Project -> SQL Editor
-- =============================================================================

-- 1. Canonical Tournament State Table (Matches, Standings, 7-Aside Squads, 1v1 Players)
create table if not exists public.tournament_state (
  id text primary key,
  teams_7aside jsonb not null default '[]'::jsonb,
  players_1v1 jsonb not null default '[]'::jsonb,
  matches jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security (RLS)
alter table public.tournament_state enable row level security;

-- Grant Data API access to anon and authenticated roles
grant select, insert, update on public.tournament_state to anon, authenticated;

-- RLS Policies for tournament_state (Public read for 300-1,000 spectators; upsert for Admin sync)
drop policy if exists "tournament_state_select_all" on public.tournament_state;
create policy "tournament_state_select_all"
  on public.tournament_state
  for select
  to anon, authenticated
  using (true);

drop policy if exists "tournament_state_insert_sync" on public.tournament_state;
create policy "tournament_state_insert_sync"
  on public.tournament_state
  for insert
  to anon, authenticated
  with check (id = 'kots-2026');

drop policy if exists "tournament_state_update_sync" on public.tournament_state;
create policy "tournament_state_update_sync"
  on public.tournament_state
  for update
  to anon, authenticated
  using (id = 'kots-2026')
  with check (id = 'kots-2026');

-- Enable Supabase Realtime WebSocket broadcasts on tournament_state
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'tournament_state'
  ) then
    alter publication supabase_realtime add table public.tournament_state;
  end if;
end $$;


-- 2. User Accounts Table (Spectator Sign-Up / Sign-In & Kim Organizer Admin)
create table if not exists public.user_accounts (
  id text primary key,
  username text not null unique,
  contact text not null unique,
  password text not null,
  role text not null default 'SPECTATOR' check (role in ('SPECTATOR', 'ADMIN')),
  created_at timestamptz not null default now()
);

create index if not exists idx_user_accounts_username_lower
  on public.user_accounts (lower(username));

create index if not exists idx_user_accounts_contact_lower
  on public.user_accounts (lower(contact));

alter table public.user_accounts enable row level security;

grant select, insert on public.user_accounts to anon, authenticated;

drop policy if exists "user_accounts_select_auth" on public.user_accounts;
create policy "user_accounts_select_auth"
  on public.user_accounts
  for select
  to anon, authenticated
  using (true);

-- Self-registration through the client is strictly locked to SPECTATOR role
drop policy if exists "user_accounts_insert_spectator_only" on public.user_accounts;
create policy "user_accounts_insert_spectator_only"
  on public.user_accounts
  for insert
  to anon, authenticated
  with check (role = 'SPECTATOR');

-- Seed the Organizer Admin account (Kim)
insert into public.user_accounts (id, username, contact, password, role)
values ('admin-kim', 'Kim', '0742195556', 'KOTS2026', 'ADMIN')
on conflict (username) do update
set password = excluded.password,
    role = 'ADMIN';
