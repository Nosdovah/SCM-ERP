-- =============================================================================
-- MOAI SCM-ERP — Local PostgreSQL schema (no Supabase dependency)
-- =============================================================================
-- Run ONCE after creating the database (see local_db/README.md):
--   PGPASSWORD=moai_local_pw psql -h 127.0.0.1 -U moai -d moai_erp -f local_db/schema.sql
-- Idempotent (safe to re-run).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- v2 durable collection store (mirrors supabase_v2_store.sql)
-- Every v2 collection lives as ONE row: (collection, data JSONB, updated_at).
-- ---------------------------------------------------------------------------
create table if not exists v2_store (
  collection text primary key,
  data       jsonb       not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create or replace function v2_store_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_v2_store_touch on v2_store;
create trigger trg_v2_store_touch
  before update on v2_store
  for each row execute function v2_store_touch();

-- ---------------------------------------------------------------------------
-- Legacy v1 tables (used by the non-/v2 Express handlers in server/server.js)
-- ---------------------------------------------------------------------------
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text,
  base_currency text default 'IDR',
  created_at timestamptz not null default now()
);

create table if not exists company_users (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  user_email text not null,
  role text not null default 'Viewer',
  created_at timestamptz not null default now(),
  unique (company_name, user_email)
);

create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company_name text not null default 'DEFAULT',
  code text,
  category text,
  country text,
  currency text,
  rating numeric,
  payment_terms text,
  lead_time_days integer,
  contact text, phone text, email text, address text,
  on_time_rate text, defect_rate text, is_principal boolean,
  is_active boolean default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  sku text,
  name text,
  category text,
  supplier_id uuid references suppliers(id),
  company_name text not null default 'DEFAULT',
  unit_price numeric default 0,
  cost_price numeric default 0,
  stock_on_hand numeric default 0,
  stock numeric default 0,
  barcode text, item_type text, brand text, uom text,
  is_serial boolean, is_assembly boolean,
  bin_code text,
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id text primary key,
  title text not null,
  stage text default 'cpo_esta',
  system text default 'boq',
  priority text default 'Medium',
  assignee text default 'Unassigned',
  "checklistState" jsonb default '{}'::jsonb,
  company_name text not null default 'DEFAULT',
  quantity integer default 1,
  created_at timestamptz not null default now()
);

create table if not exists order_history (
  id uuid primary key default gen_random_uuid(),
  order_id text,
  user_email text,
  action text,
  details jsonb default '{}'::jsonb,
  company_name text default 'DEFAULT',
  created_at timestamptz not null default now()
);

create index if not exists idx_orders_company on orders(company_name);
create index if not exists idx_items_company on items(company_name);
create index if not exists idx_suppliers_company on suppliers(company_name);
create index if not exists idx_history_order on order_history(order_id);
create index if not exists idx_history_company on order_history(company_name);

-- Notify any LISTENer after a v2_store write so a realtime stream can fan out.
create or replace function v2_store_notify()
returns trigger language plpgsql as $$
begin
  perform pg_notify('moai_change', coalesce(new.collection, 'v2_store'));
  return new;
end;
$$;

drop trigger if exists trg_v2_store_notify on v2_store;
create trigger trg_v2_store_notify
  after insert or update on v2_store
  for each row execute function v2_store_notify();