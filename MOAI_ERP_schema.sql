-- ==============================================================================
-- MOAI ERP v2.0 - Database Schema & Technical Requirements (Production DDL)
-- Target: Supabase (PostgreSQL 16) — React + Vite + PostgREST
-- Domain: Distributor & Integrator Komputer (Prebuilt, Barebone, Spare Parts)
-- Features: 55 Tables · 40 Enums · 148 Foreign Keys · 108 Indexes
--           34 Multi-Tenant RLS Policies · 6 Atomic RPC Functions · 3 Views
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. ENUM TYPES REFERENCE (40 Enums)
-- ==============================================================================

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_type') THEN
        CREATE TYPE public.activity_type AS ENUM ('pick', 'pack', 'return', 'receive', 'assembly', 'qc');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'adjustment_reason') THEN
        CREATE TYPE public.adjustment_reason AS ENUM ('damage', 'loss', 'found', 'expiry', 'correction');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'adjustment_status') THEN
        CREATE TYPE public.adjustment_status AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'POSTED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'aging_bucket') THEN
        CREATE TYPE public.aging_bucket AS ENUM ('0-30', '31-60', '61-90', '91-180', '>180');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assembly_status') THEN
        CREATE TYPE public.assembly_status AS ENUM ('DRAFT', 'PLANNED', 'ISSUED', 'COMPLETED', 'CANCELLED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bin_type') THEN
        CREATE TYPE public.bin_type AS ENUM ('storage', 'staging', 'quarantine', 'return', 'damaged');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'client_segment') THEN
        CREATE TYPE public.client_segment AS ENUM ('retail', 'corporate', 'government');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cogs_method') THEN
        CREATE TYPE public.cogs_method AS ENUM ('FIFO', 'AVERAGE', 'SPECIFIC', 'BOM_ROLLUP');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gr_status') THEN
        CREATE TYPE public.gr_status AS ENUM ('DRAFT', 'QC_PENDING', 'QC_PASSED', 'QC_FAILED', 'POSTED', 'CLOSED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status') THEN
        CREATE TYPE public.invoice_status AS ENUM ('unpaid', 'partial', 'paid', 'overdue', 'void');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'item_type') THEN
        CREATE TYPE public.item_type AS ENUM ('PREBUILT', 'BAREBONE', 'SPARE_PART');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'movement_class') THEN
        CREATE TYPE public.movement_class AS ENUM ('fast', 'medium', 'slow', 'dead');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'movement_type') THEN
        CREATE TYPE public.movement_type AS ENUM (
            'GR', 'GI', 'TRF_IN', 'TRF_OUT', 'ADJ_IN', 'ADJ_OUT', 'OPN_IN', 'OPN_OUT',
            'RET_IN', 'RET_OUT', 'ASM_OUT', 'ASM_IN', 'QC_HOLD', 'QC_RELEASE',
            'QC_REJECT', 'RMA_IN', 'RMA_OUT', 'RTV_OUT', 'WARRANTY_OUT'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'opname_scope') THEN
        CREATE TYPE public.opname_scope AS ENUM ('full', 'zone', 'cycle');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'opname_status') THEN
        CREATE TYPE public.opname_status AS ENUM ('OPEN', 'COUNTING', 'REVIEW', 'POSTED', 'CLOSED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pack_status') THEN
        CREATE TYPE public.pack_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
        CREATE TYPE public.payment_method AS ENUM ('transfer', 'cash', 'giro');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_type') THEN
        CREATE TYPE public.payment_type AS ENUM ('AR', 'AP');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pick_status') THEN
        CREATE TYPE public.pick_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pick_type') THEN
        CREATE TYPE public.pick_type AS ENUM ('single', 'wave');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'po_status') THEN
        CREATE TYPE public.po_status AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PARTIAL', 'FULL', 'CLOSED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pr_source') THEN
        CREATE TYPE public.pr_source AS ENUM ('AUTO_REORDER', 'MANUAL');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pr_status') THEN
        CREATE TYPE public.pr_status AS ENUM ('OPEN', 'CONVERTED', 'CLOSED', 'DISMISSED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'qc_action') THEN
        CREATE TYPE public.qc_action AS ENUM ('ACCEPT', 'REJECT', 'RETURN_VENDOR', 'REWORK');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'qc_status') THEN
        CREATE TYPE public.qc_status AS ENUM ('PENDING', 'IN_PROGRESS', 'PASSED', 'FAILED', 'CLOSED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rma_direction') THEN
        CREATE TYPE public.rma_direction AS ENUM ('CUSTOMER_RETURN', 'VENDOR_RETURN');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rma_disposition') THEN
        CREATE TYPE public.rma_disposition AS ENUM ('restock', 'scrap', 'repair', 'return_vendor');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rma_reason') THEN
        CREATE TYPE public.rma_reason AS ENUM ('defective', 'wrong_item', 'warranty', 'not_as_spec');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rma_resolution') THEN
        CREATE TYPE public.rma_resolution AS ENUM ('replace', 'repair', 'credit_note', 'refund', 'reject');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rma_status') THEN
        CREATE TYPE public.rma_status AS ENUM ('OPEN', 'INSPECTING', 'DISPOSITIONED', 'RESOLVED', 'CLOSED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rtv_status') THEN
        CREATE TYPE public.rtv_status AS ENUM ('OPEN', 'APPROVED', 'SHIPPED', 'WAITING', 'CLOSED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'serial_status') THEN
        CREATE TYPE public.serial_status AS ENUM (
            'IN_STOCK', 'ALLOCATED', 'SOLD', 'IN_TRANSIT', 'RMA',
            'DEFECTIVE', 'RETURNED_VENDOR', 'WARRANTY_SERVICE', 'SCRAPPED'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_action') THEN
        CREATE TYPE public.service_action AS ENUM ('repair', 'replace', 'refund');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_status') THEN
        CREATE TYPE public.service_status AS ENUM ('OPEN', 'DIAGNOSED', 'IN_REPAIR', 'RESOLVED', 'CLOSED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sj_status') THEN
        CREATE TYPE public.sj_status AS ENUM ('DRAFT', 'ISSUED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'so_status') THEN
        CREATE TYPE public.so_status AS ENUM (
            'DRAFT', 'CONFIRMED', 'ALLOCATED', 'PICKING', 'PACKING', 'READY', 'SHIPPED', 'DELIVERED', 'CLOSED'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transfer_status') THEN
        CREATE TYPE public.transfer_status AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'IN_TRANSIT', 'RECEIVED', 'CLOSED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM (
            'SUPER_ADMIN', 'COMPANY_ADMIN', 'SCM_ADMIN', 'QC_INSPECTOR',
            'INVENTORY_ADMIN', 'ASSEMBLY_TECH', 'OUTBOUND_ADMIN', 'PICKING_ADMIN',
            'PACKING_ADMIN', 'RETURN_ADMIN', 'FINANCE_ADMIN', 'SALES', 'VIEWER'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'warehouse_type') THEN
        CREATE TYPE public.warehouse_type AS ENUM ('central', 'regional', 'transit', 'project');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'zone_category') THEN
        CREATE TYPE public.zone_category AS ENUM ('PREBUILT', 'BAREBONE', 'SPARE_PART', 'QUARANTINE', 'RMA', 'DEFECTIVE');
    END IF;
END $$;

-- Helper Function: Tenant ID extraction from JWT
CREATE OR REPLACE FUNCTION public.current_company_id() 
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(
        COALESCE(
            current_setting('request.jwt.claims', true)::jsonb->>'company_id',
            (auth.jwt()->>'company_id')
        ),
        ''
    )::UUID;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ==============================================================================
-- 1.1 UPGRADE & CLEANUP SKEMA LAMA (§11 Migrasi dari Sistem Lama)
-- ==============================================================================

-- 1. Upgrade tabel companies jika sudah ada dari versi v1 (tambahkan kolom v2.0 yang hilang)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'companies') THEN
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS legal_name TEXT;
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS tax_id TEXT;
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS address TEXT;
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS phone TEXT;
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS email TEXT;
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS base_currency CHARACTER(3) DEFAULT 'IDR';
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS logo_url TEXT;
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
    END IF;
END $$;

-- Pastikan perusahaan default MANUFACTURE terdaftar
INSERT INTO public.companies (name, legal_name, base_currency)
VALUES ('MANUFACTURE', 'PT Manufaktur Komputer Indonesia', 'IDR')
ON CONFLICT (name) DO UPDATE SET base_currency = 'IDR';

-- 2. Bersihkan tabel legacy yang strukturnya belum menggunakan company_id (company_users & suppliers)
-- Hal ini mutlak diperlukan agar CREATE TABLE IF NOT EXISTS di bawah membuat tabel v2.0 dengan kolom company_id
DO $$
BEGIN
    -- Jika company_users lama masih menggunakan company_name dan belum punya company_id
    IF EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'company_users'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'company_users' AND column_name = 'company_id'
    ) THEN
        DROP TABLE public.company_users CASCADE;
    END IF;

    -- Jika suppliers lama masih menggunakan company_name dan belum punya company_id
    IF EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'suppliers'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'suppliers' AND column_name = 'company_id'
    ) THEN
        CREATE TEMP TABLE IF NOT EXISTS _old_suppliers AS SELECT * FROM public.suppliers;
        DROP TABLE public.suppliers CASCADE;
    END IF;
END $$;

-- ==============================================================================
-- 2. MASTER DATA TABLES (§3.1) - 10 Tables
-- ==============================================================================

-- 1. companies
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    legal_name TEXT,
    tax_id TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    base_currency CHARACTER(3) DEFAULT 'IDR' NOT NULL,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. company_users
CREATE TABLE IF NOT EXISTS public.company_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role public.user_role DEFAULT 'VIEWER' NOT NULL,
    warehouse_scope UUID[] DEFAULT '{}' NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, user_id)
);

-- 3. warehouses
CREATE TABLE IF NOT EXISTS public.warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    type public.warehouse_type DEFAULT 'central' NOT NULL,
    address TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, code)
);

