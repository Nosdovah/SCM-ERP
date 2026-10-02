-- ==============================================================================
-- MOAI ERP v2.0 - Database Schema Migration (PostgreSQL / Supabase)
-- Domain: Distributor & Integrator Komputer (Prebuilt, Barebone, Spare Parts)
-- Features: Immutable Stock Ledger, Serial Registry, BOM Assembly, Multi-Tenant RLS
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. MASTER DATA: Perusahaan, Pengguna & Lokasi Fisik Gudang
-- ------------------------------------------------------------------------------

-- Perusahaan (Tenant)
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE,
    name TEXT NOT NULL,
    base_currency TEXT DEFAULT 'IDR',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Pengguna Perusahaan & RBAC Matrix
CREATE TABLE IF NOT EXISTS public.company_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID, -- References auth.users(id) in Supabase
    user_email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'VIEWER' CHECK (role IN (
        'SUPER_ADMIN', 'COMPANY_ADMIN', 'SCM_ADMIN', 'QC_INSPECTOR',
        'INVENTORY_ADMIN', 'ASSEMBLY_TECH', 'OUTBOUND_ADMIN', 'PICKING_ADMIN',
        'PACKING_ADMIN', 'RETURN_ADMIN', 'FINANCE_ADMIN', 'SALES', 'VIEWER'
    )),
    warehouse_scope UUID[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, user_email)
);

-- Gudang (Warehouse)
CREATE TABLE IF NOT EXISTS public.warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'central' CHECK (type IN ('central', 'regional', 'transit', 'project')),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, code)
);

-- Zona Gudang (Kategori Rak Fisik)
CREATE TABLE IF NOT EXISTS public.warehouse_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'PREBUILT', 'BAREBONE', 'SPARE_PART', 'QUARANTINE', 'RMA', 'DEFECTIVE'
    )),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(warehouse_id, code)
);

-- Bin / Lokasi Fisik Berjenjang ({zone}-{rack}-{shelf}-{level})
CREATE TABLE IF NOT EXISTS public.bins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
    zone_id UUID NOT NULL REFERENCES public.warehouse_zones(id) ON DELETE CASCADE,
    code TEXT NOT NULL, -- Contoh: PB-A-1-01, SP-RAM-B-02
    rack TEXT NOT NULL,
    shelf TEXT NOT NULL,
    level TEXT NOT NULL,
    bin_type TEXT DEFAULT 'storage' CHECK (bin_type IN ('storage', 'staging', 'quarantine', 'return', 'damaged')),
    capacity NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(warehouse_id, code)
);

-- Brand / Merk
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    description TEXT,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Master Produk Komputer & Komponen
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    barcode TEXT,
    name TEXT NOT NULL,
    category TEXT,
    item_type TEXT NOT NULL CHECK (item_type IN ('PREBUILT', 'BAREBONE', 'SPARE_PART')),
    brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
    uom TEXT DEFAULT 'UNIT',
    is_batch BOOLEAN DEFAULT false,
    is_serial BOOLEAN DEFAULT false, -- True untuk CPU, GPU, Laptop, PC, Motherboard
    is_assembly BOOLEAN DEFAULT false, -- True untuk barang yang dirakit via BOM
    weight NUMERIC DEFAULT 0,
    volume NUMERIC DEFAULT 0,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, sku)
);

-- Parameter Operasional Produk per Gudang
CREATE TABLE IF NOT EXISTS public.product_operational (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
    min_stock NUMERIC DEFAULT 0,
    max_stock NUMERIC DEFAULT 0,
    reorder_point NUMERIC DEFAULT 0,
    reorder_qty NUMERIC DEFAULT 0,
    safety_stock NUMERIC DEFAULT 0,
    shelf_life_days INTEGER DEFAULT 0,
    storage_condition TEXT,
    handling_note TEXT,
    auto_putaway BOOLEAN DEFAULT true,
    abc_class TEXT DEFAULT 'B' CHECK (abc_class IN ('A', 'B', 'C')),
    is_fast_moving BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(product_id, warehouse_id)
);

