// =============================================================================
// MOAI ERP v2 — Default master-data seed (QA-03 fix)
// =============================================================================
// These datasets are injected into the v2 store the first time the app runs
// against a database that has never been seeded, so Master Data / Inventory /
// SCM modules render real content instead of empty tables.
//
// Mirrors supabase_seed_v2.sql (PT Kompakom Integrasi Mandiri).
// =============================================================================

const COMPANY_ID = 'a0000000-0000-0000-0000-000000000001';
const WH_JKT = 'b0000000-0000-0000-0000-000000000001';
const WH_SBY = 'b0000000-0000-0000-0000-000000000002';

const ZONES = [
  { id: 'c0000000-0000-0000-0000-000000000001', warehouse_id: WH_JKT, code: 'ZONE-PB', name: 'Zona Rak Prebuilt & PC Jadi', category: 'PREBUILT' },
  { id: 'c0000000-0000-0000-0000-000000000002', warehouse_id: WH_JKT, code: 'ZONE-BB', name: 'Zona Rak Barebone & Server', category: 'BAREBONE' },
  { id: 'c0000000-0000-0000-0000-000000000003', warehouse_id: WH_JKT, code: 'ZONE-SP', name: 'Zona Rak Spare Parts & Komponen', category: 'SPARE_PART' },
  { id: 'c0000000-0000-0000-0000-000000000004', warehouse_id: WH_JKT, code: 'ZONE-QC', name: 'Area Karantina & Inbound QC', category: 'QUARANTINE' },
  { id: 'c0000000-0000-0000-0000-000000000005', warehouse_id: WH_JKT, code: 'ZONE-RMA', name: 'Area Retur Pelanggan & Defective', category: 'RMA' }
];

const BINS = [
  { id: 'd0000000-0000-0000-0000-000000000001', warehouse_id: WH_JKT, zone_id: ZONES[0].id, code: 'PB-A-1-01', rack: 'Rack-A', shelf: 'Shelf-1', level: 'Level-01', bin_type: 'storage', capacity: 50 },
  { id: 'd0000000-0000-0000-0000-000000000002', warehouse_id: WH_JKT, zone_id: ZONES[0].id, code: 'PB-A-1-02', rack: 'Rack-A', shelf: 'Shelf-1', level: 'Level-02', bin_type: 'storage', capacity: 50 },
  { id: 'd0000000-0000-0000-0000-000000000003', warehouse_id: WH_JKT, zone_id: ZONES[1].id, code: 'BB-A-1-01', rack: 'Rack-A', shelf: 'Shelf-1', level: 'Level-01', bin_type: 'storage', capacity: 80 },
  { id: 'd0000000-0000-0000-0000-000000000004', warehouse_id: WH_JKT, zone_id: ZONES[2].id, code: 'SP-CPU-A-01', rack: 'Rack-A', shelf: 'Shelf-1', level: 'Level-01', bin_type: 'storage', capacity: 200 },
  { id: 'd0000000-0000-0000-0000-000000000005', warehouse_id: WH_JKT, zone_id: ZONES[2].id, code: 'SP-MB-A-01', rack: 'Rack-A', shelf: 'Shelf-2', level: 'Level-01', bin_type: 'storage', capacity: 100 },
  { id: 'd0000000-0000-0000-0000-000000000006', warehouse_id: WH_JKT, zone_id: ZONES[2].id, code: 'SP-RAM-B-01', rack: 'Rack-B', shelf: 'Shelf-1', level: 'Level-01', bin_type: 'storage', capacity: 500 },
  { id: 'd0000000-0000-0000-0000-000000000007', warehouse_id: WH_JKT, zone_id: ZONES[2].id, code: 'SP-SSD-B-01', rack: 'Rack-B', shelf: 'Shelf-2', level: 'Level-01', bin_type: 'storage', capacity: 400 },
  { id: 'd0000000-0000-0000-0000-000000000008', warehouse_id: WH_JKT, zone_id: ZONES[2].id, code: 'SP-GPU-C-01', rack: 'Rack-C', shelf: 'Shelf-1', level: 'Level-01', bin_type: 'storage', capacity: 80 },
  { id: 'd0000000-0000-0000-0000-000000000009', warehouse_id: WH_JKT, zone_id: ZONES[2].id, code: 'SP-PSU-C-01', rack: 'Rack-C', shelf: 'Shelf-2', level: 'Level-01', bin_type: 'storage', capacity: 120 },
  { id: 'd0000000-0000-0000-0000-00000000000a', warehouse_id: WH_JKT, zone_id: ZONES[2].id, code: 'SP-CASE-D-01', rack: 'Rack-D', shelf: 'Shelf-1', level: 'Level-01', bin_type: 'storage', capacity: 60 },
  { id: 'd0000000-0000-0000-0000-00000000000b', warehouse_id: WH_JKT, zone_id: ZONES[3].id, code: 'QC-IN-01', rack: 'Staging', shelf: 'Buffer', level: 'Floor', bin_type: 'quarantine', capacity: 100 },
  { id: 'd0000000-0000-0000-0000-00000000000c', warehouse_id: WH_JKT, zone_id: ZONES[4].id, code: 'RMA-HOLD-01', rack: 'Rack-R', shelf: 'Shelf-1', level: 'Level-01', bin_type: 'return', capacity: 50 }
];

