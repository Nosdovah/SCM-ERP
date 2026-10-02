-- ==============================================================================
-- MOAI ERP v2.0 - Comprehensive Seed Script
-- Domain: Distributor & Integrator Komputer (Prebuilt, Barebone, Spare Parts)
-- Populates: Company, Warehouse, Zones, Bins, Brands, Products, BOM, Stock Ledger, Serials
-- ==============================================================================

DO $$
DECLARE
    v_company_id UUID;
    v_wh_jkt UUID;
    v_wh_sby UUID;
    -- Zones
    v_zone_pb UUID;
    v_zone_bb UUID;
    v_zone_sp UUID;
    v_zone_qc UUID;
    v_zone_rma UUID;
    -- Bins
    v_bin_pb1 UUID;
    v_bin_pb2 UUID;
    v_bin_bb1 UUID;
    v_bin_sp_cpu UUID;
    v_bin_sp_mb UUID;
    v_bin_sp_ram UUID;
    v_bin_sp_ssd UUID;
    v_bin_sp_gpu UUID;
    v_bin_sp_psu UUID;
    v_bin_sp_case UUID;
    v_bin_qc UUID;
    v_bin_rma UUID;
    -- Brands
    v_brand_asus UUID;
    v_brand_intel UUID;
    v_brand_amd UUID;
    v_brand_kingston UUID;
    v_brand_samsung UUID;
    v_brand_gigabyte UUID;
    v_brand_corsair UUID;
    v_brand_lenovo UUID;
    v_brand_moai UUID;
    -- Products
    v_prod_pc_gaming UUID;
    v_prod_pc_office UUID;
    v_prod_laptop UUID;
    v_prod_nuc UUID;
    v_prod_cpu_amd UUID;
    v_prod_cpu_intel UUID;
    v_prod_mb_b650 UUID;
    v_prod_mb_b760 UUID;
    v_prod_ram_32gb UUID;
    v_prod_ram_16gb UUID;
    v_prod_ssd_1tb UUID;
    v_prod_ssd_512gb UUID;
    v_prod_gpu_4070 UUID;
    v_prod_psu_750w UUID;
    v_prod_case_atx UUID;
    -- Suppliers & Clients
    v_supp_synnex UUID;
    v_supp_asus UUID;
    v_supp_silicon UUID;
    v_client_telko UUID;
    v_client_dki UUID;
    v_client_jaya UUID;
    -- BOM
    v_bom_gaming UUID;
