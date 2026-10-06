// ==============================================================================
// MOAI ERP v2.0 - Domain Initial Master Data & Mock Fallback Store
// Domain: Distributor & Integrator Komputer (Prebuilt, Barebone, Spare Parts)
// ==============================================================================

export const initialWarehouses = [
  {
    id: 'wh-01',
    code: 'WH-JKT-01',
    name: 'Gudang Pusat Cikarang (Central)',
    type: 'central',
    address: 'Kawasan Industri GIIC Cikarang Blok C-12, Bekasi',
    is_active: true
  },
  {
    id: 'wh-02',
    code: 'WH-SBY-01',
    name: 'Gudang Regional Surabaya (Transit)',
    type: 'regional',
    address: 'Komplek Pergudangan Margomulyo Permai, Surabaya',
    is_active: true
  }
];

export const initialZones = [
  { id: 'zone-pb', warehouse_id: 'wh-01', code: 'ZONE-PB', name: 'Zona Rak Prebuilt & PC Jadi', category: 'PREBUILT', is_active: true },
  { id: 'zone-bb', warehouse_id: 'wh-01', code: 'ZONE-BB', name: 'Zona Rak Barebone & Server', category: 'BAREBONE', is_active: true },
  { id: 'zone-sp', warehouse_id: 'wh-01', code: 'ZONE-SP', name: 'Zona Rak Spare Parts & Komponen', category: 'SPARE_PART', is_active: true },
  { id: 'zone-qc', warehouse_id: 'wh-01', code: 'ZONE-QC', name: 'Area Karantina & Inbound QC', category: 'QUARANTINE', is_active: true },
  { id: 'zone-rma', warehouse_id: 'wh-01', code: 'ZONE-RMA', name: 'Area Retur Pelanggan & Defective', category: 'RMA', is_active: true }
];

export const initialBins = [
  { id: 'bin-pb1', warehouse_id: 'wh-01', zone_id: 'zone-pb', code: 'PB-A-1-01', rack: 'Rack-A', shelf: 'Shelf-1', level: '01', bin_type: 'storage', capacity: 50 },
  { id: 'bin-pb2', warehouse_id: 'wh-01', zone_id: 'zone-pb', code: 'PB-A-1-02', rack: 'Rack-A', shelf: 'Shelf-1', level: '02', bin_type: 'storage', capacity: 50 },
  { id: 'bin-bb1', warehouse_id: 'wh-01', zone_id: 'zone-bb', code: 'BB-A-1-01', rack: 'Rack-A', shelf: 'Shelf-1', level: '01', bin_type: 'storage', capacity: 80 },
  { id: 'bin-sp-cpu', warehouse_id: 'wh-01', zone_id: 'zone-sp', code: 'SP-CPU-A-01', rack: 'Rack-A', shelf: 'Shelf-1', level: '01', bin_type: 'storage', capacity: 200 },
  { id: 'bin-sp-mb', warehouse_id: 'wh-01', zone_id: 'zone-sp', code: 'SP-MB-A-01', rack: 'Rack-A', shelf: 'Shelf-2', level: '01', bin_type: 'storage', capacity: 100 },
  { id: 'bin-sp-ram', warehouse_id: 'wh-01', zone_id: 'zone-sp', code: 'SP-RAM-B-01', rack: 'Rack-B', shelf: 'Shelf-1', level: '01', bin_type: 'storage', capacity: 500 },
  { id: 'bin-sp-ssd', warehouse_id: 'wh-01', zone_id: 'zone-sp', code: 'SP-SSD-B-01', rack: 'Rack-B', shelf: 'Shelf-2', level: '01', bin_type: 'storage', capacity: 400 },
  { id: 'bin-sp-gpu', warehouse_id: 'wh-01', zone_id: 'zone-sp', code: 'SP-GPU-C-01', rack: 'Rack-C', shelf: 'Shelf-1', level: '01', bin_type: 'storage', capacity: 80 },
  { id: 'bin-sp-psu', warehouse_id: 'wh-01', zone_id: 'zone-sp', code: 'SP-PSU-C-01', rack: 'Rack-C', shelf: 'Shelf-2', level: '01', bin_type: 'storage', capacity: 120 },
  { id: 'bin-sp-case', warehouse_id: 'wh-01', zone_id: 'zone-sp', code: 'SP-CASE-D-01', rack: 'Rack-D', shelf: 'Shelf-1', level: '01', bin_type: 'storage', capacity: 60 },
  { id: 'bin-qc', warehouse_id: 'wh-01', zone_id: 'zone-qc', code: 'QC-IN-01', rack: 'Staging', shelf: 'Buffer', level: 'Floor', bin_type: 'quarantine', capacity: 100 },
  { id: 'bin-rma', warehouse_id: 'wh-01', zone_id: 'zone-rma', code: 'RMA-HOLD-01', rack: 'Rack-R', shelf: 'Shelf-1', level: '01', bin_type: 'return', capacity: 50 }
];