const BRANDS = [
  { id: 'e0000000-0000-0000-0000-000000000001', name: 'MOAI Systems', code: 'MOAI', description: 'In-house prebuilt & barebone brand' },
  { id: 'e0000000-0000-0000-0000-000000000002', name: 'ASUSTeK Computer', code: 'ASUS', description: 'Motherboard, mini PC, laptop' },
  { id: 'e0000000-0000-0000-0000-000000000003', name: 'Intel Corporation', code: 'INTEL', description: 'Processor & platform' },
  { id: 'e0000000-0000-0000-0000-000000000004', name: 'Advanced Micro Devices', code: 'AMD', description: 'Processor & graphics' },
  { id: 'e0000000-0000-0000-0000-000000000005', name: 'Kingston Technology', code: 'KINGSTON', description: 'Memory & storage' },
  { id: 'e0000000-0000-0000-0000-000000000006', name: 'Samsung Electronics', code: 'SAMSUNG', description: 'Storage & display' },
  { id: 'e0000000-0000-0000-0000-000000000007', name: 'Gigabyte Technology', code: 'GIGABYTE', description: 'VGA card & motherboard' },
  { id: 'e0000000-0000-0000-0000-000000000008', name: 'Corsair Gaming', code: 'CORSAIR', description: 'Power supply & peripherals' },
  { id: 'e0000000-0000-0000-0000-000000000009', name: 'Lenovo Group', code: 'LENOVO', description: 'Laptop & workstation' }
];