-- Pemasok / Suppliers
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
    currency TEXT DEFAULT 'IDR',
    is_principal BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, code)
);

-- Klien / Customers
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
    credit_limit NUMERIC DEFAULT 0,
    segment TEXT DEFAULT 'corporate' CHECK (segment IN ('retail', 'corporate', 'government')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, code)
);

-- ------------------------------------------------------------------------------
-- 2. INVENTORY MANAGEMENT: Stock Movements (Immutable Ledger) & Serial Registry
-- ------------------------------------------------------------------------------

-- Registry Unit Serialized (Pelacakan Per-Unit SN / IMEI)
CREATE TABLE IF NOT EXISTS public.serial_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    serial_no TEXT NOT NULL,
    imei TEXT,
    status TEXT NOT NULL DEFAULT 'IN_STOCK' CHECK (status IN (
        'IN_STOCK', 'ALLOCATED', 'SOLD', 'IN_TRANSIT', 'RMA',
        'DEFECTIVE', 'RETURNED_VENDOR', 'WARRANTY_SERVICE', 'SCRAPPED'
    )),
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

-- Stock Movements (IMMUTABLE LEDGER - Single Source of Truth)
-- Aturan: Tidak ada UPDATE/DELETE saldo. Semua pergerakan stok adalah baris baru INSERT (+ / -).
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
    bin_id UUID NOT NULL REFERENCES public.bins(id) ON DELETE RESTRICT,
    serial_id UUID REFERENCES public.serial_numbers(id) ON DELETE SET NULL,
    movement_type TEXT NOT NULL CHECK (movement_type IN (
        'GR', 'GI', 'TRF_IN', 'TRF_OUT', 'ADJ_IN', 'ADJ_OUT', 'OPN_IN', 'OPN_OUT',
        'RET_IN', 'RET_OUT', 'ASM_OUT', 'ASM_IN', 'QC_HOLD', 'QC_RELEASE',
        'QC_REJECT', 'RMA_IN', 'RMA_OUT', 'RTV_OUT', 'WARRANTY_OUT'
    )),
    qty NUMERIC NOT NULL, -- SIGNED: positif untuk inbound/penambahan, negatif untuk outbound/pengurangan
    unit_cost NUMERIC DEFAULT 0,
    batch_no TEXT,
    serial_no TEXT,
    ref_doc_type TEXT, -- PO, GRN, SO, SJ, ASM, ADJ, OPN, RMA, TRF
    ref_doc_id UUID,
    ref_doc_number TEXT,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    note TEXT
);

-- View Saldo Agregasi Real-Time (Stock Balances)
CREATE OR REPLACE VIEW public.stock_balances AS
SELECT 
    m.company_id,
    m.product_id,
    m.warehouse_id,
    m.bin_id,
    COALESCE(SUM(m.qty), 0) AS on_hand,
    COALESCE(
        (SELECT COUNT(*) FROM public.serial_numbers sn 
         WHERE sn.product_id = m.product_id 
           AND sn.bin_id = m.bin_id 
           AND sn.status = 'ALLOCATED'), 
        0
    ) AS allocated,
    (COALESCE(SUM(m.qty), 0) - COALESCE(
        (SELECT COUNT(*) FROM public.serial_numbers sn 
         WHERE sn.product_id = m.product_id 
           AND sn.bin_id = m.bin_id 
           AND sn.status = 'ALLOCATED'), 
        0
    )) AS available,
    MAX(m.created_at) AS last_movement_at
FROM public.stock_movements m
GROUP BY m.company_id, m.product_id, m.warehouse_id, m.bin_id;

-- ------------------------------------------------------------------------------
-- 3. BILL OF MATERIALS (BOM) & ASSEMBLY ORDER ENGINE
-- ------------------------------------------------------------------------------