export const initialBrands = [
  { id: 'b-moai', name: 'MOAI Systems', code: 'MOAI', description: 'In-house Integrator PC Brand' },
  { id: 'b-asus', name: 'ASUS', code: 'ASUS', description: 'Motherboard, GPU & Mini PC' },
  { id: 'b-intel', name: 'Intel Corporation', code: 'INTEL', description: 'Processors & Platform' },
  { id: 'b-amd', name: 'AMD', code: 'AMD', description: 'Ryzen Processors & Radeon' },
  { id: 'b-kingston', name: 'Kingston', code: 'KINGSTON', description: 'RAM & SSD Storage' },
  { id: 'b-samsung', name: 'Samsung', code: 'SAMSUNG', description: 'High Performance NVMe SSD' },
  { id: 'b-gigabyte', name: 'Gigabyte', code: 'GIGABYTE', description: 'GeForce GPUs & Motherboards' },
  { id: 'b-corsair', name: 'Corsair', code: 'CORSAIR', description: 'Power Supply & Gaming Peripherals' },
  { id: 'b-lenovo', name: 'Lenovo', code: 'LENOVO', description: 'Laptops & Workstations' }
];

export const initialProducts = [
  // Prebuilt
  {
    id: 'prod-pc-01',
    sku: 'PB-ARES-78X',
    barcode: '899100100001',
    name: 'MOAI Ares Elite Gaming PC (Ryzen 7 7800X3D / RTX 4070)',
    category: 'Desktop PC',
    item_type: 'PREBUILT',
    brand: 'MOAI Systems',
    uom: 'UNIT',
    is_serial: true,
    is_assembly: true,
    unit_price: 29500000,
    cost_price: 25450000,
    stock: 4,
    bin_code: 'PB-A-1-01'
  },
  {
    id: 'prod-pc-02',
    sku: 'PB-OFFICE-134',
    barcode: '899100100002',
    name: 'MOAI Office Pro PC (Core i5-13400 / 16GB / 512GB)',
    category: 'Desktop PC',
    item_type: 'PREBUILT',
    brand: 'MOAI Systems',
    uom: 'UNIT',
    is_serial: true,
    is_assembly: true,
    unit_price: 9800000,
    cost_price: 7850000,
    stock: 8,
    bin_code: 'PB-A-1-02'
  },
  {
    id: 'prod-lt-01',
    sku: 'PB-LN-E14G5',
    barcode: '899100100003',
    name: 'Lenovo ThinkPad E14 Gen 5 (i7-1355U / 16GB / 512GB)',
    category: 'Laptop',
    item_type: 'PREBUILT',
    brand: 'Lenovo',
    uom: 'UNIT',
    is_serial: true,
    is_assembly: false,
    unit_price: 16800000,
    cost_price: 14500000,
    stock: 5,
    bin_code: 'PB-A-1-01'
  },
  // Barebone
  {
    id: 'prod-bb-01',
    sku: 'BB-NUC13-PRO',
    barcode: '899100200001',
    name: 'ASUS NUC 13 Pro Barebone Kit (Intel Core i5-1340P)',
    category: 'Mini PC',
    item_type: 'BAREBONE',
    brand: 'ASUS',
    uom: 'UNIT',
    is_serial: true,
    is_assembly: false,
    unit_price: 7500000,
    cost_price: 6200000,
    stock: 12,
    bin_code: 'BB-A-1-01'
  },
  // Spare Parts
  {
    id: 'prod-sp-cpu01',
    sku: 'SP-CPU-7800X3D',
    barcode: '899100300001',
    name: 'AMD Ryzen 7 7800X3D Processor Box',
    category: 'Processor',
    item_type: 'SPARE_PART',
    brand: 'AMD',
    uom: 'PCS',
    is_serial: true,
    is_assembly: false,
    unit_price: 6750000,
    cost_price: 5900000,
    stock: 15,
    bin_code: 'SP-CPU-A-01'
  },
  {
    id: 'prod-sp-cpu02',
    sku: 'SP-CPU-I513400',
    barcode: '899100300002',
    name: 'Intel Core i5-13400 Desktop Processor',
    category: 'Processor',
    item_type: 'SPARE_PART',
    brand: 'Intel',
    uom: 'PCS',
    is_serial: true,
    is_assembly: false,
    unit_price: 3650000,
    cost_price: 3100000,
    stock: 22,
    bin_code: 'SP-CPU-A-01'
  },
  {
    id: 'prod-sp-mb01',
    sku: 'SP-MB-B650PLUS',
    barcode: '899100300003',
    name: 'ASUS TUF GAMING B650-PLUS WIFI Motherboard',
    category: 'Motherboard',
    item_type: 'SPARE_PART',
    brand: 'ASUS',
    uom: 'PCS',
    is_serial: true,
    is_assembly: false,
    unit_price: 3950000,
    cost_price: 3400000,
    stock: 18,
    bin_code: 'SP-MB-A-01'
  },
  {
    id: 'prod-sp-ram01',
    sku: 'SP-RAM-DDR5-32G',
    barcode: '899100300005',
    name: 'Kingston FURY Beast DDR5 32GB (2x16GB) 6000MT/s',
    category: 'Memory RAM',
    item_type: 'SPARE_PART',
    brand: 'Kingston',
    uom: 'KIT',
    is_serial: false,
    is_assembly: false,
    unit_price: 1950000,
    cost_price: 1650000,
    stock: 50,
    bin_code: 'SP-RAM-B-01'
  },
  {
    id: 'prod-sp-ssd01',
    sku: 'SP-SSD-990P-1T',
    barcode: '899100300007',
    name: 'Samsung 990 PRO NVMe M.2 SSD 1TB PCIe 4.0',
    category: 'Storage SSD',
    item_type: 'SPARE_PART',
    brand: 'Samsung',
    uom: 'PCS',
    is_serial: false,
    is_assembly: false,
    unit_price: 2200000,
    cost_price: 1850000,
    stock: 40,
    bin_code: 'SP-SSD-B-01'
  },
  {
    id: 'prod-sp-gpu01',
    sku: 'SP-GPU-RTX4070',
    barcode: '899100300009',
    name: 'Gigabyte GeForce RTX 4070 WINDFORCE OC 12G',
    category: 'VGA Card',
    item_type: 'SPARE_PART',
    brand: 'Gigabyte',
    uom: 'PCS',
    is_serial: true,
    is_assembly: false,
    unit_price: 11400000,
    cost_price: 9800000,
    stock: 11,
    bin_code: 'SP-GPU-C-01'
  },
  {
    id: 'prod-sp-psu01',
    sku: 'SP-PSU-RM750E',
    barcode: '899100300010',
    name: 'Corsair RM750e 750W 80+ Gold Fully Modular',
    category: 'Power Supply',
    item_type: 'SPARE_PART',
    brand: 'Corsair',
    uom: 'PCS',
    is_serial: false,
    is_assembly: false,
    unit_price: 2050000,
    cost_price: 1750000,
    stock: 30,
    bin_code: 'SP-PSU-C-01'
  },
  {
    id: 'prod-sp-case01',
    sku: 'SP-CASE-CC560',
    barcode: '899100300011',
    name: 'DeepCool CC560 V2 Mid-Tower ATX Case Black',
    category: 'Chassis',
    item_type: 'SPARE_PART',
    brand: 'MOAI Systems',
    uom: 'PCS',
    is_serial: false,
    is_assembly: false,
    unit_price: 950000,
    cost_price: 750000,
    stock: 25,
    bin_code: 'SP-CASE-D-01'
  }
];