const PRODUCTS = [
  { id: 'f0000000-0000-0000-0000-000000000001', sku: 'PB-ARES-78X', barcode: '899100100001', name: 'MOAI Ares Elite Gaming PC (Ryzen 7 7800X3D / RTX 4070)', category: 'Desktop PC', item_type: 'PREBUILT', brand: 'MOAI Systems', uom: 'UNIT', is_serial: true, is_assembly: true, unit_price: 27500000, cost_price: 22000000, stock: 6, bin_code: 'PB-A-1-01' },
  { id: 'f0000000-0000-0000-0000-000000000002', sku: 'PB-OFFICE-134', barcode: '899100100002', name: 'MOAI Office Pro PC (Core i5-13400 / 16GB / 512GB)', category: 'Desktop PC', item_type: 'PREBUILT', brand: 'MOAI Systems', uom: 'UNIT', is_serial: true, is_assembly: true, unit_price: 11500000, cost_price: 9200000, stock: 12, bin_code: 'PB-A-1-02' },
  { id: 'f0000000-0000-0000-0000-000000000003', sku: 'PB-LN-E14G5', barcode: '899100100003', name: 'Lenovo ThinkPad E14 Gen 5 (i7-1355U / 16GB / 512GB)', category: 'Laptop', item_type: 'PREBUILT', brand: 'Lenovo Group', uom: 'UNIT', is_serial: true, is_assembly: false, unit_price: 17500000, cost_price: 14500000, stock: 4, bin_code: 'PB-A-1-01' },
  { id: 'f0000000-0000-0000-0000-000000000004', sku: 'BB-NUC13-PRO', barcode: '899100200001', name: 'ASUS NUC 13 Pro Barebone Kit (Intel Core i5-1340P)', category: 'Mini PC', item_type: 'BAREBONE', brand: 'ASUSTeK Computer', uom: 'UNIT', is_serial: true, is_assembly: false, unit_price: 8500000, cost_price: 6900000, stock: 8, bin_code: 'BB-A-1-01' },
  { id: 'f0000000-0000-0000-0000-000000000005', sku: 'SP-CPU-7800X3D', barcode: '899100300001', name: 'AMD Ryzen 7 7800X3D Processor Box', category: 'Processor', item_type: 'SPARE_PART', brand: 'Advanced Micro Devices', uom: 'PCS', is_serial: true, is_assembly: false, unit_price: 7200000, cost_price: 5900000, stock: 3, bin_code: 'SP-CPU-A-01' },
  { id: 'f0000000-0000-0000-0000-000000000006', sku: 'SP-CPU-I513400', barcode: '899100300002', name: 'Intel Core i5-13400 Desktop Processor', category: 'Processor', item_type: 'SPARE_PART', brand: 'Intel Corporation', uom: 'PCS', is_serial: true, is_assembly: false, unit_price: 3200000, cost_price: 2650000, stock: 14, bin_code: 'SP-CPU-A-01' },
  { id: 'f0000000-0000-0000-0000-000000000007', sku: 'SP-MB-B650PLUS', barcode: '899100300003', name: 'ASUS TUF GAMING B650-PLUS WIFI Motherboard', category: 'Motherboard', item_type: 'SPARE_PART', brand: 'ASUSTeK Computer', uom: 'PCS', is_serial: true, is_assembly: false, unit_price: 3100000, cost_price: 2600000, stock: 9, bin_code: 'SP-MB-A-01' },
  { id: 'f0000000-0000-0000-0000-000000000008', sku: 'SP-MB-B760MA', barcode: '899100300004', name: 'MSI PRO B760M-A WIFI DDR5 Motherboard', category: 'Motherboard', item_type: 'SPARE_PART', brand: 'ASUSTeK Computer', uom: 'PCS', is_serial: true, is_assembly: false, unit_price: 2400000, cost_price: 1950000, stock: 11, bin_code: 'SP-MB-A-01' },
  { id: 'f0000000-0000-0000-0000-000000000009', sku: 'SP-RAM-DDR5-32G', barcode: '899100300005', name: 'Kingston FURY Beast DDR5 32GB (2x16GB) 6000MT/s', category: 'Memory RAM', item_type: 'SPARE_PART', brand: 'Kingston Technology', uom: 'KIT', is_serial: false, is_assembly: false, unit_price: 2100000, cost_price: 1650000, stock: 50, bin_code: 'SP-RAM-B-01' },
  { id: 'f0000000-0000-0000-0000-00000000000a', sku: 'SP-RAM-DDR5-16G', barcode: '899100300006', name: 'Kingston FURY Beast DDR5 16GB (1x16GB) 5600MT/s', category: 'Memory RAM', item_type: 'SPARE_PART', brand: 'Kingston Technology', uom: 'PCS', is_serial: false, is_assembly: false, unit_price: 1150000, cost_price: 880000, stock: 35, bin_code: 'SP-RAM-B-01' },
  { id: 'f0000000-0000-0000-0000-00000000000b', sku: 'SP-SSD-990P-1T', barcode: '899100300007', name: 'Samsung 990 PRO NVMe M.2 SSD 1TB PCIe 4.0', category: 'Storage SSD', item_type: 'SPARE_PART', brand: 'Samsung Electronics', uom: 'PCS', is_serial: false, is_assembly: false, unit_price: 2350000, cost_price: 1850000, stock: 40, bin_code: 'SP-SSD-B-01' },
  { id: 'f0000000-0000-0000-0000-00000000000c', sku: 'SP-SSD-KC3-512', barcode: '899100300008', name: 'Kingston KC3000 NVMe M.2 SSD 512GB PCIe 4.0', category: 'Storage SSD', item_type: 'SPARE_PART', brand: 'Kingston Technology', uom: 'PCS', is_serial: false, is_assembly: false, unit_price: 1150000, cost_price: 870000, stock: 28, bin_code: 'SP-SSD-B-01' },
  { id: 'f0000000-0000-0000-0000-00000000000d', sku: 'SP-GPU-RTX4070', barcode: '899100300009', name: 'Gigabyte GeForce RTX 4070 WINDFORCE OC 12G', category: 'VGA Card', item_type: 'SPARE_PART', brand: 'Gigabyte Technology', uom: 'PCS', is_serial: true, is_assembly: false, unit_price: 11500000, cost_price: 9800000, stock: 2, bin_code: 'SP-GPU-C-01' },
  { id: 'f0000000-0000-0000-0000-00000000000e', sku: 'SP-PSU-RM750E', barcode: '899100300010', name: 'Corsair RM750e 750W 80+ Gold Fully Modular', category: 'Power Supply', item_type: 'SPARE_PART', brand: 'Corsair Gaming', uom: 'PCS', is_serial: false, is_assembly: false, unit_price: 2050000, cost_price: 1750000, stock: 30, bin_code: 'SP-PSU-C-01' },
  { id: 'f0000000-0000-0000-0000-00000000000f', sku: 'SP-CASE-CC560', barcode: '899100300011', name: 'DeepCool CC560 V2 Mid-Tower ATX Case Black', category: 'Chassis', item_type: 'SPARE_PART', brand: 'MOAI Systems', uom: 'PCS', is_serial: false, is_assembly: false, unit_price: 850000, cost_price: 750000, stock: 25, bin_code: 'SP-CASE-D-01' }
];