-- Master BOM (Resep Perakitan PC/Server Prebuilt dari Komponen)
CREATE TABLE IF NOT EXISTS public.boms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    version TEXT NOT NULL DEFAULT 'v1.0',
    name TEXT NOT NULL,
    labor_cost NUMERIC DEFAULT 0,
    overhead_cost NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, product_id, version)
);

-- Rincian Komponen BOM
CREATE TABLE IF NOT EXISTS public.bom_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bom_id UUID NOT NULL REFERENCES public.boms(id) ON DELETE CASCADE,
    component_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    qty NUMERIC NOT NULL DEFAULT 1,
    scrap_pct NUMERIC DEFAULT 0,
    note TEXT
);

-- Assembly Orders (Perintah Perakitan & De-bundling)
CREATE TABLE IF NOT EXISTS public.assembly_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    assembly_number TEXT NOT NULL,
    bom_id UUID NOT NULL REFERENCES public.boms(id) ON DELETE RESTRICT,
    output_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    qty_to_build INTEGER NOT NULL DEFAULT 1,
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
    target_bin_id UUID REFERENCES public.bins(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PLANNED', 'ISSUED', 'COMPLETED', 'CANCELLED')),
    planned_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_by TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, assembly_number)
);

CREATE TABLE IF NOT EXISTS public.assembly_order_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assembly_order_id UUID NOT NULL REFERENCES public.assembly_orders(id) ON DELETE CASCADE,
    component_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    qty_required NUMERIC NOT NULL,
    qty_issued NUMERIC DEFAULT 0,
    qty_consumed NUMERIC DEFAULT 0,
    from_bin_id UUID REFERENCES public.bins(id) ON DELETE SET NULL,
    note TEXT
);

-- ------------------------------------------------------------------------------
-- 4. OPERASI INVENTORY: Transfer, Adjustment, Opname & Assets
-- ------------------------------------------------------------------------------

-- Transfer Antar Gudang / Bin
CREATE TABLE IF NOT EXISTS public.stock_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    transfer_number TEXT NOT NULL,
    from_warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
    from_bin_id UUID REFERENCES public.bins(id),
    to_warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
    to_bin_id UUID REFERENCES public.bins(id),
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'PENDING', 'APPROVED', 'IN_TRANSIT', 'RECEIVED', 'CLOSED'
    )),
    requested_by TEXT NOT NULL,
    approved_by TEXT,
    shipped_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, transfer_number)
);

CREATE TABLE IF NOT EXISTS public.stock_transfer_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id UUID NOT NULL REFERENCES public.stock_transfers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    qty_requested NUMERIC NOT NULL,
    qty_shipped NUMERIC DEFAULT 0,
    qty_received NUMERIC DEFAULT 0,
    serial_no TEXT,
    batch_no TEXT,
    note TEXT
);

-- Penyesuaian Stok (Stock Adjustment)
CREATE TABLE IF NOT EXISTS public.stock_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    adj_number TEXT NOT NULL,
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
    bin_id UUID REFERENCES public.bins(id),
    reason TEXT NOT NULL CHECK (reason IN ('damage', 'loss', 'found', 'expiry', 'correction')),
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'POSTED')),
    requested_by TEXT NOT NULL,
    approved_by TEXT,
    adjusted_at TIMESTAMPTZ,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, adj_number)
);

CREATE TABLE IF NOT EXISTS public.stock_adjustment_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    adjustment_id UUID NOT NULL REFERENCES public.stock_adjustments(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    serial_id UUID REFERENCES public.serial_numbers(id),
    qty_system NUMERIC NOT NULL,
    qty_actual NUMERIC NOT NULL,
    qty_variance NUMERIC NOT NULL,
    unit_cost NUMERIC DEFAULT 0,
    note TEXT
);