export const initialSuppliers = [
  {
    id: 'supp-01',
    code: 'SUPP-SYNNEX',
    name: 'PT Synnex Metrodata Indonesia',
    contact: 'Budi Santoso',
    phone: '+62-21-29345800',
    email: 'procurement@synnexmetrodata.com',
    payment_terms: 'NET 30',
    currency: 'IDR',
    lead_time_days: 3,
    on_time_rate: '98%',
    defect_rate: '0.4%',
    is_principal: false
  },
  {
    id: 'supp-02',
    code: 'SUPP-ASUS-ID',
    name: 'PT Asus Technology Indonesia',
    contact: 'Clarissa Tan',
    phone: '+62-21-50821000',
    email: 'b2b_sales@asus.com',
    payment_terms: 'NET 45',
    currency: 'IDR',
    lead_time_days: 5,
    on_time_rate: '95%',
    defect_rate: '0.8%',
    is_principal: true
  },
  {
    id: 'supp-03',
    code: 'SUPP-SILICON',
    name: 'Silicon Tech Global Trading Ltd (HK)',
    contact: 'David Cheung',
    phone: '+852-3105-8899',
    email: 'orders@silicontech.hk',
    payment_terms: 'NET 14',
    currency: 'USD',
    lead_time_days: 12,
    on_time_rate: '92%',
    defect_rate: '1.2%',
    is_principal: false
  }
];