const PRODUCT_OPERATIONAL = PRODUCTS.map((p, i) => ({
  product_id: p.id,
  sku: p.sku,
  min_stock: [5, 5, 3, 5, 10, 10, 5, 5, 20, 20, 25, 20, 8, 15, 15][i] ?? 5,
  max_stock: [30, 40, 20, 30, 100, 100, 60, 60, 150, 150, 200, 150, 50, 120, 120][i] ?? 50,
  reorder_point: [8, 8, 5, 8, 15, 15, 8, 8, 30, 30, 40, 30, 12, 25, 25][i] ?? 10,
  reorder_qty: [10, 15, 8, 10, 20, 20, 10, 10, 40, 40, 50, 40, 15, 30, 30][i] ?? 20,
  safety_stock: [5, 5, 3, 5, 10, 10, 5, 5, 15, 15, 20, 15, 8, 15, 15][i] ?? 5,
  is_fast_moving: p.item_type === 'SPARE_PART'
}));

const SUPPLIERS = [
  { id: '11000000-0000-0000-0000-000000000001', code: 'SUPP-SYNNEX', name: 'PT Synnex Metrodata Indonesia', category: 'Distributor', country: 'Indonesia', currency: 'IDR', rating: 4.6, contact: 'Budi Santoso', phone: '+62-21-29345800', email: 'procurement@synnexmetrodata.com', address: 'APL Tower Lt 20, Jl. Letjen S. Parman, Jakarta', payment_terms: 'NET 30', lead_time_days: 7, on_time_rate: '96%', defect_rate: '1.2%', is_principal: false },
  { id: '11000000-0000-0000-0000-000000000002', code: 'SUPP-ASUS-ID', name: 'PT Asus Technology Indonesia', category: 'Principal', country: 'Indonesia', currency: 'IDR', rating: 4.8, contact: 'Clarissa Tan', phone: '+62-21-50821000', email: 'b2b_sales@asus.com', address: 'South Quarter Tower B Lt 11, Cilandak, Jakarta', payment_terms: 'NET 45', lead_time_days: 10, on_time_rate: '98%', defect_rate: '0.6%', is_principal: true },
  { id: '11000000-0000-0000-0000-000000000003', code: 'SUPP-SILICON', name: 'Silicon Tech Global Trading Ltd', category: 'Importer', country: 'Hong Kong', currency: 'USD', rating: 4.3, contact: 'David Cheung', phone: '+852-3105-8899', email: 'orders@silicontech.hk', address: 'Unit 1205, Silvercord Tower 2, Tsim Sha Tsui, Hong Kong', payment_terms: 'NET 14', lead_time_days: 21, on_time_rate: '89%', defect_rate: '2.4%', is_principal: false }
];

const CLIENTS = [
  { id: '22000000-0000-0000-0000-000000000001', code: 'CLI-TELKO', name: 'PT Telko Solusi Nusantara', segment: 'corporate', contact: 'Rian Hidayat', phone: '+62-21-83749921', email: 'purchasing@telkosolusi.co.id', billing_address: 'The Energy Building Lt 18, SCBD, Jakarta Selatan', payment_terms: 'NET 30', credit_limit: 500000000, outstanding: 125000000 },
  { id: '22000000-0000-0000-0000-000000000002', code: 'CLI-DKI', name: 'Dinas Komunikasi & Informatika Pemprov DKI', segment: 'government', contact: 'Ir. Hendro Supriyadi', phone: '+62-21-3822255', email: 'pengadaan@diskominfo.jakarta.go.id', billing_address: 'Balai Kota Blok G Lt 3, Jl. Medan Merdeka Selatan, Jakarta', payment_terms: 'NET 45', credit_limit: 1000000000, outstanding: 320000000 },
  { id: '22000000-0000-0000-0000-000000000003', code: 'CLI-JAYA', name: 'Toko Jaya Makmur Komputer Mangga Dua', segment: 'retail', contact: 'Koh William', phone: '+62-21-6124455', email: 'jayamakmur.m2@gmail.com', billing_address: 'Mall Mangga Dua Lt 4 No. 42B, Jakarta Pusat', payment_terms: 'COD', credit_limit: 100000000, outstanding: 0 }
];