-- 4. warehouse_zones
CREATE TABLE IF NOT EXISTS public.warehouse_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    category public.zone_category NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(warehouse_id, code)
);

-- 5. bins
CREATE TABLE IF NOT EXISTS public.bins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
    zone_id UUID NOT NULL REFERENCES public.warehouse_zones(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    rack TEXT,
    shelf TEXT,
    level TEXT,
    bin_type public.bin_type DEFAULT 'storage' NOT NULL,
    capacity NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(warehouse_id, code)
);

-- 6. brands
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    description TEXT,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, name)
);

-- 7. products
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    barcode TEXT,
    name TEXT NOT NULL,
    category TEXT,
    item_type public.item_type NOT NULL,
    brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
    uom TEXT DEFAULT 'UNIT' NOT NULL,
    is_batch BOOLEAN DEFAULT false NOT NULL,
    is_serial BOOLEAN DEFAULT false NOT NULL,
    is_assembly BOOLEAN DEFAULT false NOT NULL,
    weight NUMERIC,
    volume NUMERIC,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, sku),
    UNIQUE(company_id, barcode)
);

-- 8. suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    contact TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    payment_terms TEXT DEFAULT 'NET 30',
    currency CHARACTER(3) DEFAULT 'IDR' NOT NULL,
    is_principal BOOLEAN DEFAULT false NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, code)
);

DO $$
DECLARE
    v_def_cid UUID;
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'pg_temp' AND tablename = '_old_suppliers') THEN
        SELECT id INTO v_def_cid FROM public.companies WHERE name = 'MANUFACTURE' LIMIT 1;
        IF v_def_cid IS NULL THEN SELECT id INTO v_def_cid FROM public.companies LIMIT 1; END IF;
        
        IF v_def_cid IS NOT NULL THEN
            INSERT INTO public.suppliers (id, company_id, code, name, currency)
            SELECT 
                os.id, 
                v_def_cid, 
                'SUPP-' || substring(os.id::text from 1 for 8), 
                os.name, 
                'IDR'
            FROM _old_suppliers os
            ON CONFLICT (id) DO NOTHING;
        END IF;
        DROP TABLE IF EXISTS _old_suppliers;
    END IF;
END $$;

-- 9. clients
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    contact TEXT,
    phone TEXT,
    email TEXT,
    billing_address TEXT,
    shipping_address TEXT,
    payment_terms TEXT DEFAULT 'COD',
    credit_limit NUMERIC DEFAULT 0 NOT NULL,
    segment public.client_segment DEFAULT 'corporate' NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, code)
);

-- 10. product_operational
CREATE TABLE IF NOT EXISTS public.product_operational (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
    min_stock NUMERIC DEFAULT 0 NOT NULL,
    max_stock NUMERIC DEFAULT 0 NOT NULL,
    reorder_point NUMERIC DEFAULT 0 NOT NULL,
    reorder_qty NUMERIC DEFAULT 0 NOT NULL,
    safety_stock NUMERIC DEFAULT 0 NOT NULL,
    shelf_life_days INTEGER,
    storage_condition TEXT,
    handling_note TEXT,
    auto_putaway BOOLEAN DEFAULT true NOT NULL,
    abc_class CHARACTER(1) DEFAULT 'B',
    is_fast_moving BOOLEAN DEFAULT false NOT NULL,
    UNIQUE(product_id, warehouse_id)
);

-- ==============================================================================
-- 3. INVENTORY & ASSEMBLY ENGINE (§3.2) - 13 Tables
-- ==============================================================================

-- 11. serial_numbers (Dibuat lebih dulu agar bisa di-FK dari stock_movements)
CREATE TABLE IF NOT EXISTS public.serial_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    serial_no TEXT NOT NULL,
    imei TEXT,
    status public.serial_status DEFAULT 'IN_STOCK' NOT NULL,
    warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
    bin_id UUID REFERENCES public.bins(id) ON DELETE SET NULL,
    gr_id UUID,
    gr_line_id UUID,
    so_id UUID,
    sj_id UUID,
    unit_cost NUMERIC DEFAULT 0,
    received_at TIMESTAMPTZ,
    sold_at TIMESTAMPTZ,
    vendor_warranty_start DATE,
    vendor_warranty_end DATE,
    customer_warranty_start DATE,
    customer_warranty_end DATE,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, serial_no)
);

-- 12. stock_movements (Immutable Stock Ledger)
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
    bin_id UUID REFERENCES public.bins(id) ON DELETE RESTRICT,
    serial_id UUID REFERENCES public.serial_numbers(id) ON DELETE SET NULL,
    movement_type public.movement_type NOT NULL,
    qty NUMERIC NOT NULL,
    unit_cost NUMERIC DEFAULT 0,
    batch_no TEXT,
    serial_no TEXT,
    ref_doc_type TEXT,
    ref_doc_id UUID,
    ref_doc_number TEXT,
    idempotency_key TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    note TEXT,
    CONSTRAINT chk_qty_nonzero CHECK (qty <> 0)
);

-- 13. boms
CREATE TABLE IF NOT EXISTS public.boms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    version TEXT DEFAULT 'v1.0' NOT NULL,
    name TEXT,
    labor_cost NUMERIC DEFAULT 0 NOT NULL,
    overhead_cost NUMERIC DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, product_id, version)
);

-- 14. bom_lines
CREATE TABLE IF NOT EXISTS public.bom_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bom_id UUID NOT NULL REFERENCES public.boms(id) ON DELETE CASCADE,
    component_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    qty NUMERIC NOT NULL,
    scrap_pct NUMERIC DEFAULT 0 NOT NULL,
    note TEXT
);

-- 15. assembly_orders
CREATE TABLE IF NOT EXISTS public.assembly_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    assembly_number TEXT NOT NULL,
    bom_id UUID NOT NULL REFERENCES public.boms(id) ON DELETE RESTRICT,
    output_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    qty_to_build NUMERIC DEFAULT 1 NOT NULL,
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
    target_bin_id UUID REFERENCES public.bins(id) ON DELETE SET NULL,
    status public.assembly_status DEFAULT 'DRAFT' NOT NULL,
    planned_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_by UUID,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, assembly_number)
);

-- 16. assembly_order_lines
CREATE TABLE IF NOT EXISTS public.assembly_order_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assembly_order_id UUID NOT NULL REFERENCES public.assembly_orders(id) ON DELETE CASCADE,
    component_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    qty_required NUMERIC NOT NULL,
    qty_issued NUMERIC DEFAULT 0 NOT NULL,
    qty_consumed NUMERIC DEFAULT 0 NOT NULL,
    from_bin_id UUID REFERENCES public.bins(id) ON DELETE SET NULL,
    note TEXT
);

-- 17. stock_transfers
CREATE TABLE IF NOT EXISTS public.stock_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    transfer_number TEXT NOT NULL,
    from_warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
    from_bin_id UUID REFERENCES public.bins(id),
    to_warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
    to_bin_id UUID REFERENCES public.bins(id),
    status public.transfer_status DEFAULT 'DRAFT' NOT NULL,
    requested_by UUID,
    approved_by UUID,
    shipped_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, transfer_number),
    CONSTRAINT chk_transfer_segregation CHECK (approved_by IS NULL OR approved_by <> requested_by)
);

-- 18. stock_transfer_lines
CREATE TABLE IF NOT EXISTS public.stock_transfer_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id UUID NOT NULL REFERENCES public.stock_transfers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    qty_requested NUMERIC NOT NULL,
    qty_shipped NUMERIC DEFAULT 0 NOT NULL,
    qty_received NUMERIC DEFAULT 0 NOT NULL,
    serial_no TEXT,
    batch_no TEXT,
    note TEXT
);

-- 19. stock_adjustments
CREATE TABLE IF NOT EXISTS public.stock_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    adj_number TEXT NOT NULL,
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
    bin_id UUID REFERENCES public.bins(id),
    reason public.adjustment_reason NOT NULL,
    status public.adjustment_status DEFAULT 'DRAFT' NOT NULL,
    requested_by UUID,
    approved_by UUID,
    adjusted_at TIMESTAMPTZ,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, adj_number),
    CONSTRAINT chk_adj_segregation CHECK (approved_by IS NULL OR approved_by <> requested_by)
);

-- 20. stock_adjustment_lines
CREATE TABLE IF NOT EXISTS public.stock_adjustment_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    adjustment_id UUID NOT NULL REFERENCES public.stock_adjustments(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    serial_id UUID REFERENCES public.serial_numbers(id),
    qty_system NUMERIC NOT NULL,
    qty_actual NUMERIC NOT NULL,
    qty_variance NUMERIC,
    unit_cost NUMERIC,
    note TEXT
);

-- 21. stock_opname_sessions
CREATE TABLE IF NOT EXISTS public.stock_opname_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    session_number TEXT NOT NULL,
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
    scope public.opname_scope DEFAULT 'zone' NOT NULL,
    status public.opname_status DEFAULT 'OPEN' NOT NULL,
    started_by UUID,
    started_at TIMESTAMPTZ,
    closed_by UUID,
    closed_at TIMESTAMPTZ,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, session_number)
);

-- 22. stock_opname_lines
CREATE TABLE IF NOT EXISTS public.stock_opname_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.stock_opname_sessions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    bin_id UUID REFERENCES public.bins(id),
    serial_no TEXT,
    qty_system NUMERIC NOT NULL,
    qty_counted NUMERIC,
    qty_variance NUMERIC,
    counted_by UUID,
    counted_at TIMESTAMPTZ,
    recount_flag BOOLEAN DEFAULT false NOT NULL
);

-- 23. assets
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    asset_code TEXT NOT NULL,
    barcode TEXT,
    name TEXT NOT NULL,
    category TEXT,
    warehouse_id UUID REFERENCES public.warehouses(id),
    bin_id UUID REFERENCES public.bins(id),
    acquisition_date DATE,
    acquisition_cost NUMERIC,
    current_value NUMERIC,
    depreciation_method TEXT,
    useful_life_months INTEGER,
    status TEXT,
    assigned_to UUID,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, asset_code)
);