export const initialClients = [
  {
    id: 'cli-01',
    code: 'CLI-TELKO',
    name: 'PT Telko Solusi Nusantara',
    contact: 'Rian Hidayat',
    phone: '+62-21-83749921',
    email: 'purchasing@telkosolusi.co.id',
    payment_terms: 'NET 30',
    credit_limit: 500000000,
    outstanding: 142000000,
    segment: 'corporate'
  },
  {
    id: 'cli-02',
    code: 'CLI-DKI',
    name: 'Diskominfo Pemprov DKI Jakarta',
    contact: 'Ir. Hendro Supriyadi',
    phone: '+62-21-3822255',
    email: 'pengadaan@diskominfo.jakarta.go.id',
    payment_terms: 'NET 45',
    credit_limit: 1000000000,
    outstanding: 380000000,
    segment: 'government'
  },
  {
    id: 'cli-03',
    code: 'CLI-JAYA',
    name: 'Toko Jaya Makmur Komputer Mangga Dua',
    contact: 'Koh William',
    phone: '+62-21-6124455',
    email: 'jayamakmur.m2@gmail.com',
    payment_terms: 'COD',
    credit_limit: 100000000,
    outstanding: 0,
    segment: 'retail'
  }
];

export const initialSerials = [
  {
    id: 'sn-01',
    serial_no: 'SN-AMD-78X-001',
    product_name: 'AMD Ryzen 7 7800X3D Processor Box',
    sku: 'SP-CPU-7800X3D',
    status: 'IN_STOCK',
    bin_code: 'SP-CPU-A-01',
    unit_cost: 5900000,
    received_at: '2026-09-15',
    vendor_warranty_end: '2029-09-15'
  },
  {
    id: 'sn-02',
    serial_no: 'SN-AMD-78X-002',
    product_name: 'AMD Ryzen 7 7800X3D Processor Box',
    sku: 'SP-CPU-7800X3D',
    status: 'ALLOCATED',
    bin_code: 'SP-CPU-A-01',
    unit_cost: 5900000,
    received_at: '2026-09-15',
    vendor_warranty_end: '2029-09-15'
  },
  {
    id: 'sn-03',
    serial_no: 'SN-GPU-407-881',
    product_name: 'Gigabyte GeForce RTX 4070 WINDFORCE OC 12G',
    sku: 'SP-GPU-RTX4070',
    status: 'IN_STOCK',
    bin_code: 'SP-GPU-C-01',
    unit_cost: 9800000,
    received_at: '2026-09-18',
    vendor_warranty_end: '2028-09-18'
  },
  {
    id: 'sn-04',
    serial_no: 'SN-LN-TP-9901',
    product_name: 'Lenovo ThinkPad E14 Gen 5',
    sku: 'PB-LN-E14G5',
    status: 'IN_STOCK',
    bin_code: 'PB-A-1-01',
    unit_cost: 14500000,
    received_at: '2026-09-20',
    vendor_warranty_end: '2029-09-20'
  },
  {
    id: 'sn-05',
    serial_no: 'SN-ARES-PC-001',
    product_name: 'MOAI Ares Elite Gaming PC',
    sku: 'PB-ARES-78X',
    status: 'SOLD',
    bin_code: 'PB-A-1-01',
    unit_cost: 25450000,
    received_at: '2026-09-22',
    sold_at: '2026-09-28',
    customer_warranty_end: '2027-09-28'
  },
  {
    id: 'sn-06',
    serial_no: 'SN-ARES-PC-002',
    product_name: 'MOAI Ares Elite Gaming PC',
    sku: 'PB-ARES-78X',
    status: 'RMA',
    bin_code: 'RMA-HOLD-01',
    unit_cost: 25450000,
    received_at: '2026-09-24',
    note: 'Customer return: blue screen saat gaming test'
  }
];