const SERIALS = [
  { id: '33000000-0000-0000-0000-000000000001', serial_no: 'SN-AMD-78X-001', sku: 'SP-CPU-7800X3D', product_name: 'AMD Ryzen 7 7800X3D Processor Box', status: 'IN_STOCK', bin_code: 'SP-CPU-A-01', unit_cost: 5900000, vendor_warranty_end: '2029-09-18' },
  { id: '33000000-0000-0000-0000-000000000002', serial_no: 'SN-AMD-78X-002', sku: 'SP-CPU-7800X3D', product_name: 'AMD Ryzen 7 7800X3D Processor Box', status: 'IN_STOCK', bin_code: 'SP-CPU-A-01', unit_cost: 5900000, vendor_warranty_end: '2029-09-18' },
  { id: '33000000-0000-0000-0000-000000000003', serial_no: 'SN-AMD-78X-003', sku: 'SP-CPU-7800X3D', product_name: 'AMD Ryzen 7 7800X3D Processor Box', status: 'ALLOCATED', bin_code: 'SP-CPU-A-01', unit_cost: 5900000, vendor_warranty_end: '2029-09-18' },
  { id: '33000000-0000-0000-0000-000000000004', serial_no: 'SN-GPU-407-881', sku: 'SP-GPU-RTX4070', product_name: 'Gigabyte GeForce RTX 4070 WINDFORCE OC 12G', status: 'IN_STOCK', bin_code: 'SP-GPU-C-01', unit_cost: 9800000, vendor_warranty_end: '2028-09-18' },
  { id: '33000000-0000-0000-0000-000000000005', serial_no: 'SN-GPU-407-882', sku: 'SP-GPU-RTX4070', product_name: 'Gigabyte GeForce RTX 4070 WINDFORCE OC 12G', status: 'IN_STOCK', bin_code: 'SP-GPU-C-01', unit_cost: 9800000, vendor_warranty_end: '2028-09-18' },
  { id: '33000000-0000-0000-0000-000000000006', serial_no: 'SN-LN-TP-9901', sku: 'PB-LN-E14G5', product_name: 'Lenovo ThinkPad E14 Gen 5 (i7-1355U / 16GB / 512GB)', status: 'IN_STOCK', bin_code: 'PB-A-1-01', unit_cost: 14500000, vendor_warranty_end: '2029-09-18' }
];