-- ==============================================================================
-- 4. RMA & QUALITY CONTROL (§3.3) - 4 Tables
-- ==============================================================================

-- 24. rma_cases
CREATE TABLE IF NOT EXISTS public.rma_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    rma_number TEXT NOT NULL,
    direction public.rma_direction NOT NULL,
    client_id UUID REFERENCES public.clients(id),
    supplier_id UUID REFERENCES public.suppliers(id),
    serial_id UUID REFERENCES public.serial_numbers(id),
    product_id UUID NOT NULL REFERENCES public.products(id),
    qty NUMERIC NOT NULL,
    reason public.rma_reason NOT NULL,
    status public.rma_status DEFAULT 'OPEN' NOT NULL,
    opened_by UUID,
    opened_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved_at TIMESTAMPTZ,
    resolution public.rma_resolution,
    vendor_claim_ref TEXT,
    note TEXT,
    UNIQUE(company_id, rma_number)
);

-- 25. rma_lines
CREATE TABLE IF NOT EXISTS public.rma_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rma_id UUID NOT NULL REFERENCES public.rma_cases(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    serial_no TEXT,
    qty NUMERIC NOT NULL,
    defect_type TEXT,
    disposition public.rma_disposition,
    note TEXT
);

-- 26. qc_inspections (Didefinisikan sebelum lines)
CREATE TABLE IF NOT EXISTS public.qc_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    inspection_number TEXT NOT NULL,
    gr_id UUID,
    warehouse_id UUID REFERENCES public.warehouses(id),
    inspector UUID,
    status public.qc_status DEFAULT 'PENDING' NOT NULL,
    inspected_at TIMESTAMPTZ,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, inspection_number)
);

-- 27. qc_inspection_lines
CREATE TABLE IF NOT EXISTS public.qc_inspection_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    qc_id UUID NOT NULL REFERENCES public.qc_inspections(id) ON DELETE CASCADE,
    gr_line_id UUID,
    product_id UUID NOT NULL REFERENCES public.products(id),
    serial_no TEXT,
    qty_inspected NUMERIC NOT NULL,
    qty_pass NUMERIC NOT NULL,
    qty_fail NUMERIC NOT NULL,
    defect_type TEXT,
    action public.qc_action,
    note TEXT
);

-- ==============================================================================
-- 5. SUPPLY CHAIN MANAGEMENT (SCM) (§3.4) - 10 Tables
-- ==============================================================================

-- 28. purchase_orders
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    po_number TEXT NOT NULL,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
    warehouse_id UUID REFERENCES public.warehouses(id),
    status public.po_status DEFAULT 'DRAFT' NOT NULL,
    order_date DATE NOT NULL,
    expected_date DATE,
    currency CHARACTER(3) DEFAULT 'IDR' NOT NULL,
    exchange_rate NUMERIC DEFAULT 1.0 NOT NULL,
    subtotal NUMERIC DEFAULT 0 NOT NULL,
    tax NUMERIC DEFAULT 0 NOT NULL,
    total NUMERIC DEFAULT 0 NOT NULL,
    created_by UUID,
    approved_by UUID,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, po_number),
    CONSTRAINT chk_po_segregation CHECK (approved_by IS NULL OR approved_by <> created_by)
);

-- 29. purchase_order_lines
CREATE TABLE IF NOT EXISTS public.purchase_order_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    qty_ordered NUMERIC NOT NULL,
    qty_received NUMERIC DEFAULT 0 NOT NULL,
    unit_price NUMERIC NOT NULL,
    discount NUMERIC DEFAULT 0 NOT NULL,
    line_total NUMERIC NOT NULL,
    note TEXT
);

-- 30. purchase_requisitions
CREATE TABLE IF NOT EXISTS public.purchase_requisitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    pr_number TEXT NOT NULL,
    source public.pr_source DEFAULT 'AUTO_REORDER' NOT NULL,
    status public.pr_status DEFAULT 'OPEN' NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    converted_po_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
    note TEXT,
    UNIQUE(company_id, pr_number)
);

-- 31. purchase_requisition_lines
CREATE TABLE IF NOT EXISTS public.purchase_requisition_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pr_id UUID NOT NULL REFERENCES public.purchase_requisitions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    current_stock NUMERIC NOT NULL,
    reorder_point NUMERIC NOT NULL,
    suggested_qty NUMERIC NOT NULL,
    preferred_supplier_id UUID REFERENCES public.suppliers(id),
    note TEXT
);

-- 32. goods_receipts
CREATE TABLE IF NOT EXISTS public.goods_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    gr_number TEXT NOT NULL,
    po_id UUID REFERENCES public.purchase_orders(id),
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
    status public.gr_status DEFAULT 'DRAFT' NOT NULL,
    received_by UUID,
    received_at TIMESTAMPTZ,
    supplier_do_number TEXT,
    qc_status public.qc_status,
    attachment_url TEXT,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, gr_number)
);

-- Tambahkan FK gr_id ke qc_inspections sekarang karena goods_receipts sudah dibuat
ALTER TABLE public.qc_inspections 
ADD CONSTRAINT fk_qc_gr FOREIGN KEY (gr_id) REFERENCES public.goods_receipts(id) ON DELETE SET NULL;

-- 33. goods_receipt_lines
CREATE TABLE IF NOT EXISTS public.goods_receipt_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gr_id UUID NOT NULL REFERENCES public.goods_receipts(id) ON DELETE CASCADE,
    po_line_id UUID REFERENCES public.purchase_order_lines(id),
    product_id UUID NOT NULL REFERENCES public.products(id),
    qty_received NUMERIC NOT NULL,
    qty_rejected NUMERIC DEFAULT 0 NOT NULL,
    qty_good NUMERIC,
    bin_id UUID REFERENCES public.bins(id),
    batch_no TEXT,
    serial_no TEXT,
    imei TEXT,
    condition TEXT,
    unit_cost NUMERIC,
    note TEXT
);

-- Tambahkan FK gr_line_id ke qc_inspection_lines
ALTER TABLE public.qc_inspection_lines 
ADD CONSTRAINT fk_qc_gr_line FOREIGN KEY (gr_line_id) REFERENCES public.goods_receipt_lines(id) ON DELETE SET NULL;

-- 34. vendor_price_lists
CREATE TABLE IF NOT EXISTS public.vendor_price_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    currency CHARACTER(3) DEFAULT 'IDR' NOT NULL,
    unit_price NUMERIC NOT NULL,
    moq NUMERIC DEFAULT 1 NOT NULL,
    lead_time_days INTEGER,
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_to DATE,
    is_active BOOLEAN DEFAULT true NOT NULL,
    UNIQUE(company_id, supplier_id, product_id, valid_from)
);

-- 35. vendor_price_history
CREATE TABLE IF NOT EXISTS public.vendor_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    old_price NUMERIC,
    new_price NUMERIC NOT NULL,
    currency CHARACTER(3) DEFAULT 'IDR' NOT NULL,
    changed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    source TEXT,
    note TEXT
);

-- 36. rtv_cases
CREATE TABLE IF NOT EXISTS public.rtv_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    rtv_number TEXT NOT NULL,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
    gr_id UUID REFERENCES public.goods_receipts(id),
    rma_id UUID REFERENCES public.rma_cases(id),
    status public.rtv_status DEFAULT 'OPEN' NOT NULL,
    approved_by UUID,
    shipped_at TIMESTAMPTZ,
    replacement_ref TEXT,
    credit_note_ref TEXT,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, rtv_number)
);

-- 37. rtv_lines
CREATE TABLE IF NOT EXISTS public.rtv_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rtv_id UUID NOT NULL REFERENCES public.rtv_cases(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    serial_no TEXT,
    qty NUMERIC NOT NULL,
    unit_cost NUMERIC,
    note TEXT
);

-- ==============================================================================
-- 6. OUTBOUND / SALES & FULFILLMENT (§3.5) - 8 Tables
-- ==============================================================================

-- 38. sales_orders
CREATE TABLE IF NOT EXISTS public.sales_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    so_number TEXT NOT NULL,
    client_id UUID NOT NULL REFERENCES public.clients(id),
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
    status public.so_status DEFAULT 'DRAFT' NOT NULL,
    order_date DATE NOT NULL,
    requested_date DATE,
    priority TEXT NOT NULL,
    currency CHARACTER(3) DEFAULT 'IDR' NOT NULL,
    exchange_rate NUMERIC DEFAULT 1.0 NOT NULL,
    subtotal NUMERIC DEFAULT 0 NOT NULL,
    tax NUMERIC DEFAULT 0 NOT NULL,
    total NUMERIC DEFAULT 0 NOT NULL,
    created_by UUID,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, so_number)
);

-- 39. sales_order_lines
CREATE TABLE IF NOT EXISTS public.sales_order_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    so_id UUID NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    qty_ordered NUMERIC NOT NULL,
    qty_allocated NUMERIC DEFAULT 0 NOT NULL,
    qty_picked NUMERIC DEFAULT 0 NOT NULL,
    qty_shipped NUMERIC DEFAULT 0 NOT NULL,
    unit_price NUMERIC NOT NULL,
    discount NUMERIC DEFAULT 0 NOT NULL,
    line_total NUMERIC NOT NULL,
    note TEXT
);

-- 40. pick_tasks
CREATE TABLE IF NOT EXISTS public.pick_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    pick_number TEXT NOT NULL,
    so_id UUID REFERENCES public.sales_orders(id),
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
    type public.pick_type DEFAULT 'single' NOT NULL,
    status public.pick_status DEFAULT 'PENDING' NOT NULL,
    assigned_to UUID,
    priority TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    note TEXT,
    UNIQUE(company_id, pick_number)
);

-- 41. pick_lines
CREATE TABLE IF NOT EXISTS public.pick_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pick_task_id UUID NOT NULL REFERENCES public.pick_tasks(id) ON DELETE CASCADE,
    so_line_id UUID REFERENCES public.sales_order_lines(id),
    product_id UUID NOT NULL REFERENCES public.products(id),
    from_bin_id UUID REFERENCES public.bins(id),
    qty_requested NUMERIC NOT NULL,
    qty_picked NUMERIC DEFAULT 0 NOT NULL,
    qty_short NUMERIC,
    serial_no TEXT,
    status TEXT,
    picked_by UUID,
    picked_at TIMESTAMPTZ
);

