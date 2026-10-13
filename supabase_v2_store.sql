-- =============================================================================
-- MOAI ERP v2 — Durable persistence table (QA-01 fix)
-- =============================================================================
-- The v2 backend (server/store.js) keeps every v2 collection as ONE row in this
-- table: (collection TEXT PRIMARY KEY, data JSONB, updated_at TIMESTAMPTZ).
-- This replaces the previous in-memory store so data survives Vercel serverless
-- cold starts.
--
-- Run this ONCE against the Supabase project used by the app:
--   * Supabase Dashboard -> SQL Editor -> paste & run, OR
--   * psql "$SUPABASE_DB_URL" -f supabase_v2_store.sql
--
-- Safe to re-run (idempotent).
-- =============================================================================

create table if not exists public.v2_store (
  collection text primary key,
  data       jsonb       not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.v2_store is
  'MOAI ERP v2 — durable collection store. One row per logical collection (products, suppliers, ...).';

-- Keep updated_at fresh on every upsert.
create or replace function public.v2_store_touch()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_v2_store_touch on public.v2_store;
create trigger trg_v2_store_touch
  before update on public.v2_store
  for each row execute function public.v2_store_touch();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
-- The backend connects with the service role key (bypasses RLS). We still
-- enable RLS with NO permissive policy so that the anon/publishable key CANNOT
-- read or write the store directly from the browser.
alter table public.v2_store enable row level security;

-- Service role bypasses RLS automatically; no policy is intentionally created.

-- ---------------------------------------------------------------------------
-- PostgREST schema cache refresh
-- ---------------------------------------------------------------------------
notify pgrst, 'reload schema';