-- Stock Opname / Stock Take
CREATE TABLE IF NOT EXISTS public.stock_opname_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    session_number TEXT NOT NULL,
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
    scope TEXT DEFAULT 'zone' CHECK (scope IN ('full', 'zone', 'cycle')),
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'COUNTING', 'REVIEW', 'POSTED', 'CLOSED')),
    started_by TEXT NOT NULL,
    started_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    closed_by TEXT,
    closed_at TIMESTAMPTZ,
    note TEXT,
    UNIQUE(company_id, session_number)
);

CREATE TABLE IF NOT EXISTS public.stock_opname_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.stock_opname_sessions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    bin_id UUID REFERENCES public.bins(id),
    serial_no TEXT,
    qty_system NUMERIC NOT NULL,
    qty_counted NUMERIC DEFAULT 0,
    qty_variance NUMERIC DEFAULT 0,
    counted_by TEXT,
    counted_at TIMESTAMPTZ,
    recount_flag BOOLEAN DEFAULT false
);

-- Manajemen Aset Operasional
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    asset_code TEXT NOT NULL,
    barcode TEXT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    warehouse_id UUID REFERENCES public.warehouses(id),
    bin_id UUID REFERENCES public.bins(id),
    acquisition_date DATE,
    acquisition_cost NUMERIC DEFAULT 0,
    current_value NUMERIC DEFAULT 0,
    depreciation_method TEXT DEFAULT 'straight_line',
    useful_life_months INTEGER DEFAULT 36,
    status TEXT DEFAULT 'active',
    assigned_to TEXT,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, asset_code)
);

-- ------------------------------------------------------------------------------
-- 5. SUPPLY CHAIN MANAGEMENT (SCM): PR, PO, GRN, QC & RTV
-- ------------------------------------------------------------------------------

-- Purchase Requisitions (Saran Reorder Otomatis & Manual)
CREATE TABLE IF NOT EXISTS public.purchase_requisitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    pr_number TEXT NOT NULL,
    source TEXT DEFAULT 'AUTO_REORDER' CHECK (source IN ('AUTO_REORDER', 'MANUAL')),
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CONVERTED', 'CLOSED', 'DISMISSED')),
    generated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    converted_po_id UUID,
    note TEXT,
    UNIQUE(company_id, pr_number)
);

CREATE TABLE IF NOT EXISTS public.purchase_requisition_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pr_id UUID NOT NULL REFERENCES public.purchase_requisitions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    current_stock NUMERIC DEFAULT 0,
    reorder_point NUMERIC DEFAULT 0,
    suggested_qty NUMERIC NOT NULL,
    preferred_supplier_id UUID REFERENCES public.suppliers(id),
    note TEXT
);

-- Purchase Orders (PO)
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    po_number TEXT NOT NULL,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PARTIAL', 'FULL', 'CLOSED'
    )),
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_date DATE,
    currency TEXT DEFAULT 'IDR',
    exchange_rate NUMERIC DEFAULT 1.0,
    subtotal NUMERIC DEFAULT 0,
    tax NUMERIC DEFAULT 0,
    total NUMERIC DEFAULT 0,
    created_by TEXT NOT NULL,
    approved_by TEXT,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, po_number)
);

CREATE TABLE IF NOT EXISTS public.purchase_order_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    qty_ordered NUMERIC NOT NULL,
    qty_received NUMERIC DEFAULT 0,
    unit_price NUMERIC NOT NULL,
    discount NUMERIC DEFAULT 0,
    line_total NUMERIC NOT NULL,
    note TEXT
);

-- Goods Receipts (GRN) Inbound
CREATE TABLE IF NOT EXISTS public.goods_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    gr_number TEXT NOT NULL,
    po_id UUID REFERENCES public.purchase_orders(id),
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'QC_PENDING', 'QC_PASSED', 'QC_FAILED', 'POSTED', 'CLOSED'
    )),
    received_by TEXT NOT NULL,
    received_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    supplier_do_number TEXT,
    qc_status TEXT DEFAULT 'PENDING',
    note TEXT,
    attachment_url TEXT,
    UNIQUE(company_id, gr_number)
);