export const initialStockMovements = [
  {
    id: 'mov-01',
    movement_type: 'OPN_IN',
    product_name: 'Kingston FURY Beast DDR5 32GB',
    qty: 50,
    bin_code: 'SP-RAM-B-01',
    ref_doc: 'OPNAME-INIT',
    unit_cost: 1650000,
    created_at: '2026-09-01 09:00',
    created_by: 'Inventory Admin'
  },
  {
    id: 'mov-02',
    movement_type: 'GR',
    product_name: 'AMD Ryzen 7 7800X3D Processor Box',
    qty: 15,
    bin_code: 'SP-CPU-A-01',
    ref_doc: 'GRN-2026-0042',
    unit_cost: 5900000,
    created_at: '2026-09-15 14:20',
    created_by: 'QC Inspector'
  },
  {
    id: 'mov-03',
    movement_type: 'ASM_OUT',
    product_name: 'AMD Ryzen 7 7800X3D Processor Box',
    qty: -1,
    bin_code: 'SP-CPU-A-01',
    ref_doc: 'ASM-ORD-001',
    unit_cost: 5900000,
    created_at: '2026-09-22 10:15',
    created_by: 'Assembly Tech'
  },
  {
    id: 'mov-04',
    movement_type: 'ASM_IN',
    product_name: 'MOAI Ares Elite Gaming PC',
    qty: 1,
    bin_code: 'PB-A-1-01',
    ref_doc: 'ASM-ORD-001',
    unit_cost: 25450000,
    created_at: '2026-09-22 15:40',
    created_by: 'Assembly Tech'
  },
  {
    id: 'mov-05',
    movement_type: 'GI',
    product_name: 'MOAI Ares Elite Gaming PC',
    qty: -1,
    bin_code: 'PB-A-1-01',
    ref_doc: 'SJ-2026-0089',
    unit_cost: 25450000,
    created_at: '2026-09-28 11:30',
    created_by: 'Outbound Admin'
  },
  {
    id: 'mov-06',
    movement_type: 'RMA_IN',
    product_name: 'MOAI Ares Elite Gaming PC',
    qty: 1,
    bin_code: 'RMA-HOLD-01',
    ref_doc: 'RMA-2026-0005',
    unit_cost: 25450000,
    created_at: '2026-10-01 16:10',
    created_by: 'Return Admin'
  }
];

export const initialBOM = {
  id: 'bom-01',
  product_name: 'MOAI Ares Elite Gaming PC',
  output_sku: 'PB-ARES-78X',
  version: 'v1.0',
  labor_cost: 250000,
  overhead_cost: 100000,
  is_active: true,
  components: [
    { sku: 'SP-CPU-7800X3D', name: 'AMD Ryzen 7 7800X3D Processor', qty: 1, cost: 5900000, is_serial: true },
    { sku: 'SP-MB-B650PLUS', name: 'ASUS TUF GAMING B650-PLUS WIFI', qty: 1, cost: 3400000, is_serial: true },
    { sku: 'SP-RAM-DDR5-32G', name: 'Kingston FURY Beast DDR5 32GB Kit', qty: 1, cost: 1650000, is_serial: false },
    { sku: 'SP-SSD-990P-1T', name: 'Samsung 990 PRO NVMe 1TB', qty: 1, cost: 1850000, is_serial: false },
    { sku: 'SP-GPU-RTX4070', name: 'Gigabyte GeForce RTX 4070 OC 12G', qty: 1, cost: 9800000, is_serial: true },
    { sku: 'SP-PSU-RM750E', name: 'Corsair RM750e 750W Gold', qty: 1, cost: 1750000, is_serial: false },
    { sku: 'SP-CASE-CC560', name: 'DeepCool CC560 V2 Mid-Tower ATX Case', qty: 1, cost: 750000, is_serial: false }
  ]
};

export const initialAssemblyOrders = [
  {
    id: 'asm-01',
    assembly_number: 'ASM-ORD-2026-001',
    product_name: 'MOAI Ares Elite Gaming PC',
    sku: 'PB-ARES-78X',
    qty_to_build: 1,
    status: 'COMPLETED',
    target_bin: 'PB-A-1-01',
    created_by: 'Bambang Assembly',
    completed_at: '2026-09-22 16:00',
    serial_generated: 'SN-ARES-PC-001',
    total_cost: 25450000
  },
  {
    id: 'asm-02',
    assembly_number: 'ASM-ORD-2026-002',
    product_name: 'MOAI Ares Elite Gaming PC',
    sku: 'PB-ARES-78X',
    qty_to_build: 2,
    status: 'ISSUED',
    target_bin: 'PB-A-1-01',
    created_by: 'Bambang Assembly',
    completed_at: null,
    serial_generated: null,
    total_cost: 50900000
  }
];