BEGIN
    -- 1. Create Default Company
    INSERT INTO public.companies (id, code, name, base_currency)
    VALUES ('a0000000-0000-0000-0000-000000000001', 'KOMPAKOM', 'PT Kompakom Integrasi Mandiri', 'IDR')
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_company_id;

    -- 2. Warehouses
    INSERT INTO public.warehouses (company_id, code, name, type, address)
    VALUES 
        (v_company_id, 'WH-JKT-01', 'Gudang Pusat Cikarang (Central)', 'central', 'Kawasan Industri GIIC Cikarang, Blok C-12, Bekasi'),
        (v_company_id, 'WH-SBY-01', 'Gudang Regional Surabaya (Transit)', 'regional', 'Komplek Pergudangan Margomulyo Permai, Surabaya')
    ON CONFLICT (company_id, code) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_wh_jkt;

    SELECT id INTO v_wh_jkt FROM public.warehouses WHERE company_id = v_company_id AND code = 'WH-JKT-01';
    SELECT id INTO v_wh_sby FROM public.warehouses WHERE company_id = v_company_id AND code = 'WH-SBY-01';

    -- 3. Warehouse Zones for Central Warehouse
    INSERT INTO public.warehouse_zones (warehouse_id, code, name, category)
    VALUES
        (v_wh_jkt, 'ZONE-PB', 'Zona Rak Prebuilt & PC Jadi', 'PREBUILT'),
        (v_wh_jkt, 'ZONE-BB', 'Zona Rak Barebone & Server', 'BAREBONE'),
        (v_wh_jkt, 'ZONE-SP', 'Zona Rak Spare Parts & Komponen', 'SPARE_PART'),
        (v_wh_jkt, 'ZONE-QC', 'Area Karantina & Inbound QC', 'QUARANTINE'),
        (v_wh_jkt, 'ZONE-RMA', 'Area Retur Pelanggan & Defective', 'RMA')
    ON CONFLICT (warehouse_id, code) DO UPDATE SET name = EXCLUDED.name;

    SELECT id INTO v_zone_pb FROM public.warehouse_zones WHERE warehouse_id = v_wh_jkt AND code = 'ZONE-PB';
    SELECT id INTO v_zone_bb FROM public.warehouse_zones WHERE warehouse_id = v_wh_jkt AND code = 'ZONE-BB';
    SELECT id INTO v_zone_sp FROM public.warehouse_zones WHERE warehouse_id = v_wh_jkt AND code = 'ZONE-SP';
    SELECT id INTO v_zone_qc FROM public.warehouse_zones WHERE warehouse_id = v_wh_jkt AND code = 'ZONE-QC';
    SELECT id INTO v_zone_rma FROM public.warehouse_zones WHERE warehouse_id = v_wh_jkt AND code = 'ZONE-RMA';

    -- 4. Bins (Physical Hierarchy: zone-rack-shelf-level)
    INSERT INTO public.bins (warehouse_id, zone_id, code, rack, shelf, level, bin_type, capacity)
    VALUES
        (v_wh_jkt, v_zone_pb, 'PB-A-1-01', 'Rack-A', 'Shelf-1', 'Level-01', 'storage', 50),
        (v_wh_jkt, v_zone_pb, 'PB-A-1-02', 'Rack-A', 'Shelf-1', 'Level-02', 'storage', 50),
        (v_wh_jkt, v_zone_bb, 'BB-A-1-01', 'Rack-A', 'Shelf-1', 'Level-01', 'storage', 80),
        (v_wh_jkt, v_zone_sp, 'SP-CPU-A-01', 'Rack-A', 'Shelf-1', 'Level-01', 'storage', 200),
        (v_wh_jkt, v_zone_sp, 'SP-MB-A-01', 'Rack-A', 'Shelf-2', 'Level-01', 'storage', 100),
        (v_wh_jkt, v_zone_sp, 'SP-RAM-B-01', 'Rack-B', 'Shelf-1', 'Level-01', 'storage', 500),
        (v_wh_jkt, v_zone_sp, 'SP-SSD-B-01', 'Rack-B', 'Shelf-2', 'Level-01', 'storage', 400),
        (v_wh_jkt, v_zone_sp, 'SP-GPU-C-01', 'Rack-C', 'Shelf-1', 'Level-01', 'storage', 80),
        (v_wh_jkt, v_zone_sp, 'SP-PSU-C-01', 'Rack-C', 'Shelf-2', 'Level-01', 'storage', 120),
        (v_wh_jkt, v_zone_sp, 'SP-CASE-D-01', 'Rack-D', 'Shelf-1', 'Level-01', 'storage', 60),
        (v_wh_jkt, v_zone_qc, 'QC-IN-01', 'Staging', 'Buffer', 'Floor', 'quarantine', 100),
        (v_wh_jkt, v_zone_rma, 'RMA-HOLD-01', 'Rack-R', 'Shelf-1', 'Level-01', 'return', 50)
    ON CONFLICT (warehouse_id, code) DO NOTHING;

    SELECT id INTO v_bin_pb1 FROM public.bins WHERE warehouse_id = v_wh_jkt AND code = 'PB-A-1-01';
    SELECT id INTO v_bin_pb2 FROM public.bins WHERE warehouse_id = v_wh_jkt AND code = 'PB-A-1-02';
    SELECT id INTO v_bin_bb1 FROM public.bins WHERE warehouse_id = v_wh_jkt AND code = 'BB-A-1-01';
    SELECT id INTO v_bin_sp_cpu FROM public.bins WHERE warehouse_id = v_wh_jkt AND code = 'SP-CPU-A-01';
    SELECT id INTO v_bin_sp_mb FROM public.bins WHERE warehouse_id = v_wh_jkt AND code = 'SP-MB-A-01';
    SELECT id INTO v_bin_sp_ram FROM public.bins WHERE warehouse_id = v_wh_jkt AND code = 'SP-RAM-B-01';
    SELECT id INTO v_bin_sp_ssd FROM public.bins WHERE warehouse_id = v_wh_jkt AND code = 'SP-SSD-B-01';
    SELECT id INTO v_bin_sp_gpu FROM public.bins WHERE warehouse_id = v_wh_jkt AND code = 'SP-GPU-C-01';
    SELECT id INTO v_bin_sp_psu FROM public.bins WHERE warehouse_id = v_wh_jkt AND code = 'SP-PSU-C-01';
    SELECT id INTO v_bin_sp_case FROM public.bins WHERE warehouse_id = v_wh_jkt AND code = 'SP-CASE-D-01';
    SELECT id INTO v_bin_qc FROM public.bins WHERE warehouse_id = v_wh_jkt AND code = 'QC-IN-01';
    SELECT id INTO v_bin_rma FROM public.bins WHERE warehouse_id = v_wh_jkt AND code = 'RMA-HOLD-01';

    -- 5. Brands
    INSERT INTO public.brands (company_id, name, code)
    VALUES
        (v_company_id, 'MOAI Systems', 'MOAI'),
        (v_company_id, 'ASUSTeK Computer', 'ASUS'),
        (v_company_id, 'Intel Corporation', 'INTEL'),
        (v_company_id, 'Advanced Micro Devices', 'AMD'),
        (v_company_id, 'Kingston Technology', 'KINGSTON'),
        (v_company_id, 'Samsung Electronics', 'SAMSUNG'),
        (v_company_id, 'Gigabyte Technology', 'GIGABYTE'),
        (v_company_id, 'Corsair Gaming', 'CORSAIR'),
        (v_company_id, 'Lenovo Group', 'LENOVO')
    ON CONFLICT DO NOTHING;

    SELECT id INTO v_brand_moai FROM public.brands WHERE company_id = v_company_id AND code = 'MOAI' LIMIT 1;
    SELECT id INTO v_brand_asus FROM public.brands WHERE company_id = v_company_id AND code = 'ASUS' LIMIT 1;
    SELECT id INTO v_brand_intel FROM public.brands WHERE company_id = v_company_id AND code = 'INTEL' LIMIT 1;
    SELECT id INTO v_brand_amd FROM public.brands WHERE company_id = v_company_id AND code = 'AMD' LIMIT 1;
    SELECT id INTO v_brand_kingston FROM public.brands WHERE company_id = v_company_id AND code = 'KINGSTON' LIMIT 1;
    SELECT id INTO v_brand_samsung FROM public.brands WHERE company_id = v_company_id AND code = 'SAMSUNG' LIMIT 1;
    SELECT id INTO v_brand_gigabyte FROM public.brands WHERE company_id = v_company_id AND code = 'GIGABYTE' LIMIT 1;
    SELECT id INTO v_brand_corsair FROM public.brands WHERE company_id = v_company_id AND code = 'CORSAIR' LIMIT 1;
    SELECT id INTO v_brand_lenovo FROM public.brands WHERE company_id = v_company_id AND code = 'LENOVO' LIMIT 1;

    -- 6. Products
    -- Prebuilt
    INSERT INTO public.products (company_id, sku, barcode, name, category, item_type, brand_id, uom, is_serial, is_assembly)
    VALUES
        (v_company_id, 'PB-ARES-78X', '899100100001', 'MOAI Ares Elite Gaming PC (Ryzen 7 7800X3D / RTX 4070)', 'Desktop PC', 'PREBUILT', v_brand_moai, 'UNIT', true, true),
        (v_company_id, 'PB-OFFICE-134', '899100100002', 'MOAI Office Pro PC (Core i5-13400 / 16GB / 512GB)', 'Desktop PC', 'PREBUILT', v_brand_moai, 'UNIT', true, true),
        (v_company_id, 'PB-LN-E14G5', '899100100003', 'Lenovo ThinkPad E14 Gen 5 (i7-1355U / 16GB / 512GB)', 'Laptop', 'PREBUILT', v_brand_lenovo, 'UNIT', true, false)
    ON CONFLICT (company_id, sku) DO NOTHING;

    -- Barebone
    INSERT INTO public.products (company_id, sku, barcode, name, category, item_type, brand_id, uom, is_serial, is_assembly)
    VALUES
        (v_company_id, 'BB-NUC13-PRO', '899100200001', 'ASUS NUC 13 Pro Barebone Kit (Intel Core i5-1340P)', 'Mini PC', 'BAREBONE', v_brand_asus, 'UNIT', true, false)
    ON CONFLICT (company_id, sku) DO NOTHING;

    -- Spare Parts
    INSERT INTO public.products (company_id, sku, barcode, name, category, item_type, brand_id, uom, is_serial, is_assembly)
    VALUES
        (v_company_id, 'SP-CPU-7800X3D', '899100300001', 'AMD Ryzen 7 7800X3D Processor Box', 'Processor', 'SPARE_PART', v_brand_amd, 'PCS', true, false),
        (v_company_id, 'SP-CPU-I513400', '899100300002', 'Intel Core i5-13400 Desktop Processor', 'Processor', 'SPARE_PART', v_brand_intel, 'PCS', true, false),
        (v_company_id, 'SP-MB-B650PLUS', '899100300003', 'ASUS TUF GAMING B650-PLUS WIFI Motherboard', 'Motherboard', 'SPARE_PART', v_brand_asus, 'PCS', true, false),
        (v_company_id, 'SP-MB-B760MA', '899100300004', 'MSI PRO B760M-A WIFI DDR5 Motherboard', 'Motherboard', 'SPARE_PART', v_brand_asus, 'PCS', true, false),
        (v_company_id, 'SP-RAM-DDR5-32G', '899100300005', 'Kingston FURY Beast DDR5 32GB (2x16GB) 6000MT/s', 'Memory RAM', 'SPARE_PART', v_brand_kingston, 'KIT', false, false),
        (v_company_id, 'SP-RAM-DDR5-16G', '899100300006', 'Kingston FURY Beast DDR5 16GB (1x16GB) 5600MT/s', 'Memory RAM', 'SPARE_PART', v_brand_kingston, 'PCS', false, false),
        (v_company_id, 'SP-SSD-990P-1T', '899100300007', 'Samsung 990 PRO NVMe M.2 SSD 1TB PCIe 4.0', 'Storage SSD', 'SPARE_PART', v_brand_samsung, 'PCS', false, false),
        (v_company_id, 'SP-SSD-KC3-512', '899100300008', 'Kingston KC3000 NVMe M.2 SSD 512GB PCIe 4.0', 'Storage SSD', 'SPARE_PART', v_brand_kingston, 'PCS', false, false),
        (v_company_id, 'SP-GPU-RTX4070', '899100300009', 'Gigabyte GeForce RTX 4070 WINDFORCE OC 12G', 'VGA Card', 'SPARE_PART', v_brand_gigabyte, 'PCS', true, false),
        (v_company_id, 'SP-PSU-RM750E', '899100300010', 'Corsair RM750e 750W 80+ Gold Fully Modular', 'Power Supply', 'SPARE_PART', v_brand_corsair, 'PCS', false, false),
        (v_company_id, 'SP-CASE-CC560', '899100300011', 'DeepCool CC560 V2 Mid-Tower ATX Case Black', 'Chassis', 'SPARE_PART', v_brand_moai, 'PCS', false, false)
    ON CONFLICT (company_id, sku) DO NOTHING;

    SELECT id INTO v_prod_pc_gaming FROM public.products WHERE company_id = v_company_id AND sku = 'PB-ARES-78X';
    SELECT id INTO v_prod_pc_office FROM public.products WHERE company_id = v_company_id AND sku = 'PB-OFFICE-134';
    SELECT id INTO v_prod_laptop FROM public.products WHERE company_id = v_company_id AND sku = 'PB-LN-E14G5';
    SELECT id INTO v_prod_nuc FROM public.products WHERE company_id = v_company_id AND sku = 'BB-NUC13-PRO';
    SELECT id INTO v_prod_cpu_amd FROM public.products WHERE company_id = v_company_id AND sku = 'SP-CPU-7800X3D';
    SELECT id INTO v_prod_mb_b650 FROM public.products WHERE company_id = v_company_id AND sku = 'SP-MB-B650PLUS';
    SELECT id INTO v_prod_ram_32gb FROM public.products WHERE company_id = v_company_id AND sku = 'SP-RAM-DDR5-32G';
    SELECT id INTO v_prod_ssd_1tb FROM public.products WHERE company_id = v_company_id AND sku = 'SP-SSD-990P-1T';
    SELECT id INTO v_prod_gpu_4070 FROM public.products WHERE company_id = v_company_id AND sku = 'SP-GPU-RTX4070';
    SELECT id INTO v_prod_psu_750w FROM public.products WHERE company_id = v_company_id AND sku = 'SP-PSU-RM750E';
    SELECT id INTO v_prod_case_atx FROM public.products WHERE company_id = v_company_id AND sku = 'SP-CASE-CC560';

    -- 7. Product Operational Rules
    INSERT INTO public.product_operational (product_id, warehouse_id, min_stock, max_stock, reorder_point, reorder_qty, safety_stock, abc_class, is_fast_moving)
    VALUES
        (v_prod_pc_gaming, v_wh_jkt, 5, 30, 8, 10, 5, 'A', true),
        (v_prod_cpu_amd, v_wh_jkt, 10, 100, 15, 20, 10, 'A', true),
        (v_prod_gpu_4070, v_wh_jkt, 8, 50, 12, 15, 8, 'A', true),
        (v_prod_ssd_1tb, v_wh_jkt, 25, 200, 40, 50, 20, 'B', true),
        (v_prod_ram_32gb, v_wh_jkt, 20, 150, 30, 40, 15, 'B', true)
    ON CONFLICT (product_id, warehouse_id) DO NOTHING;

    -- 8. Suppliers
    INSERT INTO public.suppliers (company_id, code, name, contact, phone, email, address, payment_terms, currency, is_principal)
    VALUES
        (v_company_id, 'SUPP-SYNNEX', 'PT Synnex Metrodata Indonesia', 'Budi Santoso', '+62-21-29345800', 'procurement@synnexmetrodata.com', 'APL Tower Lt 20, Jl. Letjen S. Parman, Jakarta', 'NET 30', 'IDR', false),
        (v_company_id, 'SUPP-ASUS-ID', 'PT Asus Technology Indonesia', 'Clarissa Tan', '+62-21-50821000', 'b2b_sales@asus.com', 'South Quarter Tower B Lt 11, Cilandak, Jakarta', 'NET 45', 'IDR', true),
        (v_company_id, 'SUPP-SILICON', 'Silicon Tech Global Trading Ltd', 'David Cheung', '+852-3105-8899', 'orders@silicontech.hk', 'Unit 1205, Silvercord Tower 2, Tsim Sha Tsui, Hong Kong', 'NET 14', 'USD', false)
    ON CONFLICT (company_id, code) DO NOTHING;

    -- 9. Clients
    INSERT INTO public.clients (company_id, code, name, contact, phone, email, billing_address, payment_terms, credit_limit, segment)
    VALUES
        (v_company_id, 'CLI-TELKO', 'PT Telko Solusi Nusantara', 'Rian Hidayat', '+62-21-83749921', 'purchasing@telkosolusi.co.id', 'The Energy Building Lt 18, SCBD, Jakarta Selatan', 'NET 30', 500000000, 'corporate'),
        (v_company_id, 'CLI-DKI', 'Dinas Komunikasi & Informatika Pemprov DKI', 'Ir. Hendro Supriyadi', '+62-21-3822255', 'pengadaan@diskominfo.jakarta.go.id', 'Balai Kota Blok G Lt 3, Jl. Medan Merdeka Selatan, Jakarta', 'NET 45', 1000000000, 'government'),
        (v_company_id, 'CLI-JAYA', 'Toko Jaya Makmur Komputer Mangga Dua', 'Koh William', '+62-21-6124455', 'jayamakmur.m2@gmail.com', 'Mall Mangga Dua Lt 4 No. 42B, Jakarta Pusat', 'COD', 100000000, 'retail')
    ON CONFLICT (company_id, code) DO NOTHING;

    -- 10. Bill of Materials (BOM) for Gaming PC
    INSERT INTO public.boms (company_id, product_id, version, name, labor_cost, overhead_cost, is_active)
    VALUES (v_company_id, v_prod_pc_gaming, 'v1.0', 'Standard Assembly Build - Ares Elite Gaming', 250000, 100000, true)
    ON CONFLICT (company_id, product_id, version) DO NOTHING
    RETURNING id INTO v_bom_gaming;

    SELECT id INTO v_bom_gaming FROM public.boms WHERE company_id = v_company_id AND product_id = v_prod_pc_gaming AND version = 'v1.0';

    IF v_bom_gaming IS NOT NULL THEN
        INSERT INTO public.bom_lines (bom_id, component_product_id, qty, scrap_pct, note)
        VALUES
            (v_bom_gaming, v_prod_cpu_amd, 1, 0, 'CPU Socket AM5'),
            (v_bom_gaming, v_prod_mb_b650, 1, 0, 'Mainboard ATX'),
            (v_bom_gaming, v_prod_ram_32gb, 1, 0, 'Dual-channel kit 2x16GB'),
            (v_bom_gaming, v_prod_ssd_1tb, 1, 0, 'Primary NVMe boot drive'),
            (v_bom_gaming, v_prod_gpu_4070, 1, 0, 'Graphics Card 12GB'),
            (v_bom_gaming, v_prod_psu_750w, 1, 0, 'Modular Power Supply'),
            (v_bom_gaming, v_prod_case_atx, 1, 0, 'Chassis with 4 ARGB fans')
        ON CONFLICT DO NOTHING;
    END IF;

    -- 11. Initial Stock Movements (Immutable Ledger) & Serial Registry
    -- Spare parts initial stock
    INSERT INTO public.stock_movements (company_id, product_id, warehouse_id, bin_id, movement_type, qty, unit_cost, ref_doc_type, ref_doc_number, created_by, note)
    VALUES
        (v_company_id, v_prod_ram_32gb, v_wh_jkt, v_bin_sp_ram, 'OPN_IN', 50, 1650000, 'OPNAME', 'INIT-2026', 'System Admin', 'Saldo awal pembukuan'),
        (v_company_id, v_prod_ssd_1tb, v_wh_jkt, v_bin_sp_ssd, 'OPN_IN', 40, 1850000, 'OPNAME', 'INIT-2026', 'System Admin', 'Saldo awal pembukuan'),
        (v_company_id, v_prod_psu_750w, v_wh_jkt, v_bin_sp_psu, 'OPN_IN', 30, 1750000, 'OPNAME', 'INIT-2026', 'System Admin', 'Saldo awal pembukuan'),
        (v_company_id, v_prod_case_atx, v_wh_jkt, v_bin_sp_case, 'OPN_IN', 25, 750000, 'OPNAME', 'INIT-2026', 'System Admin', 'Saldo awal pembukuan');

    -- Serialized CPUs
    INSERT INTO public.serial_numbers (company_id, product_id, serial_no, status, warehouse_id, bin_id, unit_cost, received_at, vendor_warranty_start, vendor_warranty_end)
    VALUES
        (v_company_id, v_prod_cpu_amd, 'SN-AMD-78X-001', 'IN_STOCK', v_wh_jkt, v_bin_sp_cpu, 5900000, now(), CURRENT_DATE, CURRENT_DATE + INTERVAL '3 years'),
        (v_company_id, v_prod_cpu_amd, 'SN-AMD-78X-002', 'IN_STOCK', v_wh_jkt, v_bin_sp_cpu, 5900000, now(), CURRENT_DATE, CURRENT_DATE + INTERVAL '3 years'),
        (v_company_id, v_prod_cpu_amd, 'SN-AMD-78X-003', 'IN_STOCK', v_wh_jkt, v_bin_sp_cpu, 5900000, now(), CURRENT_DATE, CURRENT_DATE + INTERVAL '3 years'),
        (v_company_id, v_prod_gpu_4070, 'SN-GPU-407-881', 'IN_STOCK', v_wh_jkt, v_bin_sp_gpu, 9800000, now(), CURRENT_DATE, CURRENT_DATE + INTERVAL '2 years'),
        (v_company_id, v_prod_gpu_4070, 'SN-GPU-407-882', 'IN_STOCK', v_wh_jkt, v_bin_sp_gpu, 9800000, now(), CURRENT_DATE, CURRENT_DATE + INTERVAL '2 years'),
        (v_company_id, v_prod_laptop, 'SN-LN-TP-9901', 'IN_STOCK', v_wh_jkt, v_bin_pb1, 14500000, now(), CURRENT_DATE, CURRENT_DATE + INTERVAL '3 years')
    ON CONFLICT (company_id, serial_no) DO NOTHING;

    -- Movements for serialized components
    INSERT INTO public.stock_movements (company_id, product_id, warehouse_id, bin_id, movement_type, qty, unit_cost, serial_no, ref_doc_type, ref_doc_number, created_by, note)
    VALUES
        (v_company_id, v_prod_cpu_amd, v_wh_jkt, v_bin_sp_cpu, 'OPN_IN', 3, 5900000, 'SN-AMD-78X-001..003', 'OPNAME', 'INIT-2026', 'System Admin', 'Stok CPU Serialized'),
        (v_company_id, v_prod_gpu_4070, v_wh_jkt, v_bin_sp_gpu, 'OPN_IN', 2, 9800000, 'SN-GPU-407-881..882', 'OPNAME', 'INIT-2026', 'System Admin', 'Stok GPU Serialized'),
        (v_company_id, v_prod_laptop, v_wh_jkt, v_bin_pb1, 'OPN_IN', 1, 14500000, 'SN-LN-TP-9901', 'OPNAME', 'INIT-2026', 'System Admin', 'Stok Laptop Serialized');

END $$;