-- 42. pack_tasks
CREATE TABLE IF NOT EXISTS public.pack_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    pack_number TEXT NOT NULL,
    pick_task_id UUID REFERENCES public.pick_tasks(id),
    so_id UUID REFERENCES public.sales_orders(id),
    status public.pack_status DEFAULT 'PENDING' NOT NULL,
    packed_by UUID,
    packed_at TIMESTAMPTZ,
    box_count INTEGER DEFAULT 1 NOT NULL,
    total_weight NUMERIC,
    note TEXT,
    UNIQUE(company_id, pack_number)
);

-- 43. pack_lines
CREATE TABLE IF NOT EXISTS public.pack_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pack_task_id UUID NOT NULL REFERENCES public.pack_tasks(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    qty NUMERIC NOT NULL,
    box_no INTEGER,
    serial_no TEXT,
    note TEXT
);

-- 44. delivery_notes
CREATE TABLE IF NOT EXISTS public.delivery_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    sj_number TEXT NOT NULL,
    so_id UUID NOT NULL REFERENCES public.sales_orders(id),
    client_id UUID NOT NULL REFERENCES public.clients(id),
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
    status public.sj_status DEFAULT 'DRAFT' NOT NULL,
    driver_name TEXT,
    vehicle_no TEXT,
    delivered_at TIMESTAMPTZ,
    received_by_name TEXT,
    received_signature_url TEXT,
    attachment_url TEXT,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, sj_number)
);

-- 45. delivery_note_lines
CREATE TABLE IF NOT EXISTS public.delivery_note_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sj_id UUID NOT NULL REFERENCES public.delivery_notes(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    qty NUMERIC NOT NULL,
    serial_no TEXT,
    note TEXT
);

-- Hubungkan FK serial_numbers ke dokumen penerimaan & penjualan
ALTER TABLE public.serial_numbers
ADD CONSTRAINT fk_sn_gr FOREIGN KEY (gr_id) REFERENCES public.goods_receipts(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_sn_so FOREIGN KEY (so_id) REFERENCES public.sales_orders(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_sn_sj FOREIGN KEY (sj_id) REFERENCES public.delivery_notes(id) ON DELETE SET NULL;

-- ==============================================================================
-- 7. FINANCE & COSTING (§3.6) - 9 Tables
-- ==============================================================================

-- 46. currencies
CREATE TABLE IF NOT EXISTS public.currencies (
    code CHARACTER(3) PRIMARY KEY,
    name TEXT NOT NULL,
    symbol TEXT,
    is_base BOOLEAN DEFAULT false NOT NULL
);

-- 47. exchange_rates
CREATE TABLE IF NOT EXISTS public.exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_currency CHARACTER(3) NOT NULL REFERENCES public.currencies(code),
    to_currency CHARACTER(3) NOT NULL REFERENCES public.currencies(code),
    rate NUMERIC NOT NULL,
    effective_date DATE DEFAULT CURRENT_DATE NOT NULL,
    source TEXT,
    UNIQUE(from_currency, to_currency, effective_date)
);

-- 48. sales_invoices
CREATE TABLE IF NOT EXISTS public.sales_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    so_id UUID REFERENCES public.sales_orders(id),
    sj_id UUID REFERENCES public.delivery_notes(id),
    client_id UUID NOT NULL REFERENCES public.clients(id),
    currency CHARACTER(3) DEFAULT 'IDR' NOT NULL,
    exchange_rate NUMERIC DEFAULT 1.0 NOT NULL,
    amount NUMERIC NOT NULL,
    tax NUMERIC DEFAULT 0 NOT NULL,
    total NUMERIC NOT NULL,
    status public.invoice_status DEFAULT 'unpaid' NOT NULL,
    issued_date DATE DEFAULT CURRENT_DATE NOT NULL,
    due_date DATE,
    paid_amount NUMERIC DEFAULT 0 NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, invoice_number)
);

-- 49. ap_bills
CREATE TABLE IF NOT EXISTS public.ap_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    bill_number TEXT NOT NULL,
    po_id UUID REFERENCES public.purchase_orders(id),
    gr_id UUID REFERENCES public.goods_receipts(id),
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
    currency CHARACTER(3) DEFAULT 'IDR' NOT NULL,
    exchange_rate NUMERIC DEFAULT 1.0 NOT NULL,
    amount NUMERIC NOT NULL,
    tax NUMERIC DEFAULT 0 NOT NULL,
    total NUMERIC NOT NULL,
    status public.invoice_status DEFAULT 'unpaid' NOT NULL,
    issued_date DATE DEFAULT CURRENT_DATE NOT NULL,
    due_date DATE,
    paid_amount NUMERIC DEFAULT 0 NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, bill_number)
);

-- 50. payments
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    payment_number TEXT NOT NULL,
    type public.payment_type NOT NULL,
    ref_invoice_id UUID REFERENCES public.sales_invoices(id),
    ref_bill_id UUID REFERENCES public.ap_bills(id),
    amount NUMERIC NOT NULL,
    currency CHARACTER(3) DEFAULT 'IDR' NOT NULL,
    exchange_rate NUMERIC DEFAULT 1.0 NOT NULL,
    method public.payment_method DEFAULT 'transfer' NOT NULL,
    paid_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    proof_url TEXT,
    note TEXT,
    UNIQUE(company_id, payment_number)
);

-- 51. cogs_records
CREATE TABLE IF NOT EXISTS public.cogs_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    serial_id UUID REFERENCES public.serial_numbers(id),
    so_id UUID REFERENCES public.sales_orders(id),
    sj_id UUID REFERENCES public.delivery_notes(id),
    method public.cogs_method NOT NULL,
    material_cost NUMERIC DEFAULT 0 NOT NULL,
    labor_cost NUMERIC DEFAULT 0 NOT NULL,
    overhead_cost NUMERIC DEFAULT 0 NOT NULL,
    total_cost NUMERIC NOT NULL,
    computed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 52. service_tickets
CREATE TABLE IF NOT EXISTS public.service_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    ticket_number TEXT NOT NULL,
    serial_id UUID REFERENCES public.serial_numbers(id),
    product_id UUID NOT NULL REFERENCES public.products(id),
    client_id UUID REFERENCES public.clients(id),
    issue TEXT,
    diagnosis TEXT,
    action public.service_action,
    status public.service_status DEFAULT 'OPEN' NOT NULL,
    is_warranty_claim BOOLEAN DEFAULT true NOT NULL,
    vendor_claim_ref TEXT,
    labor_cost NUMERIC DEFAULT 0 NOT NULL,
    part_cost NUMERIC DEFAULT 0 NOT NULL,
    total_cost NUMERIC DEFAULT 0 NOT NULL,
    opened_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved_at TIMESTAMPTZ,
    created_by UUID,
    UNIQUE(company_id, ticket_number)
);

-- 53. service_ticket_parts
CREATE TABLE IF NOT EXISTS public.service_ticket_parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.service_tickets(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    qty NUMERIC NOT NULL,
    unit_cost NUMERIC,
    from_bin_id UUID REFERENCES public.bins(id),
    note TEXT
);

-- 54. lsp_billings
CREATE TABLE IF NOT EXISTS public.lsp_billings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    billing_number TEXT NOT NULL,
    provider_name TEXT NOT NULL,
    period_start DATE,
    period_end DATE,
    amount NUMERIC NOT NULL,
    currency CHARACTER(3) DEFAULT 'IDR' NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL,
    attachment_url TEXT,
    UNIQUE(company_id, billing_number)
);

-- ==============================================================================
-- 8. WORKER PERFORMANCE (§3.7) - 1 Table (Total = 55 Tables)
-- ==============================================================================

-- 55. worker_activities
CREATE TABLE IF NOT EXISTS public.worker_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL,
    activity_type public.activity_type NOT NULL,
    ref_doc_type TEXT,
    ref_doc_id UUID,
    ref_doc_number TEXT,
    lines_count INTEGER DEFAULT 0 NOT NULL,
    units_count NUMERIC DEFAULT 0 NOT NULL,
    duration_seconds INTEGER,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 9. INDEXES & QUERY PERFORMANCE (108 Indexes)
-- ==============================================================================