const MOVEMENTS = [
  { id: '44000000-0000-0000-0000-000000000001', movement_type: 'OPN_IN', sku: 'SP-RAM-DDR5-32G', product_name: 'Kingston FURY Beast DDR5 32GB (2x16GB) 6000MT/s', qty: 50, bin_code: 'SP-RAM-B-01', ref_doc: 'INIT-2026', unit_cost: 1650000, created_at: '2026-09-18 08:00', created_by: 'System Admin' },
  { id: '44000000-0000-0000-0000-000000000002', movement_type: 'OPN_IN', sku: 'SP-SSD-990P-1T', product_name: 'Samsung 990 PRO NVMe M.2 SSD 1TB PCIe 4.0', qty: 40, bin_code: 'SP-SSD-B-01', ref_doc: 'INIT-2026', unit_cost: 1850000, created_at: '2026-09-18 08:01', created_by: 'System Admin' },
  { id: '44000000-0000-0000-0000-000000000003', movement_type: 'OPN_IN', sku: 'SP-PSU-RM750E', product_name: 'Corsair RM750e 750W 80+ Gold Fully Modular', qty: 30, bin_code: 'SP-PSU-C-01', ref_doc: 'INIT-2026', unit_cost: 1750000, created_at: '2026-09-18 08:02', created_by: 'System Admin' },
  { id: '44000000-0000-0000-0000-000000000004', movement_type: 'OPN_IN', sku: 'SP-CASE-CC560', product_name: 'DeepCool CC560 V2 Mid-Tower ATX Case Black', qty: 25, bin_code: 'SP-CASE-D-01', ref_doc: 'INIT-2026', unit_cost: 750000, created_at: '2026-09-18 08:03', created_by: 'System Admin' },
  { id: '44000000-0000-0000-0000-000000000005', movement_type: 'OPN_IN', sku: 'SP-CPU-7800X3D', product_name: 'AMD Ryzen 7 7800X3D Processor Box', qty: 3, bin_code: 'SP-CPU-A-01', ref_doc: 'INIT-2026', unit_cost: 5900000, created_at: '2026-09-18 08:04', created_by: 'System Admin' },
  { id: '44000000-0000-0000-0000-000000000006', movement_type: 'OPN_IN', sku: 'SP-GPU-RTX4070', product_name: 'Gigabyte GeForce RTX 4070 WINDFORCE OC 12G', qty: 2, bin_code: 'SP-GPU-C-01', ref_doc: 'INIT-2026', unit_cost: 9800000, created_at: '2026-09-18 08:05', created_by: 'System Admin' },
  { id: '44000000-0000-0000-0000-000000000007', movement_type: 'OPN_IN', sku: 'PB-LN-E14G5', product_name: 'Lenovo ThinkPad E14 Gen 5 (i7-1355U / 16GB / 512GB)', qty: 1, bin_code: 'PB-A-1-01', ref_doc: 'INIT-2026', unit_cost: 14500000, created_at: '2026-09-18 08:06', created_by: 'System Admin' }
];

const BOM = {
  target_product_id: PRODUCTS[0].id,
  target_sku: PRODUCTS[0].sku,
  name: 'Standard Assembly Build - Ares Elite Gaming',
  version: 'v1.0',
  labor_cost: 250000,
  overhead_cost: 100000,
  components: [
    { component_sku: 'SP-CPU-7800X3D', component_name: 'AMD Ryzen 7 7800X3D Processor Box', qty: 1, scrap_pct: 0 },
    { component_sku: 'SP-MB-B650PLUS', component_name: 'ASUS TUF GAMING B650-PLUS WIFI Motherboard', qty: 1, scrap_pct: 0 },
    { component_sku: 'SP-RAM-DDR5-32G', component_name: 'Kingston FURY Beast DDR5 32GB (2x16GB) 6000MT/s', qty: 1, scrap_pct: 0 },
    { component_sku: 'SP-SSD-990P-1T', component_name: 'Samsung 990 PRO NVMe M.2 SSD 1TB PCIe 4.0', qty: 1, scrap_pct: 0 },
    { component_sku: 'SP-GPU-RTX4070', component_name: 'Gigabyte GeForce RTX 4070 WINDFORCE OC 12G', qty: 1, scrap_pct: 0 },
    { component_sku: 'SP-PSU-RM750E', component_name: 'Corsair RM750e 750W 80+ Gold Fully Modular', qty: 1, scrap_pct: 0 },
    { component_sku: 'SP-CASE-CC560', component_name: 'DeepCool CC560 V2 Mid-Tower ATX Case Black', qty: 1, scrap_pct: 0 }
  ]
};

const COMPANIES = [
  { id: COMPANY_ID, code: 'KOMPAKOM', name: 'PT Kompakom Integrasi Mandiri', base_currency: 'IDR' }
];

const WAREHOUSES = [
  { id: WH_JKT, company_id: COMPANY_ID, code: 'WH-JKT-01', name: 'Gudang Pusat Cikarang (Central)', type: 'central', address: 'Kawasan Industri GIIC Cikarang, Blok C-12, Bekasi' },
  { id: WH_SBY, company_id: COMPANY_ID, code: 'WH-SBY-01', name: 'Gudang Regional Surabaya (Transit)', type: 'regional', address: 'Komplek Pergudangan Margomulyo Permai, Surabaya' }
];

export function defaultSeed() {
  return {
    companies: COMPANIES,
    warehouses: WAREHOUSES,
    zones: ZONES,
    bins: BINS,
    brands: BRANDS,
    products: PRODUCTS,
    product_operational: PRODUCT_OPERATIONAL,
    suppliers: SUPPLIERS,
    clients: CLIENTS,
    serials: SERIALS,
    movements: MOVEMENTS,
    bom: BOM
  };
}