export const initialPurchaseOrders = [
  {
    id: 'po-01',
    po_number: 'PO-2026-0042',
    supplier_name: 'PT Synnex Metrodata Indonesia',
    order_date: '2026-09-10',
    expected_date: '2026-09-15',
    status: 'FULL',
    currency: 'IDR',
    total: 88500000,
    items_count: 3
  },
  {
    id: 'po-02',
    po_number: 'PO-2026-0043',
    supplier_name: 'Silicon Tech Global Trading Ltd',
    order_date: '2026-09-20',
    expected_date: '2026-10-05',
    status: 'APPROVED',
    currency: 'USD',
    exchange_rate: 15650,
    total: 12400, // USD
    items_count: 5
  },
  {
    id: 'po-03',
    po_number: 'PO-2026-0044',
    supplier_name: 'PT Asus Technology Indonesia',
    order_date: '2026-10-01',
    expected_date: '2026-10-08',
    status: 'PENDING_APPROVAL',
    currency: 'IDR',
    total: 45000000,
    items_count: 2
  }
];

export const initialRequisitions = [
  {
    id: 'pr-01',
    pr_number: 'PR-AUTO-081',
    source: 'AUTO_REORDER',
    product_name: 'Samsung 990 PRO NVMe M.2 SSD 1TB',
    current_stock: 40,
    reorder_point: 40,
    suggested_qty: 50,
    supplier_name: 'PT Synnex Metrodata Indonesia',
    status: 'OPEN',
    generated_at: '2026-10-02 08:30'
  }
];

export const initialSalesOrders = [
  {
    id: 'so-01',
    so_number: 'SO-2026-0101',
    client_name: 'PT Telko Solusi Nusantara',
    order_date: '2026-09-25',
    status: 'DELIVERED',
    priority: 'High',
    total: 49000000,
    items: [{ name: 'MOAI Ares Elite Gaming PC', qty: 2 }]
  },
  {
    id: 'so-02',
    so_number: 'SO-2026-0102',
    client_name: 'Diskominfo Pemprov DKI Jakarta',
    order_date: '2026-10-01',
    status: 'PICKING',
    priority: 'High',
    total: 168000000,
    items: [{ name: 'Lenovo ThinkPad E14 Gen 5', qty: 10 }]
  },
  {
    id: 'so-03',
    so_number: 'SO-2026-0103',
    client_name: 'Toko Jaya Makmur Komputer',
    order_date: '2026-10-02',
    status: 'ALLOCATED',
    priority: 'Medium',
    total: 23500000,
    items: [{ name: 'AMD Ryzen 7 7800X3D', qty: 2 }, { name: 'Kingston DDR5 32GB', qty: 5 }]
  }
];

export const initialApBills = [
  { id: 'ap-01', bill_no: 'BILL-2026-0031', vendor: 'PT Synnex Metrodata Indonesia', due_date: '2026-10-15', amount: 88500000, status: 'unpaid', term: 'NET 30' },
  { id: 'ap-02', bill_no: 'BILL-2026-0032', vendor: 'Silicon Tech Global Ltd', due_date: '2026-10-04', amount: 194060000, currency: 'USD', usd_val: 12400, status: 'unpaid', term: 'NET 14' }
];

export const initialArInvoices = [
  { id: 'ar-01', inv_no: 'INV-2026-0089', client: 'PT Telko Solusi Nusantara', due_date: '2026-10-28', amount: 49000000, status: 'unpaid', term: 'NET 30' },
  { id: 'ar-02', inv_no: 'INV-2026-0088', client: 'Diskominfo Pemprov DKI Jakarta', due_date: '2026-11-15', amount: 168000000, status: 'partial', paid: 68000000, term: 'NET 45' }
];

export const initialGRNList = [
  {
    id: 'grn-01',
    gr_number: 'GRN-2026-0043',
    po_number: 'PO-2026-0043',
    supplier_name: 'Silicon Tech Global Ltd',
    description: '15 Unit AMD Ryzen & Kingston SSD',
    status: 'PENDING_QC',
    bin_code: 'QC-IN-01',
    received_at: '2026-10-05 11:20'
  }
];

export const calculateTotalValuation = (productsList) => {
  return (productsList || []).reduce((acc, p) => acc + ((p.cost_price || 0) * (p.stock || 0)), 0);
};