CREATE TABLE IF NOT EXISTS public.goods_receipt_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gr_id UUID NOT NULL REFERENCES public.goods_receipts(id) ON DELETE CASCADE,
    po_line_id UUID REFERENCES public.purchase_order_lines(id),
    product_id UUID NOT NULL REFERENCES public.products(id),
    qty_received NUMERIC NOT NULL,
    qty_rejected NUMERIC DEFAULT 0,
    qty_good NUMERIC NOT NULL,
    bin_id UUID REFERENCES public.bins(id), -- Awalnya masuk ke zona QUARANTINE
    batch_no TEXT,
    serial_no TEXT,
    imei TEXT,
    condition TEXT DEFAULT 'good',
    unit_cost NUMERIC DEFAULT 0,
    note TEXT
);

-- Quality Control (QC Inspection)
CREATE TABLE IF NOT EXISTS public.qc_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    inspection_number TEXT NOT NULL,
    gr_id UUID NOT NULL REFERENCES public.goods_receipts(id),
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
    inspector TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'PASSED', 'FAILED', 'CLOSED')),
    inspected_at TIMESTAMPTZ,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, inspection_number)
);

CREATE TABLE IF NOT EXISTS public.qc_inspection_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    qc_id UUID NOT NULL REFERENCES public.qc_inspections(id) ON DELETE CASCADE,
    gr_line_id UUID REFERENCES public.goods_receipt_lines(id),
    product_id UUID NOT NULL REFERENCES public.products(id),
    serial_no TEXT,
    qty_inspected NUMERIC NOT NULL,
    qty_pass NUMERIC DEFAULT 0,
    qty_fail NUMERIC DEFAULT 0,
    defect_type TEXT,
    action TEXT DEFAULT 'ACCEPT' CHECK (action IN ('ACCEPT', 'REJECT', 'RETURN_VENDOR', 'REWORK')),
    note TEXT
);

-- Vendor Price Lists & History
CREATE TABLE IF NOT EXISTS public.vendor_price_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    currency TEXT DEFAULT 'IDR',
    unit_price NUMERIC NOT NULL,
    moq NUMERIC DEFAULT 1,
    lead_time_days INTEGER DEFAULT 7,
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_to DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, supplier_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.vendor_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
    product_id UUID NOT NULL REFERENCES public.products(id),
    old_price NUMERIC,
    new_price NUMERIC NOT NULL,
    currency TEXT DEFAULT 'IDR',
    changed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    source TEXT DEFAULT 'manual',
    note TEXT
);

-- ------------------------------------------------------------------------------
-- 6. RMA & DEFECTIVE GOODS MANAGEMENT
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.rma_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    rma_number TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('CUSTOMER_RETURN', 'VENDOR_RETURN')),
    client_id UUID REFERENCES public.clients(id),
    supplier_id UUID REFERENCES public.suppliers(id),
    serial_id UUID REFERENCES public.serial_numbers(id),
    product_id UUID NOT NULL REFERENCES public.products(id),
    qty NUMERIC NOT NULL DEFAULT 1,
    reason TEXT NOT NULL CHECK (reason IN ('defective', 'wrong_item', 'warranty', 'not_as_spec')),
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN (
        'OPEN', 'INSPECTING', 'DISPOSITIONED', 'RESOLVED', 'CLOSED'
    )),
    opened_by TEXT NOT NULL,
    opened_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved_at TIMESTAMPTZ,
    resolution TEXT CHECK (resolution IN ('replace', 'repair', 'credit_note', 'refund', 'reject')),
    vendor_claim_ref TEXT,
    note TEXT,
    UNIQUE(company_id, rma_number)
);