-- Hot Path Indexes (Section 5)
CREATE INDEX IF NOT EXISTS idx_mov_company_product ON public.stock_movements(company_id, product_id);
CREATE INDEX IF NOT EXISTS idx_mov_bin ON public.stock_movements(bin_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_movement_idempotency ON public.stock_movements(company_id, idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_serial_company_status ON public.serial_numbers(company_id, status);
CREATE INDEX IF NOT EXISTS idx_serial_imei ON public.serial_numbers(imei) WHERE imei IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sol_product ON public.sales_order_lines(product_id);
CREATE INDEX IF NOT EXISTS idx_ap_status_due ON public.ap_bills(company_id, status, due_date);
CREATE INDEX IF NOT EXISTS idx_ar_status_due ON public.sales_invoices(company_id, status, due_date);
CREATE INDEX IF NOT EXISTS idx_worker_company_type ON public.worker_activities(company_id, activity_type);

-- Tenant Isolation Indexes
CREATE INDEX IF NOT EXISTS idx_users_company ON public.company_users(company_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_company ON public.warehouses(company_id);
CREATE INDEX IF NOT EXISTS idx_zones_warehouse ON public.warehouse_zones(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_bins_warehouse_zone ON public.bins(warehouse_id, zone_id);
CREATE INDEX IF NOT EXISTS idx_brands_company ON public.brands(company_id);
CREATE INDEX IF NOT EXISTS idx_products_company ON public.products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_type ON public.products(item_type);
CREATE INDEX IF NOT EXISTS idx_prod_op_wh ON public.product_operational(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_company ON public.suppliers(company_id);
CREATE INDEX IF NOT EXISTS idx_clients_company ON public.clients(company_id);
CREATE INDEX IF NOT EXISTS idx_serials_product ON public.serial_numbers(product_id);
CREATE INDEX IF NOT EXISTS idx_serials_bin ON public.serial_numbers(bin_id);
CREATE INDEX IF NOT EXISTS idx_movements_warehouse ON public.stock_movements(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_movements_serial ON public.stock_movements(serial_id);
CREATE INDEX IF NOT EXISTS idx_movements_type ON public.stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_movements_created ON public.stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_boms_company_prod ON public.boms(company_id, product_id);
CREATE INDEX IF NOT EXISTS idx_bom_lines_bom ON public.bom_lines(bom_id);
CREATE INDEX IF NOT EXISTS idx_asm_orders_company ON public.assembly_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_asm_orders_status ON public.assembly_orders(status);
CREATE INDEX IF NOT EXISTS idx_asm_lines_order ON public.assembly_order_lines(assembly_order_id);
CREATE INDEX IF NOT EXISTS idx_transfers_company ON public.stock_transfers(company_id);
CREATE INDEX IF NOT EXISTS idx_transfer_lines_trf ON public.stock_transfer_lines(transfer_id);
CREATE INDEX IF NOT EXISTS idx_adjs_company ON public.stock_adjustments(company_id);
CREATE INDEX IF NOT EXISTS idx_adj_lines_adj ON public.stock_adjustment_lines(adjustment_id);
CREATE INDEX IF NOT EXISTS idx_opname_company ON public.stock_opname_sessions(company_id);
CREATE INDEX IF NOT EXISTS idx_opname_lines_sess ON public.stock_opname_lines(session_id);
CREATE INDEX IF NOT EXISTS idx_assets_company ON public.assets(company_id);
CREATE INDEX IF NOT EXISTS idx_rma_company ON public.rma_cases(company_id);
CREATE INDEX IF NOT EXISTS idx_rma_status ON public.rma_cases(status);
CREATE INDEX IF NOT EXISTS idx_rma_lines_rma ON public.rma_lines(rma_id);
CREATE INDEX IF NOT EXISTS idx_qc_company ON public.qc_inspections(company_id);
CREATE INDEX IF NOT EXISTS idx_qc_gr ON public.qc_inspections(gr_id);
CREATE INDEX IF NOT EXISTS idx_qc_lines_qc ON public.qc_inspection_lines(qc_id);
CREATE INDEX IF NOT EXISTS idx_po_company ON public.purchase_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_po_supplier ON public.purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_po_status ON public.purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_po_lines_po ON public.purchase_order_lines(po_id);
CREATE INDEX IF NOT EXISTS idx_pr_company ON public.purchase_requisitions(company_id);
CREATE INDEX IF NOT EXISTS idx_pr_lines_pr ON public.purchase_requisition_lines(pr_id);
CREATE INDEX IF NOT EXISTS idx_gr_company ON public.goods_receipts(company_id);
CREATE INDEX IF NOT EXISTS idx_gr_po ON public.goods_receipts(po_id);
CREATE INDEX IF NOT EXISTS idx_gr_status ON public.goods_receipts(status);
CREATE INDEX IF NOT EXISTS idx_gr_lines_gr ON public.goods_receipt_lines(gr_id);
CREATE INDEX IF NOT EXISTS idx_vpl_company_supp ON public.vendor_price_lists(company_id, supplier_id);
CREATE INDEX IF NOT EXISTS idx_vph_supp_prod ON public.vendor_price_history(supplier_id, product_id);
CREATE INDEX IF NOT EXISTS idx_rtv_company ON public.rtv_cases(company_id);
CREATE INDEX IF NOT EXISTS idx_rtv_lines_rtv ON public.rtv_lines(rtv_id);
CREATE INDEX IF NOT EXISTS idx_so_company ON public.sales_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_so_client ON public.sales_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_so_status ON public.sales_orders(status);
CREATE INDEX IF NOT EXISTS idx_so_lines_so ON public.sales_order_lines(so_id);
CREATE INDEX IF NOT EXISTS idx_pick_company ON public.pick_tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_pick_lines_task ON public.pick_lines(pick_task_id);
CREATE INDEX IF NOT EXISTS idx_pack_company ON public.pack_tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_pack_lines_task ON public.pack_lines(pack_task_id);
CREATE INDEX IF NOT EXISTS idx_dn_company ON public.delivery_notes(company_id);
CREATE INDEX IF NOT EXISTS idx_dn_so ON public.delivery_notes(so_id);
CREATE INDEX IF NOT EXISTS idx_dn_status ON public.delivery_notes(status);
CREATE INDEX IF NOT EXISTS idx_dn_lines_dn ON public.delivery_note_lines(sj_id);
CREATE INDEX IF NOT EXISTS idx_ex_rates_pair ON public.exchange_rates(from_currency, to_currency);
CREATE INDEX IF NOT EXISTS idx_si_company ON public.sales_invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_si_so ON public.sales_invoices(so_id);
CREATE INDEX IF NOT EXISTS idx_si_client ON public.sales_invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_ap_company ON public.ap_bills(company_id);
CREATE INDEX IF NOT EXISTS idx_ap_po ON public.ap_bills(po_id);
CREATE INDEX IF NOT EXISTS idx_ap_supplier ON public.ap_bills(supplier_id);
CREATE INDEX IF NOT EXISTS idx_payments_company ON public.payments(company_id);
CREATE INDEX IF NOT EXISTS idx_payments_inv ON public.payments(ref_invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_bill ON public.payments(ref_bill_id);
CREATE INDEX IF NOT EXISTS idx_cogs_company ON public.cogs_records(company_id);
CREATE INDEX IF NOT EXISTS idx_cogs_product ON public.cogs_records(product_id);
CREATE INDEX IF NOT EXISTS idx_srv_company ON public.service_tickets(company_id);
CREATE INDEX IF NOT EXISTS idx_srv_serial ON public.service_tickets(serial_id);
CREATE INDEX IF NOT EXISTS idx_srv_parts_ticket ON public.service_ticket_parts(ticket_id);
CREATE INDEX IF NOT EXISTS idx_lsp_company ON public.lsp_billings(company_id);
CREATE INDEX IF NOT EXISTS idx_worker_worker ON public.worker_activities(worker_id);

-- Additional Referential & Foreign Key Query Optimization Indexes (Completing 108 Indexes)
CREATE INDEX IF NOT EXISTS idx_transfers_from_wh ON public.stock_transfers(from_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_transfers_to_wh ON public.stock_transfers(to_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_transfer_lines_prod ON public.stock_transfer_lines(product_id);
CREATE INDEX IF NOT EXISTS idx_adjs_wh ON public.stock_adjustments(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_adj_lines_prod ON public.stock_adjustment_lines(product_id);
CREATE INDEX IF NOT EXISTS idx_opname_wh ON public.stock_opname_sessions(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_opname_lines_prod ON public.stock_opname_lines(product_id);
CREATE INDEX IF NOT EXISTS idx_pr_lines_prod ON public.purchase_requisition_lines(product_id);
CREATE INDEX IF NOT EXISTS idx_gr_lines_prod ON public.goods_receipt_lines(product_id);
CREATE INDEX IF NOT EXISTS idx_gr_lines_bin ON public.goods_receipt_lines(bin_id);
CREATE INDEX IF NOT EXISTS idx_gr_lines_po_line ON public.goods_receipt_lines(po_line_id);
CREATE INDEX IF NOT EXISTS idx_rtv_supplier ON public.rtv_cases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_rtv_lines_prod ON public.rtv_lines(product_id);
CREATE INDEX IF NOT EXISTS idx_pick_lines_prod ON public.pick_lines(product_id);
CREATE INDEX IF NOT EXISTS idx_pick_lines_sol ON public.pick_lines(so_line_id);
CREATE INDEX IF NOT EXISTS idx_pack_lines_prod ON public.pack_lines(product_id);
CREATE INDEX IF NOT EXISTS idx_dn_lines_prod ON public.delivery_note_lines(product_id);
CREATE INDEX IF NOT EXISTS idx_srv_prod ON public.service_tickets(product_id);
CREATE INDEX IF NOT EXISTS idx_srv_parts_prod ON public.service_ticket_parts(product_id);

-- ==============================================================================
-- 10. REAL-TIME VIEWS (3 Views)
-- ==============================================================================

-- View 1: Saldo Agregasi Real-Time (stock_balances)
CREATE OR REPLACE VIEW public.stock_balances AS
SELECT 
    m.company_id,
    m.product_id,
    m.warehouse_id,
    m.bin_id,
    COALESCE(SUM(m.qty), 0) AS on_hand,
    GREATEST(
        COALESCE((
            SELECT SUM(sol.qty_allocated - sol.qty_shipped)
            FROM public.sales_order_lines sol
            JOIN public.sales_orders so ON so.id = sol.so_id
            WHERE so.company_id = m.company_id 
              AND (so.warehouse_id = m.warehouse_id OR m.warehouse_id IS NULL)
              AND sol.product_id = m.product_id
              AND so.status IN ('CONFIRMED', 'ALLOCATED', 'PICKING', 'PACKING', 'READY')
              AND (sol.qty_allocated - sol.qty_shipped) > 0
        ), 0),
        COALESCE((
            SELECT COUNT(*) 
            FROM public.serial_numbers sn 
            WHERE sn.company_id = m.company_id 
              AND sn.product_id = m.product_id 
              AND (sn.bin_id = m.bin_id OR m.bin_id IS NULL)
              AND sn.status = 'ALLOCATED'::public.serial_status
        ), 0)
    ) AS allocated,
    (COALESCE(SUM(m.qty), 0) - GREATEST(
        COALESCE((
            SELECT SUM(sol.qty_allocated - sol.qty_shipped)
            FROM public.sales_order_lines sol
            JOIN public.sales_orders so ON so.id = sol.so_id
            WHERE so.company_id = m.company_id 
              AND (so.warehouse_id = m.warehouse_id OR m.warehouse_id IS NULL)
              AND sol.product_id = m.product_id
              AND so.status IN ('CONFIRMED', 'ALLOCATED', 'PICKING', 'PACKING', 'READY')
              AND (sol.qty_allocated - sol.qty_shipped) > 0
        ), 0),
        COALESCE((
            SELECT COUNT(*) 
            FROM public.serial_numbers sn 
            WHERE sn.company_id = m.company_id 
              AND sn.product_id = m.product_id 
              AND (sn.bin_id = m.bin_id OR m.bin_id IS NULL)
              AND sn.status = 'ALLOCATED'::public.serial_status
        ), 0)
    )) AS available,
    MAX(m.created_at) AS last_movement_at
FROM public.stock_movements m
GROUP BY m.company_id, m.product_id, m.warehouse_id, m.bin_id;

-- View 2: Analisis Dead Stock & Aging (stock_aging)
CREATE OR REPLACE VIEW public.stock_aging AS
WITH inbound_movements AS (
    SELECT 
        company_id,
        product_id,
        warehouse_id,
        bin_id,
        qty,
        created_at,
        EXTRACT(DAY FROM (now() - created_at))::INTEGER AS age_days
    FROM public.stock_movements
    WHERE movement_type IN ('GR', 'OPN_IN', 'ASM_IN', 'RET_IN')
      AND qty > 0
)
SELECT 
    im.company_id,
    im.product_id,
    im.warehouse_id,
    im.bin_id,
    im.qty,
    im.age_days,
    CASE 
        WHEN im.age_days <= 30 THEN '0-30'::public.aging_bucket
        WHEN im.age_days <= 60 THEN '31-60'::public.aging_bucket
        WHEN im.age_days <= 90 THEN '61-90'::public.aging_bucket
        WHEN im.age_days <= 180 THEN '91-180'::public.aging_bucket
        ELSE '>180'::public.aging_bucket
    END AS aging_bucket,
    im.created_at AS inbound_date
FROM inbound_movements im;

-- View 3: Vendor Scorecard & Performance (vendor_performance)
CREATE OR REPLACE VIEW public.vendor_performance AS
SELECT 
    p.company_id,
    p.supplier_id,
    s.name AS supplier_name,
    COUNT(DISTINCT p.id) AS total_orders,
    COALESCE(SUM(p.total), 0) AS total_order_value,
    AVG(CASE WHEN gr.received_at IS NOT NULL AND p.order_date IS NOT NULL 
        THEN EXTRACT(DAY FROM (gr.received_at - p.order_date::TIMESTAMPTZ)) 
        ELSE NULL END)::NUMERIC(10,1) AS avg_lead_time_days,
    ROUND((COUNT(CASE WHEN gr.received_at::DATE <= p.expected_date THEN 1 END)::NUMERIC / 
           NULLIF(COUNT(DISTINCT gr.id), 0) * 100), 1) AS on_time_rate_pct,
    ROUND((SUM(COALESCE(pol.qty_received, 0))::NUMERIC / 
           NULLIF(SUM(COALESCE(pol.qty_ordered, 0)), 0) * 100), 1) AS fulfillment_rate_pct
FROM public.purchase_orders p
JOIN public.suppliers s ON s.id = p.supplier_id
LEFT JOIN public.purchase_order_lines pol ON pol.po_id = p.id
LEFT JOIN public.goods_receipts gr ON gr.po_id = p.id
GROUP BY p.company_id, p.supplier_id, s.name;

-- ==============================================================================
-- 11. ATOMIC RPC FUNCTIONS (6 Operasi Multi-Baris Transaksional)
-- ==============================================================================

-- RPC 1: Posting GRN -> Movements (QUARANTINE) + SN + PO Qty + AP Bill
CREATE OR REPLACE FUNCTION public.rpc_post_grn(
    p_gr_id UUID,
    p_actor UUID,
    p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_gr RECORD;
    v_line RECORD;
    v_bill_id UUID;
    v_total_bill NUMERIC := 0;
    v_mov_count INTEGER := 0;
BEGIN
    -- Kunci baris GR untuk mencegah race condition
    SELECT * INTO v_gr FROM public.goods_receipts WHERE id = p_gr_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Goods Receipt % tidak ditemukan', p_gr_id;
    END IF;

    IF v_gr.status IN ('POSTED', 'CLOSED') THEN
        RETURN jsonb_build_object('success', true, 'message', 'GRN sudah diposting sebelumnya', 'gr_id', p_gr_id);
    END IF;

    -- Proses setiap baris goods_receipt_lines
    FOR v_line IN SELECT * FROM public.goods_receipt_lines WHERE gr_id = p_gr_id LOOP
        IF v_line.qty_good > 0 THEN
            -- 1. Insert ke immutable stock_movements (Zona Karantina)
            INSERT INTO public.stock_movements (
                company_id, product_id, warehouse_id, bin_id, movement_type,
                qty, unit_cost, batch_no, serial_no, ref_doc_type, ref_doc_id,
                ref_doc_number, idempotency_key, created_by, note
            ) VALUES (
                v_gr.company_id, v_line.product_id, v_gr.warehouse_id, v_line.bin_id,
                'GR'::public.movement_type, v_line.qty_good, COALESCE(v_line.unit_cost, 0),
                v_line.batch_no, v_line.serial_no, 'GRN', p_gr_id, v_gr.gr_number,
                CASE WHEN p_idempotency_key IS NOT NULL THEN p_idempotency_key || '-' || v_line.id ELSE NULL END,
                p_actor, 'Penerimaan GRN via RPC'
            );
            v_mov_count := v_mov_count + 1;

            -- 2. Jika barang serialized, daftarkan unit SN ke serial_numbers
            IF v_line.serial_no IS NOT NULL AND v_line.serial_no <> '' THEN
                INSERT INTO public.serial_numbers (
                    company_id, product_id, serial_no, imei, status, warehouse_id,
                    bin_id, gr_id, gr_line_id, unit_cost, received_at
                ) VALUES (
                    v_gr.company_id, v_line.product_id, v_line.serial_no, v_line.imei,
                    'IN_STOCK'::public.serial_status, v_gr.warehouse_id, v_line.bin_id,
                    p_gr_id, v_line.id, COALESCE(v_line.unit_cost, 0), now()
                )
                ON CONFLICT (company_id, serial_no) DO UPDATE 
                SET status = 'IN_STOCK'::public.serial_status, bin_id = v_line.bin_id;
            END IF;

            -- 3. Akumulasi nilai untuk AP Bill
            v_total_bill := v_total_bill + (v_line.qty_good * COALESCE(v_line.unit_cost, 0));

            -- 4. Update qty_received di purchase_order_lines bila ada referensi PO
            IF v_line.po_line_id IS NOT NULL THEN
                UPDATE public.purchase_order_lines 
                SET qty_received = qty_received + v_line.qty_received
                WHERE id = v_line.po_line_id;
            END IF;
        END IF;
    END LOOP;

    -- 5. Buat AP Bill otomatis jika berasal dari PO
    IF v_gr.po_id IS NOT NULL AND v_total_bill > 0 THEN
        INSERT INTO public.ap_bills (
            company_id, bill_number, po_id, gr_id, supplier_id, currency,
            exchange_rate, amount, tax, total, status, issued_date, due_date
        ) 
        SELECT 
            v_gr.company_id, 'BILL-' || v_gr.gr_number, v_gr.po_id, p_gr_id,
            po.supplier_id, po.currency, po.exchange_rate, v_total_bill, 0, v_total_bill,
            'unpaid'::public.invoice_status, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days'
        FROM public.purchase_orders po WHERE po.id = v_gr.po_id
        RETURNING id INTO v_bill_id;
    END IF;

    -- 6. Update status Goods Receipt menjadi POSTED
    UPDATE public.goods_receipts 
    SET status = 'POSTED'::public.gr_status, received_at = now()
    WHERE id = p_gr_id;

    RETURN jsonb_build_object(
        'success', true,
        'gr_id', p_gr_id,
        'status', 'POSTED',
        'bill_id', v_bill_id,
        'movements_posted', v_mov_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC 2: Eksekusi Assembly Order -> Backflush ASM_OUT Komponen + ASM_IN Output + COGS Roll-up
CREATE OR REPLACE FUNCTION public.rpc_execute_assembly(
    p_asm_id UUID,
    p_actor UUID,
    p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_asm RECORD;
    v_bom RECORD;
    v_line RECORD;
    v_total_material_cost NUMERIC := 0;
    v_unit_hpp NUMERIC := 0;
    v_sn_code TEXT;
BEGIN
    SELECT * INTO v_asm FROM public.assembly_orders WHERE id = p_asm_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Assembly order % tidak ditemukan', p_asm_id; END IF;
    IF v_asm.status = 'COMPLETED' THEN
        RETURN jsonb_build_object('success', true, 'message', 'Assembly order sudah selesai', 'asm_id', p_asm_id);
    END IF;

    SELECT * INTO v_bom FROM public.boms WHERE id = v_asm.bom_id;

    -- 1. Backflush: Potong stok komponen (ASM_OUT)
    FOR v_line IN SELECT aol.*, p.sku,
                  COALESCE(
                      (SELECT sm.unit_cost FROM public.stock_movements sm 
                       WHERE sm.product_id = aol.component_product_id AND sm.unit_cost IS NOT NULL AND sm.unit_cost > 0 
                       ORDER BY sm.created_at DESC LIMIT 1),
                      (SELECT vpl.unit_price FROM public.vendor_price_lists vpl 
                       WHERE vpl.product_id = aol.component_product_id LIMIT 1),
                      0
                  ) AS component_unit_cost
                  FROM public.assembly_order_lines aol
                  JOIN public.products p ON p.id = aol.component_product_id
                  WHERE aol.assembly_order_id = p_asm_id LOOP
        
        INSERT INTO public.stock_movements (
            company_id, product_id, warehouse_id, bin_id, movement_type,
            qty, unit_cost, ref_doc_type, ref_doc_id, ref_doc_number,
            created_by, note
        ) VALUES (
            v_asm.company_id, v_line.component_product_id, v_asm.warehouse_id, v_line.from_bin_id,
            'ASM_OUT'::public.movement_type, -v_line.qty_required, COALESCE(v_line.component_unit_cost, 0),
            'ASM', p_asm_id, v_asm.assembly_number, p_actor, 'Konsumsi komponen perakitan'
        );

        UPDATE public.assembly_order_lines 
        SET qty_consumed = v_line.qty_required 
        WHERE id = v_line.id;

        v_total_material_cost := v_total_material_cost + (v_line.qty_required * COALESCE(v_line.component_unit_cost, 0));
    END LOOP;

    -- 2. Hitung Roll-up COGS HPP unit perakitan
    v_unit_hpp := (v_total_material_cost / NULLIF(v_asm.qty_to_build, 0)) + COALESCE(v_bom.labor_cost, 0) + COALESCE(v_bom.overhead_cost, 0);

    -- 3. Tambah stok produk output hasil rakitan (ASM_IN)
    INSERT INTO public.stock_movements (
        company_id, product_id, warehouse_id, bin_id, movement_type,
        qty, unit_cost, ref_doc_type, ref_doc_id, ref_doc_number,
        created_by, note
    ) VALUES (
        v_asm.company_id, v_asm.output_product_id, v_asm.warehouse_id, v_asm.target_bin_id,
        'ASM_IN'::public.movement_type, v_asm.qty_to_build, v_unit_hpp,
        'ASM', p_asm_id, v_asm.assembly_number, p_actor, 'Output perakitan selesai'
    );

    -- 4. Catat COGS ke cogs_records
    INSERT INTO public.cogs_records (
        company_id, product_id, method, material_cost, labor_cost, overhead_cost, total_cost
    ) VALUES (
        v_asm.company_id, v_asm.output_product_id, 'BOM_ROLLUP'::public.cogs_method,
        v_total_material_cost, COALESCE(v_bom.labor_cost, 0), COALESCE(v_bom.overhead_cost, 0), v_unit_hpp
    );

    -- 5. Jika output adalah serialized, generate unit SN
    v_sn_code := 'SN-ASM-' || substring(v_asm.assembly_number from 5) || '-01';
    INSERT INTO public.serial_numbers (
        company_id, product_id, serial_no, status, warehouse_id, bin_id, unit_cost, received_at
    ) VALUES (
        v_asm.company_id, v_asm.output_product_id, v_sn_code,
        'IN_STOCK'::public.serial_status, v_asm.warehouse_id, v_asm.target_bin_id, v_unit_hpp, now()
    ) ON CONFLICT DO NOTHING;

    -- 6. Update status order
    UPDATE public.assembly_orders 
    SET status = 'COMPLETED'::public.assembly_status, completed_at = now()
    WHERE id = p_asm_id;

    RETURN jsonb_build_object(
        'success', true,
        'asm_id', p_asm_id,
        'unit_hpp', v_unit_hpp,
        'status', 'COMPLETED'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC 3: Bongkar Prebuilt (De-bundling)
CREATE OR REPLACE FUNCTION public.rpc_debundle(
    p_asm_id UUID,
    p_actor UUID,
    p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_asm RECORD;
    v_line RECORD;
BEGIN
    SELECT * INTO v_asm FROM public.assembly_orders WHERE id = p_asm_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Assembly order % tidak ditemukan', p_asm_id; END IF;

    -- 1. Kurangi stok prebuilt output
    INSERT INTO public.stock_movements (
        company_id, product_id, warehouse_id, bin_id, movement_type,
        qty, ref_doc_type, ref_doc_id, ref_doc_number, created_by, note
    ) VALUES (
        v_asm.company_id, v_asm.output_product_id, v_asm.warehouse_id, v_asm.target_bin_id,
        'ASM_OUT'::public.movement_type, -v_asm.qty_to_build, 'DEBUNDLE', p_asm_id,
        v_asm.assembly_number, p_actor, 'Bongkar unit prebuilt kembali ke komponen'
    );

    -- 2. Kembalikan stok komponen ke rak bin
    FOR v_line IN SELECT * FROM public.assembly_order_lines WHERE assembly_order_id = p_asm_id LOOP
        INSERT INTO public.stock_movements (
            company_id, product_id, warehouse_id, bin_id, movement_type,
            qty, ref_doc_type, ref_doc_id, ref_doc_number, created_by, note
        ) VALUES (
            v_asm.company_id, v_line.component_product_id, v_asm.warehouse_id, v_line.from_bin_id,
            'ASM_IN'::public.movement_type, v_line.qty_required, 'DEBUNDLE', p_asm_id,
            v_asm.assembly_number, p_actor, 'Komponen hasil de-bundling'
        );
    END LOOP;

    -- 3. Update status order
    UPDATE public.assembly_orders 
    SET status = 'CANCELLED'::public.assembly_status, note = 'De-bundled via RPC'
    WHERE id = p_asm_id;

    RETURN jsonb_build_object('success', true, 'asm_id', p_asm_id, 'status', 'CANCELLED');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC 4: Transfer Antar Gudang / Bin Atomik
CREATE OR REPLACE FUNCTION public.rpc_transfer_stock(
    p_trf_id UUID,
    p_actor UUID,
    p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_trf RECORD;
    v_line RECORD;
BEGIN
    SELECT * INTO v_trf FROM public.stock_transfers WHERE id = p_trf_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Transfer % tidak ditemukan', p_trf_id; END IF;

    FOR v_line IN SELECT * FROM public.stock_transfer_lines WHERE transfer_id = p_trf_id LOOP
        -- Potong dari lokasi asal (TRF_OUT)
        INSERT INTO public.stock_movements (
            company_id, product_id, warehouse_id, bin_id, movement_type,
            qty, ref_doc_type, ref_doc_id, ref_doc_number, created_by, note
        ) VALUES (
            v_trf.company_id, v_line.product_id, v_trf.from_warehouse_id, v_trf.from_bin_id,
            'TRF_OUT'::public.movement_type, -v_line.qty_requested, 'TRF', p_trf_id,
            v_trf.transfer_number, p_actor, 'Transfer keluar'
        );

        -- Masuk ke lokasi tujuan (TRF_IN)
        INSERT INTO public.stock_movements (
            company_id, product_id, warehouse_id, bin_id, movement_type,
            qty, ref_doc_type, ref_doc_id, ref_doc_number, created_by, note
        ) VALUES (
            v_trf.company_id, v_line.product_id, v_trf.to_warehouse_id, v_trf.to_bin_id,
            'TRF_IN'::public.movement_type, v_line.qty_requested, 'TRF', p_trf_id,
            v_trf.transfer_number, p_actor, 'Transfer masuk'
        );

        -- Update serial_numbers bila serialized
        IF v_line.serial_no IS NOT NULL THEN
            UPDATE public.serial_numbers
            SET warehouse_id = v_trf.to_warehouse_id, bin_id = v_trf.to_bin_id
            WHERE company_id = v_trf.company_id AND serial_no = v_line.serial_no;
        END IF;
    END LOOP;

    UPDATE public.stock_transfers 
    SET status = 'RECEIVED'::public.transfer_status, received_at = now()
    WHERE id = p_trf_id;

    RETURN jsonb_build_object('success', true, 'trf_id', p_trf_id, 'status', 'RECEIVED');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC 5: Alokasi Sales Order dari Stok Available
CREATE OR REPLACE FUNCTION public.rpc_allocate_so(
    p_so_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_so RECORD;
    v_line RECORD;
    v_avail NUMERIC;
BEGIN
    SELECT * INTO v_so FROM public.sales_orders WHERE id = p_so_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Sales order % tidak ditemukan', p_so_id; END IF;

    FOR v_line IN SELECT * FROM public.sales_order_lines WHERE so_id = p_so_id LOOP
        SELECT COALESCE(SUM(available), 0) INTO v_avail 
        FROM public.stock_balances 
        WHERE company_id = v_so.company_id AND product_id = v_line.product_id;

        IF v_avail < v_line.qty_ordered THEN
            RAISE EXCEPTION 'Stok available tidak mencukupi untuk SKU % (butuh %, tersedia %)', 
                v_line.product_id, v_line.qty_ordered, v_avail;
        END IF;

        UPDATE public.sales_order_lines 
        SET qty_allocated = v_line.qty_ordered 
        WHERE id = v_line.id;
    END LOOP;

    UPDATE public.sales_orders 
    SET status = 'ALLOCATED'::public.so_status 
    WHERE id = p_so_id;

    RETURN jsonb_build_object('success', true, 'so_id', p_so_id, 'status', 'ALLOCATED');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC 6: Pengiriman Surat Jalan (Goods Issue) + AR Invoice Otomatis
CREATE OR REPLACE FUNCTION public.rpc_ship_order(
    p_sj_id UUID,
    p_actor UUID,
    p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_sj RECORD;
    v_so RECORD;
    v_line RECORD;
    v_inv_id UUID;
BEGIN
    SELECT * INTO v_sj FROM public.delivery_notes WHERE id = p_sj_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Delivery note % tidak ditemukan', p_sj_id; END IF;

    SELECT * INTO v_so FROM public.sales_orders WHERE id = v_sj.so_id;

    -- 1. Posting GI (Goods Issue) untuk setiap item yang dikirim
    FOR v_line IN SELECT * FROM public.delivery_note_lines WHERE sj_id = p_sj_id LOOP
        INSERT INTO public.stock_movements (
            company_id, product_id, warehouse_id, movement_type,
            qty, ref_doc_type, ref_doc_id, ref_doc_number, created_by, note
        ) VALUES (
            v_sj.company_id, v_line.product_id, v_sj.warehouse_id,
            'GI'::public.movement_type, -v_line.qty, 'SJ', p_sj_id,
            v_sj.sj_number, p_actor, 'Pengiriman barang via Surat Jalan'
        );

        -- Update serial menjadi SOLD & aktifkan garansi pelanggan
        IF v_line.serial_no IS NOT NULL THEN
            UPDATE public.serial_numbers 
            SET status = 'SOLD'::public.serial_status, sold_at = now(),
                customer_warranty_start = CURRENT_DATE,
                customer_warranty_end = CURRENT_DATE + INTERVAL '1 year',
                sj_id = p_sj_id
            WHERE company_id = v_sj.company_id AND serial_no = v_line.serial_no;
        END IF;
    END LOOP;

    -- 2. Update status Surat Jalan & Sales Order
    UPDATE public.delivery_notes 
    SET status = 'DELIVERED'::public.sj_status, delivered_at = now()
    WHERE id = p_sj_id;

    UPDATE public.sales_orders 
    SET status = 'DELIVERED'::public.so_status 
    WHERE id = v_sj.so_id;

    -- 3. Auto-draft AR Sales Invoice
    INSERT INTO public.sales_invoices (
        company_id, invoice_number, so_id, sj_id, client_id, currency,
        exchange_rate, amount, tax, total, status, issued_date, due_date
    ) VALUES (
        v_sj.company_id, 'INV-' || v_sj.sj_number, v_sj.so_id, p_sj_id,
        v_sj.client_id, v_so.currency, v_so.exchange_rate, v_so.total,
        v_so.tax, v_so.total, 'unpaid'::public.invoice_status,
        CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days'
    ) RETURNING id INTO v_inv_id;

    RETURN jsonb_build_object(
        'success', true,
        'sj_id', p_sj_id,
        'invoice_id', v_inv_id,
        'status', 'DELIVERED'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 12. MULTI-TENANT ROW LEVEL SECURITY POLICIES (34 Policies)
-- ==============================================================================

DO $$
DECLARE
    tbl TEXT;
    -- 32 Tables with direct company_id column
    tbls TEXT[] := ARRAY[
        'company_users', 'warehouses', 'brands', 'products', 'suppliers',
        'clients', 'serial_numbers', 'stock_movements', 'boms', 'assembly_orders',
        'stock_transfers', 'stock_adjustments', 'stock_opname_sessions', 'assets',
        'rma_cases', 'qc_inspections', 'purchase_orders', 'purchase_requisitions',
        'goods_receipts', 'vendor_price_lists', 'rtv_cases', 'sales_orders',
        'pick_tasks', 'pack_tasks', 'delivery_notes', 'sales_invoices',
        'ap_bills', 'payments', 'cogs_records', 'service_tickets',
        'lsp_billings', 'worker_activities'
    ];
BEGIN
    FOREACH tbl IN ARRAY tbls LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_%I ON public.%I;', tbl, tbl);
        EXECUTE format('
            CREATE POLICY tenant_isolation_%I ON public.%I
            AS RESTRICTIVE
            FOR ALL
            USING (
                company_id = public.current_company_id() 
                OR current_setting(''request.jwt.claims'', true)::jsonb->>''role'' = ''SUPER_ADMIN''
                OR current_setting(''role'', true) = ''service_role''
                OR public.current_company_id() IS NULL -- Fallback untuk dev/anon bila belum ada JWT injection
            )
            WITH CHECK (
                company_id = public.current_company_id()
                OR current_setting(''request.jwt.claims'', true)::jsonb->>''role'' = ''SUPER_ADMIN''
                OR current_setting(''role'', true) = ''service_role''
                OR public.current_company_id() IS NULL
            );
        ', tbl, tbl);
    END LOOP;
END $$;

-- Policy 33: Tabel companies (User hanya melihat company miliknya berdasarkan PK id)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_companies ON public.companies;
CREATE POLICY tenant_isolation_companies ON public.companies
AS RESTRICTIVE
FOR ALL USING (
    id = public.current_company_id()
    OR current_setting('request.jwt.claims', true)::jsonb->>'role' = 'SUPER_ADMIN'
    OR current_setting('role', true) = 'service_role'
    OR public.current_company_id() IS NULL
);

-- Policy 34: Tabel warehouse_zones (Isolasi via relasi gudang perusahaan warehouse_id)
ALTER TABLE public.warehouse_zones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_warehouse_zones ON public.warehouse_zones;
CREATE POLICY tenant_isolation_warehouse_zones ON public.warehouse_zones
AS RESTRICTIVE
FOR ALL USING (
    warehouse_id IN (SELECT w.id FROM public.warehouses w WHERE w.company_id = public.current_company_id())
    OR current_setting('request.jwt.claims', true)::jsonb->>'role' = 'SUPER_ADMIN'
    OR current_setting('role', true) = 'service_role'
    OR public.current_company_id() IS NULL
);

-- ==============================================================================
-- 13. SEED MASTER CURRENCIES
-- ==============================================================================

INSERT INTO public.currencies (code, name, symbol, is_base) VALUES
    ('IDR', 'Indonesian Rupiah', 'Rp', true),
    ('USD', 'US Dollar', '$', false),
    ('SGD', 'Singapore Dollar', 'S$', false),
    ('EUR', 'Euro', '€', false)
ON CONFLICT (code) DO UPDATE 
SET name = EXCLUDED.name, symbol = EXCLUDED.symbol, is_base = EXCLUDED.is_base;

INSERT INTO public.exchange_rates (from_currency, to_currency, rate, effective_date, source) VALUES
    ('USD', 'IDR', 15650.00, CURRENT_DATE, 'Bank Indonesia'),
    ('SGD', 'IDR', 11800.00, CURRENT_DATE, 'Bank Indonesia'),
    ('EUR', 'IDR', 16800.00, CURRENT_DATE, 'Bank Indonesia')
ON CONFLICT (from_currency, to_currency, effective_date) DO NOTHING;

-- ==============================================================================
-- 14. DATA MIGRATION & BACKFILL DARI SISTEM LAMA (§11)
-- ==============================================================================

DO $$
DECLARE
    v_def_company_id UUID;
    v_wh_id UUID;
    v_bin_id UUID;
    v_zone_id UUID;
BEGIN
    -- 1. Pastikan Perusahaan Default MANUFACTURE terdaftar
    INSERT INTO public.companies (name, legal_name, base_currency)
    VALUES ('MANUFACTURE', 'PT Manufaktur Komputer Indonesia', 'IDR')
    ON CONFLICT DO NOTHING;

    SELECT id INTO v_def_company_id FROM public.companies WHERE name = 'MANUFACTURE' LIMIT 1;
    IF v_def_company_id IS NULL THEN
        SELECT id INTO v_def_company_id FROM public.companies LIMIT 1;
    END IF;

    IF v_def_company_id IS NOT NULL THEN
        -- 2. Buat Gudang & Bin default untuk backfill jika belum ada
        INSERT INTO public.warehouses (company_id, code, name, type)
        VALUES (v_def_company_id, 'WH-JKT-01', 'Gudang Pusat Cikarang', 'central'::public.warehouse_type)
        ON CONFLICT (company_id, code) DO UPDATE SET name = EXCLUDED.name
        RETURNING id INTO v_wh_id;

        IF v_wh_id IS NULL THEN
            SELECT id INTO v_wh_id FROM public.warehouses WHERE company_id = v_def_company_id LIMIT 1;
        END IF;

        INSERT INTO public.warehouse_zones (warehouse_id, code, name, category)
        VALUES (v_wh_id, 'ZONE-SP', 'Zona Rak Spare Parts', 'SPARE_PART'::public.zone_category)
        ON CONFLICT (warehouse_id, code) DO UPDATE SET name = EXCLUDED.name
        RETURNING id INTO v_zone_id;

        IF v_zone_id IS NULL THEN
            SELECT id INTO v_zone_id FROM public.warehouse_zones WHERE warehouse_id = v_wh_id LIMIT 1;
        END IF;

        INSERT INTO public.bins (warehouse_id, zone_id, code, rack, shelf, level, bin_type)
        VALUES (v_wh_id, v_zone_id, 'SP-A-1-01', 'Rack-A', 'Shelf-1', '01', 'storage'::public.bin_type)
        ON CONFLICT (warehouse_id, code) DO UPDATE SET rack = EXCLUDED.rack
        RETURNING id INTO v_bin_id;

        IF v_bin_id IS NULL THEN
            SELECT id INTO v_bin_id FROM public.bins WHERE warehouse_id = v_wh_id LIMIT 1;
        END IF;

        -- 3. Migrasi tabel lama: items -> products (jika tabel items ada)
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'items') THEN
            INSERT INTO public.products (
                id, company_id, sku, barcode, name, category, item_type, uom, is_serial, created_at
            )
            SELECT 
                it.id,
                v_def_company_id,
                it.sku,
                COALESCE(it.sku, 'BAR-' || it.id),
                it.name,
                it.category,
                CASE 
                    WHEN it.category ILIKE '%prebuilt%' OR it.category ILIKE '%desktop%' THEN 'PREBUILT'::public.item_type
                    WHEN it.category ILIKE '%barebone%' OR it.category ILIKE '%mini%' THEN 'BAREBONE'::public.item_type
                    ELSE 'SPARE_PART'::public.item_type
                END,
                'PCS',
                false,
                COALESCE(it.created_at, now())
            FROM public.items it
            ON CONFLICT (company_id, sku) DO NOTHING;

            -- 4. Backfill Saldo Awal: stock_on_hand -> stock_movements (movement_type = 'OPN_IN')
            INSERT INTO public.stock_movements (
                company_id, product_id, warehouse_id, bin_id, movement_type,
                qty, ref_doc_number, note
            )
            SELECT 
                v_def_company_id,
                p.id,
                v_wh_id,
                v_bin_id,
                'OPN_IN'::public.movement_type,
                it.stock_on_hand,
                'MIGRASI-V2',
                'Saldo awal migrasi dari items.stock_on_hand'
            FROM public.items it
            JOIN public.products p ON p.sku = it.sku AND p.company_id = v_def_company_id
            WHERE it.stock_on_hand > 0
              AND NOT EXISTS (
                  SELECT 1 FROM public.stock_movements sm 
                  WHERE sm.product_id = p.id AND sm.ref_doc_number = 'MIGRASI-V2'
              );
        END IF;
    END IF;
END $$;
