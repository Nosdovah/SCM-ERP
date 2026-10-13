-- =====================================================================
-- MOAI SCM ERP — LEGACY COMPATIBILITY LAYER (v1)
-- Memulihkan objek yang MASIH dipanggil frontend v1 (Kanban Board,
-- Audit Log, Inventory auto-increment, Document upload) namun tidak ada
-- di skema ERP v2.0.
--
-- Objek yang dibuat:
--   1. public.orders          (Kanban board v1)
--   2. public.order_history   (audit log v1 + realtime)
--   3. public.items           (inventori flat v1 + relasi suppliers)
--   4. company_users.company_name  (kolom tenant legacy)
--   5. storage bucket 'documents'  (upload dokumen)
--
-- Prasyarat : MOAI_ERP_master.sql sudah dijalankan (companies, suppliers,
--             company_users sudah ada).
-- Sifat     : IDEMPOTENT — aman dijalankan berulang.
-- Cara pakai: Supabase SQL Editor -> New query -> paste -> Run.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1 · ORDERS  (dipakai Kanban Board v1)
--     Kolom persis sesuai yang dibaca/ditulis app:
--     id, title, quantity, stage, company_name (+ system, priority,
--     assignee, checklistState, created_at)
-- ---------------------------------------------------------------------
create table if not exists public.orders (
  id              text primary key,                       -- 'ORD-1234'
  title           text not null default 'New Unnamed Order',
  stage           text not null default 'cpo_esta',       -- id stage dari process tree v1
  system          text,
  priority        text default 'Medium',
  assignee        text default 'Unassigned',
  "checklistState" jsonb not null default '{}'::jsonb,     -- app: checklistState (camelCase)
  checklist_state jsonb not null default '{}'::jsonb,     -- alias snake_case
  quantity        integer not null default 1,
  company_name    text not null,                          -- tenant legacy (string)
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_orders_company        on public.orders(company_name);
create index if not exists idx_orders_stage          on public.orders(stage);
create index if not exists idx_orders_company_stage  on public.orders(company_name, stage);

-- ---------------------------------------------------------------------
-- 2 · ORDER_HISTORY  (audit log v1 + realtime channel)
-- ---------------------------------------------------------------------
create table if not exists public.order_history (
  id           uuid primary key default gen_random_uuid(),
  order_id     text references public.orders(id) on delete cascade,
  user_email   text,
  action       text,
  details      jsonb not null default '{}'::jsonb,
  company_name text not null,
  created_at   timestamptz not null default now()
);
create index if not exists idx_order_history_company_created
  on public.order_history(company_name, created_at desc);
create index if not exists idx_order_history_order on public.order_history(order_id);

-- ---------------------------------------------------------------------
-- 3 · ITEMS  (inventori flat v1 + embed suppliers(name))
-- ---------------------------------------------------------------------
create table if not exists public.items (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  unit_price    numeric(18,2) not null default 0,
  stock_on_hand integer not null default 0,
  supplier_id   uuid references public.suppliers(id) on delete set null,  -- agar app bisa embed suppliers(name)
  company_name  text not null,
  created_at    timestamptz not null default now(),
  unique (company_name, name)
);
create index if not exists idx_items_company on public.items(company_name);

-- ---------------------------------------------------------------------
-- 4 · COMPANY_USERS — kolom tenant legacy company_name
-- ---------------------------------------------------------------------
alter table public.company_users add column if not exists company_name text;
update public.company_users cu
   set company_name = c.name
  from public.companies c
 where cu.company_id = c.id
   and cu.company_name is null;

-- ---------------------------------------------------------------------
-- 5 · REALTIME — daftarkan orders & order_history ke publication
-- ---------------------------------------------------------------------
do $$
begin
  begin
    alter publication supabase_realtime add table public.orders;
  exception when duplicate_object then null; when undefined_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.order_history;
  exception when duplicate_object then null; when undefined_object then null;
  end;
end $$;

-- ---------------------------------------------------------------------
-- 6 · ROW LEVEL SECURITY
--     App memakai anon key + filter company_name (tanpa JWT claim), jadi
--     policy permissive diperlukan agar Kanban v1 tetap berfungsi.
--     CATATAN KEAMANAN: ini membuka tabel ke anon key. Lihat versi
--     ketat (berbasis JWT) yang dikomentari di bawah.
-- ---------------------------------------------------------------------
alter table public.orders        enable row level security;
alter table public.order_history enable row level security;
alter table public.items         enable row level security;

drop policy if exists compat_all on public.orders;
create policy compat_all on public.orders        for all using (true) with check (true);
drop policy if exists compat_all on public.order_history;
create policy compat_all on public.order_history for all using (true) with check (true);
drop policy if exists compat_all on public.items;
create policy compat_all on public.items         for all using (true) with check (true);

-- >>> ALTERNATIF LEBIH AMAN (aktifkan bila app sudah mengirim JWT ber-company_name)
-- drop policy if exists compat_all on public.orders;
-- create policy compat_tenant on public.orders for all
--   using  (company_name = (auth.jwt() -> 'user_metadata' ->> 'company_name'))
--   with check (company_name = (auth.jwt() -> 'user_metadata' ->> 'company_name'));
-- (ulangi pola yang sama untuk order_history dan items)

-- ---------------------------------------------------------------------
-- 7 · STORAGE BUCKET 'documents' (upload dokumen Kanban v1)
--     Hanya berjalan di Supabase (skema storage ada di sana).
-- ---------------------------------------------------------------------
do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public)
      values ('documents', 'documents', true)
    on conflict (id) do nothing;

    execute 'drop policy if exists compat_docs_read on storage.objects';
    execute 'create policy compat_docs_read on storage.objects for select using (bucket_id = ''documents'')';
    execute 'drop policy if exists compat_docs_write on storage.objects';
    execute 'create policy compat_docs_write on storage.objects for insert with check (bucket_id = ''documents'')';
  end if;
end $$;

-- =====================================================================
-- VERIFIKASI (jalankan setelah selesai)
-- =====================================================================
select 'orders'        as objek, count(*) as baris from public.orders
union all select 'order_history', count(*) from public.order_history
union all select 'items',         count(*) from public.items;
-- Ekspektasi awal: 0 / 0 / 0 (tabel baru; app akan mengisi saat dipakai).
-- Yang penting: tidak ada error 404 PGRST205 saat app memanggilnya.