CREATE TABLE IF NOT EXISTS public.rma_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rma_id UUID NOT NULL REFERENCES public.rma_cases(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    serial_no TEXT,
    qty NUMERIC NOT NULL DEFAULT 1,
    defect_type TEXT,
    disposition TEXT CHECK (disposition IN ('restock', 'scrap', 'repair', 'return_vendor')),
    note TEXT
);

-- ------------------------------------------------------------------------------
-- 7. OUTBOUND / SALES & FULFILLMENT
-- ------------------------------------------------------------------------------

-- Sales Orders
CREATE TABLE IF NOT EXISTS public.sales_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    so_number TEXT NOT NULL,
    client_id UUID NOT NULL REFERENCES public.clients(id),
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'CONFIRMED', 'ALLOCATED', 'PICKING', 'PACKING', 'READY', 'SHIPPED', 'DELIVERED', 'CLOSED'
    )),
    order_date DATE DEFAULT CURRENT_DATE NOT NULL,
    requested_date DATE,
    priority TEXT DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
    currency TEXT DEFAULT 'IDR',
    subtotal NUMERIC DEFAULT 0,
    tax NUMERIC DEFAULT 0,
    total NUMERIC DEFAULT 0,
    created_by TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, so_number)
);

CREATE TABLE IF NOT EXISTS public.sales_order_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    so_id UUID NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    qty_ordered NUMERIC NOT NULL,
    qty_allocated NUMERIC DEFAULT 0,
    qty_picked NUMERIC DEFAULT 0,
    qty_shipped NUMERIC DEFAULT 0,
    unit_price NUMERIC NOT NULL,
    discount NUMERIC DEFAULT 0,
    line_total NUMERIC NOT NULL,
    note TEXT
);

-- Picking Engine (Single & Wave Picking)
CREATE TABLE IF NOT EXISTS public.pick_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    pick_number TEXT NOT NULL,
    so_id UUID REFERENCES public.sales_orders(id),
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
    type TEXT DEFAULT 'single' CHECK (type IN ('single', 'wave')),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    assigned_to TEXT,
    priority TEXT DEFAULT 'Medium',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, pick_number)
);

CREATE TABLE IF NOT EXISTS public.pick_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pick_task_id UUID NOT NULL REFERENCES public.pick_tasks(id) ON DELETE CASCADE,
    so_line_id UUID REFERENCES public.sales_order_lines(id),
    product_id UUID NOT NULL REFERENCES public.products(id),
    from_bin_id UUID REFERENCES public.bins(id),
    qty_requested NUMERIC NOT NULL,
    qty_picked NUMERIC DEFAULT 0,
    qty_short NUMERIC DEFAULT 0,
    serial_no TEXT,
    status TEXT DEFAULT 'PENDING',
    picked_by TEXT,
    picked_at TIMESTAMPTZ
);

-- Packing Station
CREATE TABLE IF NOT EXISTS public.pack_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    pack_number TEXT NOT NULL,
    pick_task_id UUID REFERENCES public.pick_tasks(id),
    so_id UUID REFERENCES public.sales_orders(id),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PACKING', 'COMPLETED')),
    packed_by TEXT,
    packed_at TIMESTAMPTZ,
    box_count INTEGER DEFAULT 1,
    total_weight NUMERIC DEFAULT 0,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, pack_number)
);

CREATE TABLE IF NOT EXISTS public.pack_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pack_task_id UUID NOT NULL REFERENCES public.pack_tasks(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    qty NUMERIC NOT NULL,
    box_no INTEGER DEFAULT 1,
    serial_no TEXT,
    note TEXT
);

-- Surat Jalan / Delivery Notes (Pemicu Resmi Movement GI)
CREATE TABLE IF NOT EXISTS public.delivery_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    sj_number TEXT NOT NULL,
    so_id UUID NOT NULL REFERENCES public.sales_orders(id),
    client_id UUID NOT NULL REFERENCES public.clients(id),
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SHIPPED', 'DELIVERED', 'CLOSED')),
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

CREATE TABLE IF NOT EXISTS public.delivery_note_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sj_id UUID NOT NULL REFERENCES public.delivery_notes(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    qty NUMERIC NOT NULL,
    serial_no TEXT,
    note TEXT
);

-- ------------------------------------------------------------------------------
-- 8. FINANCE & COSTING: Invoices, AP Bills, Payments, COGS & Warranty
-- ------------------------------------------------------------------------------

-- Master Valuta Asing
CREATE TABLE IF NOT EXISTS public.currencies (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    symbol TEXT,
    is_base BOOLEAN DEFAULT false
);

INSERT INTO public.currencies (code, name, symbol, is_base) 
VALUES ('IDR', 'Indonesian Rupiah', 'Rp', true),
       ('USD', 'US Dollar', '$', false)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_currency TEXT NOT NULL REFERENCES public.currencies(code),
    to_currency TEXT NOT NULL REFERENCES public.currencies(code),
    rate NUMERIC NOT NULL,
    effective_date DATE DEFAULT CURRENT_DATE,
    source TEXT DEFAULT 'Bank Indonesia',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Faktur Penjualan (AR Invoices)
CREATE TABLE IF NOT EXISTS public.sales_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    so_id UUID REFERENCES public.sales_orders(id),
    sj_id UUID REFERENCES public.delivery_notes(id),
    client_id UUID NOT NULL REFERENCES public.clients(id),
    currency TEXT DEFAULT 'IDR',
    exchange_rate NUMERIC DEFAULT 1.0,
    amount NUMERIC NOT NULL,
    tax NUMERIC DEFAULT 0,
    total NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partial', 'paid', 'overdue', 'void')),
    issued_date DATE DEFAULT CURRENT_DATE NOT NULL,
    due_date DATE,
    paid_amount NUMERIC DEFAULT 0,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, invoice_number)
);

-- Tagihan Utang Dagang (AP Bills)
CREATE TABLE IF NOT EXISTS public.ap_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    bill_number TEXT NOT NULL,
    po_id UUID REFERENCES public.purchase_orders(id),
    gr_id UUID REFERENCES public.goods_receipts(id),
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
    currency TEXT DEFAULT 'IDR',
    exchange_rate NUMERIC DEFAULT 1.0,
    amount NUMERIC NOT NULL,
    tax NUMERIC DEFAULT 0,
    total NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partial', 'paid', 'overdue', 'void')),
    issued_date DATE DEFAULT CURRENT_DATE NOT NULL,
    due_date DATE,
    paid_amount NUMERIC DEFAULT 0,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, bill_number)
);

-- Pembayaran (Payments - AR & AP)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    payment_number TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('AR', 'AP')),
    ref_invoice_id UUID REFERENCES public.sales_invoices(id),
    ref_bill_id UUID REFERENCES public.ap_bills(id),
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'IDR',
    exchange_rate NUMERIC DEFAULT 1.0,
    method TEXT DEFAULT 'transfer' CHECK (method IN ('transfer', 'cash', 'giro')),
    paid_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    proof_url TEXT,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, payment_number)
);

-- COGS Records (HPP Per Unit Akurat)
CREATE TABLE IF NOT EXISTS public.cogs_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    serial_id UUID REFERENCES public.serial_numbers(id),
    so_id UUID REFERENCES public.sales_orders(id),
    sj_id UUID REFERENCES public.delivery_notes(id),
    method TEXT NOT NULL CHECK (method IN ('FIFO', 'AVERAGE', 'SPECIFIC', 'BOM_ROLLUP')),
    material_cost NUMERIC DEFAULT 0,
    labor_cost NUMERIC DEFAULT 0,
    overhead_cost NUMERIC DEFAULT 0,
    total_cost NUMERIC NOT NULL,
    computed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Biaya Garansi & Servis (Service Tickets)
CREATE TABLE IF NOT EXISTS public.service_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    ticket_number TEXT NOT NULL,
    serial_id UUID REFERENCES public.serial_numbers(id),
    product_id UUID NOT NULL REFERENCES public.products(id),
    client_id UUID REFERENCES public.clients(id),
    issue TEXT NOT NULL,
    diagnosis TEXT,
    action TEXT CHECK (action IN ('repair', 'replace', 'refund')),
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'DIAGNOSED', 'IN_REPAIR', 'RESOLVED', 'CLOSED')),
    is_warranty_claim BOOLEAN DEFAULT true,
    vendor_claim_ref TEXT,
    labor_cost NUMERIC DEFAULT 0,
    part_cost NUMERIC DEFAULT 0,
    total_cost NUMERIC DEFAULT 0,
    opened_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved_at TIMESTAMPTZ,
    created_by TEXT NOT NULL,
    UNIQUE(company_id, ticket_number)
);

CREATE TABLE IF NOT EXISTS public.service_ticket_parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.service_tickets(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    qty NUMERIC NOT NULL DEFAULT 1,
    unit_cost NUMERIC DEFAULT 0,
    from_bin_id UUID REFERENCES public.bins(id),
    note TEXT
);

-- Tagihan 3PL / Logistik (LSP Billings)
CREATE TABLE IF NOT EXISTS public.lsp_billings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    billing_number TEXT NOT NULL,
    provider_name TEXT NOT NULL,
    period_start DATE,
    period_end DATE,
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'IDR',
    status TEXT DEFAULT 'pending',
    attachment_url TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, billing_number)
);

-- ------------------------------------------------------------------------------
-- 9. MANAGERIAL & WORKER PERFORMANCE
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.worker_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    worker_id TEXT NOT NULL,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('pick', 'pack', 'return', 'receive', 'assembly', 'qc')),
    ref_doc_type TEXT,
    ref_doc_id UUID,
    ref_doc_number TEXT,
    lines_count INTEGER DEFAULT 0,
    units_count INTEGER DEFAULT 0,
    duration_seconds INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_operational ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.serial_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bom_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assembly_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assembly_order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfer_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_adjustment_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_opname_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_opname_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_requisition_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goods_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goods_receipt_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qc_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qc_inspection_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rma_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rma_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pick_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pick_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pack_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pack_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_note_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ap_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cogs_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_ticket_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lsp_billings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_activities ENABLE ROW LEVEL SECURITY;

-- Development policy: izinkan akses penuh selama tahap integrasi & pengujian
DO $$ 
DECLARE
    t text;
    tbls text[] := ARRAY[
        'companies', 'company_users', 'warehouses', 'warehouse_zones', 'bins', 'brands',
        'products', 'product_operational', 'suppliers', 'clients', 'serial_numbers',
        'stock_movements', 'boms', 'bom_lines', 'assembly_orders', 'assembly_order_lines',
        'stock_transfers', 'stock_transfer_lines', 'stock_adjustments', 'stock_adjustment_lines',
        'stock_opname_sessions', 'stock_opname_lines', 'assets', 'purchase_orders',
        'purchase_order_lines', 'purchase_requisitions', 'purchase_requisition_lines',
        'goods_receipts', 'goods_receipt_lines', 'qc_inspections', 'qc_inspection_lines',
        'vendor_price_lists', 'vendor_price_history', 'rma_cases', 'rma_lines',
        'sales_orders', 'sales_order_lines', 'pick_tasks', 'pick_lines', 'pack_tasks',
        'pack_lines', 'delivery_notes', 'delivery_note_lines', 'sales_invoices',
        'ap_bills', 'payments', 'cogs_records', 'service_tickets', 'service_ticket_parts',
        'lsp_billings', 'worker_activities'
    ];
BEGIN
    FOREACH t IN ARRAY tbls LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Dev full access on %I" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "Dev full access on %I" ON public.%I FOR ALL USING (true) WITH CHECK (true)', t, t);
    END LOOP;
END $$;
