export const processes = [
  {
    id: 'proc-1',
    title: 'Process 1: Ordering Preparation / Planning',
    stages: [
      { id: 'cpo_esta', title: 'CPO/ESTA', subtitle: 'Planning/Sales', system: 'boq', systemLabel: 'BOQ/PO', color: '#8b5cf6' },
      { id: 'vc_wbs', title: 'VC & WBS Ordering', subtitle: 'PFA/PP', system: 'sap', systemLabel: 'SAP', color: '#3b82f6' },
      { id: 'review_stock', title: 'Review Stock', subtitle: 'MP', system: 'sap', systemLabel: 'SAP', color: '#0ea5e9' },
      { id: 'premium_proposal', title: 'BoQ & Premium Proposal', subtitle: 'Solution & Eng.', system: 'premium', systemLabel: 'Premium Proposal', color: '#10b981' },
    ]
  },
  {
    id: 'proc-2',
    title: 'Process 2: Material Delivery',
    stages: [
      { id: 'release_inquiry', title: 'Release Inquiry', subtitle: 'EPC', system: 'premium', systemLabel: 'SAP - Premium', color: '#f59e0b' },
      { id: 'po_creation', title: 'PO Creation', subtitle: 'EPC', system: 'sap', systemLabel: 'SAP', color: '#f97316' },
      { id: 'hub_activities', title: 'Hub Activities (EAB)', subtitle: 'ESH NJ', system: 'sap', systemLabel: 'Hub', color: '#ef4444' },
      { id: 'material_calloff', title: 'Material Call-off', subtitle: 'EPC/SLDM', system: 'sap', systemLabel: 'SAP', color: '#dc2626' },
    ]
  },
  {
    id: 'proc-3',
    title: 'Process 3: Custom Clearance',
    stages: [
      { id: 'pre_alert_docs', title: 'Pre-Alert & Docs', subtitle: 'Supply/SLDM', system: 'customs', systemLabel: 'Documentation', color: '#8b5cf6' },
      { id: 'custom_declaration', title: 'Custom Declaration', subtitle: 'Broker/LSP', system: 'customs', systemLabel: 'Brokerage', color: '#3b82f6' },
      { id: 'custom_payment', title: 'Duty & Payment', subtitle: 'Customs/Bank', system: 'customs', systemLabel: 'Payment', color: '#f59e0b' },
      { id: 'release_delivery', title: 'Release & Delivery', subtitle: 'LSP', system: 'sap', systemLabel: 'Logistics', color: '#10b981' },
    ]
  },
  {
    id: 'proc-4',
    title: 'Process 4: WH Management & Last Mile',
    stages: [
      { id: 'wh_inbound', title: 'Inbound & GR', subtitle: 'LSP/SLDM', system: 'sap', systemLabel: 'SAP IM/WMS', color: '#8b5cf6' },
      { id: 'wh_inventory', title: 'Warehouse & Inventory', subtitle: 'SLDM/DWM', system: 'sap', systemLabel: 'SAP IM/WMS', color: '#3b82f6' },
      { id: 'wh_outbound', title: 'Outbound & Last Mile', subtitle: 'LSP/EPC', system: 'sap', systemLabel: 'SAP IM/WMS', color: '#10b981' }
    ]
  },
  {
    id: 'proc-5',
    title: 'Process 5: EID Last Mile',
    stages: [
      { id: 'eid_planning', title: 'MR Validation', subtitle: 'IM/EPC', system: 'sap', systemLabel: 'SAP', color: '#8b5cf6' },
      { id: 'eid_obd', title: 'OBD Creation', subtitle: 'EPC', system: 'sap', systemLabel: 'SAP', color: '#3b82f6' },
      { id: 'eid_delivery', title: 'Pick, Pack & Deliver', subtitle: 'WH', system: 'sap', systemLabel: 'WMS', color: '#10b981' }
    ]
  },
  {
    id: 'proc-6',
    title: 'Process 6: Local 3PP Flow',
    stages: [
      { id: 'tpp_request', title: 'Request & Validate', subtitle: 'Supply Local', system: 'boq', systemLabel: 'Sourcing', color: '#f59e0b' },
      { id: 'tpp_po', title: 'Create/Change PO', subtitle: 'Supply Local & EPC', system: 'sap', systemLabel: 'SAP', color: '#ef4444' },
      { id: 'tpp_delivery', title: 'Delivery & GR Posting', subtitle: 'Supply Local', system: 'sap', systemLabel: 'SAP', color: '#dc2626' }
    ]
  }
];

export const clarificationChecklist = [
  { id: 'chk_1', text: 'Verify 100% clarified order & provide feedback to ASR/Core-3+' },
  { 
    id: 'chk_2', 
    text: 'Request/Check Value Contract, FAS, ESTA#/PO# & NN/WBS for Ordering',
    requiresInput: true,
    fields: [
      { name: 'vc_number', label: 'Value Contract (VC)', type: 'text', placeholder: 'e.g. VC-100293' },
      { name: 'wbs_code', label: 'WBS Code', type: 'text', placeholder: 'e.g. WBS-XYZ-99' },
      { name: 'esta_po', label: 'ESTA / PO Number', type: 'text', placeholder: 'e.g. PO-5001' }
    ]
  },
  { 
    id: 'chk_3', 
    text: 'Update Order Plan, Partner/Customer info in PP',
    requiresInput: true,
    fields: [
      { name: 'partner_name', label: 'Partner Name', type: 'text', placeholder: 'e.g. Acme Corp' },
      { name: 'customer_contact', label: 'Customer Contact', type: 'text', placeholder: 'e.g. john@acme.com' },
      { name: 'planned_date', label: 'Planned Date', type: 'date' }
    ]
  },
  { id: 'chk_4', text: 'Checking with solution for type site availability in Premium Proposal' },
  { id: 'chk_5', text: 'NIF file preparation' },
  { id: 'chk_6', text: 'Checking existing available stock to decide partially or fully order' },
  { id: 'chk_7', text: 'Perform Material Borrow or Transfer for available stock' },
  { id: 'chk_8', text: 'Request and assess RO Plan for Batching order' },
  { id: 'chk_9', text: 'Request/Create Premium Proposal Ordering (Mapping SKU & Qty)' },
  { id: 'chk_10', text: 'Checking the Premium proposal ordering (Clarified Order)' },
  { id: 'chk_11', text: 'Request PR/PO Creation to ROD for Import material' },
  { id: 'chk_12', text: 'Escalation to PFM or Solution Architect if Order failed to create' },
  { id: 'cc_1', text: 'Received Pre alert' },
  { id: 'cc_2', text: 'Review shipping documents' },
  { id: 'cc_3', text: 'Send shipping document to customs brokerage, coordinating and monitoring' },
  { id: 'cc_4', text: 'Custom declaration verifications' },
  { id: 'cc_5', text: 'Verify the HC code in the import declaration draft and confirm to custom broker' },
  { id: 'cc_6', text: 'Coordinate with solutions to collect and share product catalogue/brochure to custom broker' },
  { id: 'cc_7', text: 'Physical visit in customs' },
  { id: 'cc_8', text: 'Responsible for custom duty and payment process' },
  { 
    id: 'cc_9', 
    text: 'Import permit',
    requiresInput: true,
    fields: [
      { name: 'permit_number', label: 'Permit Number', type: 'text', placeholder: 'e.g. IMP-2023-441' },
      { name: 'permit_expiry', label: 'Permit Expiry Date', type: 'date' },
      { name: 'document_url', label: 'Upload Import Permit (PDF/Image)', type: 'file' }
    ]
  },
  { id: 'cc_10', text: 'Ensure to comply local laws and regulations' },
  { id: 'cc_11', text: 'Arrange delivery from custom to local project WH' },
  { id: 'wh_1', text: 'Follow up, GR/GI on time' },
  { id: 'wh_2', text: 'Warehouse Priorities Picking & Outbound Activity' },
  { id: 'wh_3', text: 'Domestic Transport Priority, Delivery & Approval' },
  { id: 'wh_4', text: 'Operational Escalation' },
  { id: 'wh_5', text: 'Invoicing/LSP billing' },
  { id: 'wh_6', text: 'Sox Controls Monthly, Quarterly & Annually' },
  { id: 'wh_7', text: 'Scrap list proposal based on TG5 Settlement document, follow up, approval and execute' },
  { id: 'wh_8', text: 'Open box inspection' },
  { id: 'wh_9', text: 'Conduct monthly KPI meeting - Governance meeting (Performance Analysis)' },
  { id: 'wh_10', text: 'Create inbound orders for customer owned inventory' },
  { id: 'wh_11', text: 'Managing GR/IR issues included aged invoices and parked invoices' },
  { id: 'wh_12', text: 'Create and Update Supply Chain Cost Last mile' },
  { id: 'inv_1', text: 'Update FG report daily and monitor to make sure WM perform GR and GI in timely manner' },
  { id: 'inv_2', text: 'Provide stock report to stakeholder' },
  { id: 'inv_3', text: 'Create inventory dismantle report material belong to customer' },
  { id: 'inv_4', text: 'Monitor and control stock to maintain FG level and also Aging material' },
  { id: 'inv_5', text: 'Inter-warehouse transfer and WBS to WBS transfer to manage stock' },
  { id: 'inv_6', text: 'Secure effective inventory management, including reconciliation of stock, physical stock take, scrapping and initiation and follow up of return flows.' },
  { id: 'inv_7', text: 'Manage inventory level, control and monitoring GR Inbound Shipment' },
  { id: 'inv_8', text: 'Unreserved material from network due to wrong assignment or change request' },
  { id: 'inv_9', text: 'Arrange delivery material for excess from PO, Dismantle material, transfer order (STO) to customer warehouse' },
  { id: 'inv_10', text: 'To manage customer specific requirements' },
  { id: 'acc_1', text: 'Weekly System Reconciliation' },
  { id: 'acc_2', text: 'Monthly Cycle Count' },
  { id: 'acc_3', text: 'Yearly Stock Take' },
  { id: 'acc_4', text: 'Stock Adjustment / Scrap' },
  { id: 'lsp_1', text: 'Warehouse capacity setup and control' },
  { id: 'lsp_2', text: 'Conduct monthly governance meeting' },
  { id: 'lsp_3', text: 'Follow-up escalation for warehouse operational issue' },
  { id: 'lsp_4', text: 'Vendor RFP Support – Sourcing' },
  { id: 'lsp_5', text: 'Drive operational LSP development' },
  { id: 'post_1', text: 'Check EAB HW PO compare with PP Ordering' },
  { id: 'post_2', text: 'Follow-up with EAB ODM/EAB Supplier for RFS dates' },
  { id: 'post_3', text: 'Prepare report order and delivery plan (RFS, ETA) tracking reporting to CPM/stakeholders.' },
  { id: 'post_4', text: 'Handle pre-escalation and assist formal escalation to improve dates' },
  { id: 'post_5', text: 'Prepare Air exemption approval for speed-up delivery' },
  { id: 'post_6', text: 'Send Call off instruction to EPC according to Project Plan' },
  { id: 'post_7', text: 'Check against One Report whether everything is called off' },
  { 
    id: 'post_8', 
    text: 'Checking document AWB and record delivery plan',
    requiresInput: true,
    fields: [
      { name: 'awb_number', label: 'Air Waybill (AWB) Number', type: 'text', placeholder: 'e.g. AWB-889922' },
      { name: 'eta_date', label: 'Estimated Time of Arrival (ETA)', type: 'date' },
      { name: 'document_url', label: 'Upload AWB Document (PDF/Image)', type: 'file' }
    ]
  },
  { id: 'post_9', text: 'Follow up with DSP for update ETA and or deviation during shipment' },
  { id: 'post_10', text: 'Inform detail material arrival to stakeholder' },
  { id: 'post_11', text: 'Provide copy customer PO and material detail sheet to customs officer when requested' },
  { id: 'post_12', text: 'Monitor custom clearance process' },
  { id: 'oth_1', text: 'Coordinate with Finance for NS target achievements' },
  { id: 'oth_2', text: 'Support Acceptance manager for Invoice submitted (WIP, NS, and Invoice)' },
  { id: 'oth_3', text: 'Report cost utilize from EAB HW, SW, Warehouse and Delivery to TPM' },
  { id: 'oth_4', text: 'Clean up plan cost and any pending transaction in network before TG5' },
  { id: 'oth_5', text: 'Create form TG5 Project Settlement of Excess Materials, sanity network, clean up remaining stock' },
  { id: 'oth_6', text: 'Prepare Scrap list proposal based on TG5 Settlement document or quarterly review Ericsson owned material and circulate for approval' },
  { id: 'oth_7', text: 'Request to Return Logistic management to register Scrap material to Product Take Back Management' },
  { id: 'oth_8', text: 'Prepare and follow up Supplier statement letter of project closure signed' },
  { id: 'oth_9', text: 'Arrange delivery material to customer warehouse (dismantle or new material assign for customer warehouse)' },
  { id: 'tpp_1', text: 'Vendor development, capacity and capability build' },
  { id: 'tpp_2', text: 'Forecast and shared with Suppliers and Local sourcing' },
  { id: 'tpp_3', text: 'Initiate request for ordering' },
  { id: 'tpp_4', text: 'Validate request/100% clarified order' },
  { id: 'tpp_5', text: 'Request to EPC to execute order' },
  { id: 'tpp_6', text: 'Validate & ordering for PO-PR, GR/IR balance, PO closure' },
  { id: 'tpp_7', text: 'Follow up delivery to project WH' },
  { id: 'tpp_8', text: 'Manage escalation' },
  { id: 'tpp_9', text: 'Manage share of business' },
  { id: 'eid_1', text: 'Release WBS/NN and send to IM' },
  { id: 'eid_2', text: 'PP Upload in DPM' },
  { id: 'eid_3', text: 'Create MR and submit to BAM' },
  { id: 'eid_4', text: 'MR auto transfer to PDB & Data validation' },
  { 
    id: 'eid_5', 
    text: 'Direct/Indirect OBD creation based on WBS evaluation',
    requiresInput: true,
    fields: [
      { name: 'obd_number', label: 'Outbound Delivery (OBD) Number', type: 'text', placeholder: 'e.g. OBD-77382' },
      { name: 'courier_name', label: 'Courier Service', type: 'text', placeholder: 'e.g. DHL Express' }
    ]
  },
  { id: 'eid_6', text: 'WBS Reservation & Transfer stock (MB1B/CN22)' },
  { id: 'eid_7', text: 'Send OBD daily report' },
  { id: 'eid_9', text: 'GI in WMS and Deliver to site' },
  // Process 2 Documents
  { id: 'doc_2_a', textEN: 'Delivery Order (DO)', textID: 'Surat Pengantar Pengiriman (DO)', requiresInput: true, fields: [
    { name: 'supplier_name', labelEN: 'Supplier Code/Name', labelID: 'Kode/Nama Pemasok', type: 'text' },
    { name: 'customer_name', labelEN: 'Customer Code/Name', labelID: 'Kode/Nama Pelanggan', type: 'text' },
    { name: 'delivery_address', labelEN: 'Delivery Address', labelID: 'Alamat Tujuan', type: 'text' },
    { name: 'so_po_number', labelEN: 'SO/PO Number', labelID: 'Nomor SO/PO', type: 'text' },
    { name: 'origin_warehouse', labelEN: 'Origin Warehouse', labelID: 'Kode Gudang Asal', type: 'text' },
    { name: 'courier_name', labelEN: 'Courier/Expedition', labelID: 'Nama Kurir/Ekspedisi', type: 'text' },
    { name: 'vehicle_number', labelEN: 'Vehicle License Plate', labelID: 'Plat Nomor Kendaraan', type: 'text' },
    { name: 'seq_number', labelEN: 'Sequence Number', labelID: 'Nomor Urut', type: 'text' },
    { name: 'item_sku', labelEN: 'Item Code / SKU', labelID: 'Kode Barang / SKU', type: 'text' },
    { name: 'item_name', labelEN: 'Item Name', labelID: 'Nama Barang', type: 'text' },
    { name: 'unit', labelEN: 'Unit of Measure', labelID: 'Satuan Ukuran', type: 'text' },
    { name: 'quantity', labelEN: 'Quantity Delivered', labelID: 'Jumlah Dikirim', type: 'number' },
    { name: 'notes', labelEN: 'Additional Notes', labelID: 'Keterangan Tambahan', type: 'text' },
    { name: 'sender_signature', labelEN: 'Sender Signature', labelID: 'Tanda Tangan Pengirim', type: 'text' },
    { name: 'receiver_signature', labelEN: 'Receiver Signature', labelID: 'Tanda Tangan Penerima', type: 'text' },
    { name: 'delivery_terms', labelEN: 'Delivery Terms', labelID: 'Syarat Pengiriman', type: 'text' },
    { name: 'document_url', labelEN: 'Upload DO Document', labelID: 'Unggah Dokumen DO', type: 'file' }
  ] },
  { id: 'doc_2_b', textEN: 'Packing List', textID: 'Daftar Isi Kemasan (Packing List)', requiresInput: true, fields: [
    { name: 'packing_list_no', labelEN: 'Packing List Number', labelID: 'Nomor Packing List', type: 'text' },
    { name: 'do_ref', labelEN: 'Reference DO Number', labelID: 'Nomor DO Referensi', type: 'text' },
    { name: 'po_ref', labelEN: 'Reference PO Number', labelID: 'Nomor PO Referensi', type: 'text' },
    { name: 'creation_date', labelEN: 'Creation Date', labelID: 'Tanggal Pembuatan', type: 'date' },
    { name: 'sender_receiver', labelEN: 'Sender & Receiver', labelID: 'Pengirim & Penerima', type: 'text' },
    { name: 'total_packages', labelEN: 'Total Packages', labelID: 'Total Jumlah Kemasan', type: 'number' },
    { name: 'weight_bruto_neto', labelEN: 'Gross/Net Weight', labelID: 'Berat Kotor & Bersih', type: 'text' },
    { name: 'dimensions', labelEN: 'Dimensions (LxWxH)', labelID: 'Dimensi Total (PxLxT)', type: 'text' },
    { name: 'package_no', labelEN: 'Package Number', labelID: 'Nomor Kemasan/Kardus', type: 'text' },
    { name: 'item_sku', labelEN: 'Item Code', labelID: 'Kode Barang', type: 'text' },
    { name: 'item_name', labelEN: 'Item Name', labelID: 'Nama Barang', type: 'text' },
    { name: 'qty_per_package', labelEN: 'Qty Per Package', labelID: 'Jumlah per Kemasan', type: 'number' },
    { name: 'unit', labelEN: 'Unit', labelID: 'Satuan', type: 'text' },
    { name: 'weight_per_package', labelEN: 'Weight Per Package', labelID: 'Berat per Kemasan', type: 'text' },
    { name: 'handling_notes', labelEN: 'Handling Notes', labelID: 'Keterangan Penanganan', type: 'text' },
    { name: 'packer_signature', labelEN: 'Packer Signature', labelID: 'Tanda Tangan Pengepak', type: 'text' },
    { name: 'document_url', labelEN: 'Upload Packing List', labelID: 'Unggah Packing List', type: 'file' }
  ] },
  { id: 'doc_2_c', textEN: 'Invoice', textID: 'Faktur Penjualan (Invoice)', requiresInput: true, fields: [
    { name: 'invoice_no', labelEN: 'Invoice Number', labelID: 'Nomor Invoice', type: 'text' },
    { name: 'item_sku', labelEN: 'Item Code', labelID: 'Kode Barang', type: 'text' },
    { name: 'item_name', labelEN: 'Item Name & Specs', labelID: 'Nama Barang & Spesifikasi', type: 'text' },
    { name: 'quantity', labelEN: 'Quantity', labelID: 'Jumlah', type: 'number' },
    { name: 'unit', labelEN: 'Unit', labelID: 'Satuan', type: 'text' },
    { name: 'unit_price', labelEN: 'Unit Price', labelID: 'Harga Satuan', type: 'number' },
    { name: 'discount', labelEN: 'Discount', labelID: 'Diskon', type: 'number' },
    { name: 'total_per_item', labelEN: 'Total per Item', labelID: 'Nilai Total per Barang', type: 'number' },
    { name: 'subtotal', labelEN: 'Subtotal', labelID: 'Subtotal Nilai Barang', type: 'number' },
    { name: 'extra_discount', labelEN: 'Extra Discount', labelID: 'Potongan Tambahan', type: 'number' },
    { name: 'extra_fees', labelEN: 'Additional Fees', labelID: 'Biaya Tambahan', type: 'number' },
    { name: 'tax', labelEN: 'Tax', labelID: 'Pajak (PPN/PPh)', type: 'number' },
    { name: 'total_amount', labelEN: 'Total Amount', labelID: 'Total Tagihan Akhir', type: 'number' },
    { name: 'amount_in_words', labelEN: 'Amount in Words', labelID: 'Terbilang', type: 'text' },
    { name: 'document_url', labelEN: 'Upload Invoice', labelID: 'Unggah Invoice', type: 'file' }
  ] },
  { id: 'doc_2_d', textEN: 'Proof of Delivery (POD)', textID: 'Bukti Serah Terima Barang (POD)', requiresInput: true, fields: [
    { name: 'item_details', labelEN: 'Delivered Items Details', labelID: 'Rincian Barang Dikirim', type: 'text' },
    { name: 'item_condition', labelEN: 'Received Condition', labelID: 'Kondisi Barang Diterima', type: 'text' },
    { name: 'qty_received', labelEN: 'Received Quantity', labelID: 'Jumlah Diterima', type: 'number' },
    { name: 'notes', labelEN: 'Notes/Complaints', labelID: 'Catatan/Keluhan', type: 'text' },
    { name: 'receiver_signature', labelEN: 'Receiver Signature', labelID: 'Tanda Tangan Penerima', type: 'text' },
    { name: 'receiver_name', labelEN: 'Receiver Name & Title', labelID: 'Nama & Jabatan Penerima', type: 'text' },
    { name: 'gps_location', labelEN: 'GPS Coordinates', labelID: 'Lokasi Koordinat GPS', type: 'text' },
    { name: 'document_url', labelEN: 'Upload POD Document', labelID: 'Unggah Bukti POD', type: 'file' }
  ] },
  { id: 'doc_2_e', textEN: 'Bill of Lading', textID: 'Surat Muatan / Bill of Lading', requiresInput: true, fields: [
    { name: 'vehicle_type', labelEN: 'Vehicle Type', labelID: 'Jenis Kendaraan', type: 'text' },
    { name: 'vehicle_number', labelEN: 'License Plate', labelID: 'Plat Nomor', type: 'text' },
    { name: 'driver_info', labelEN: 'Driver Identity', labelID: 'Nama & Identitas Pengemudi', type: 'text' },
    { name: 'route', labelEN: 'Route (From - To)', labelID: 'Rute (Dari - Ke)', type: 'text' },
    { name: 'eta', labelEN: 'Estimated Time of Arrival', labelID: 'Estimasi Waktu Tempuh', type: 'text' },
    { name: 'cargo_details', labelEN: 'Cargo Details & Weight', labelID: 'Isi Muatan & Berat', type: 'text' },
    { name: 'document_url', labelEN: 'Upload BOL / Waybill', labelID: 'Unggah BOL/Surat Jalan', type: 'file' }
  ] },

  // Process 4 Documents
  { id: 'doc_4_a', textEN: 'Good Receipts Notes (GRN)', textID: 'Bukti Penerimaan Barang (GRN)', requiresInput: true, fields: [
    { name: 'grn_no', labelEN: 'Sequence Number', labelID: 'Nomor Urut', type: 'text' },
    { name: 'item_sku', labelEN: 'Item Code / SKU', labelID: 'Kode Barang / SKU', type: 'text' },
    { name: 'item_name', labelEN: 'Item Name & Specs', labelID: 'Nama Barang & Spesifikasi', type: 'text' },
    { name: 'unit', labelEN: 'Unit', labelID: 'Satuan', type: 'text' },
    { name: 'qty_diff', labelEN: 'Delivered vs Received Qty', labelID: 'Jumlah Dikirim vs Diterima', type: 'text' },
    { name: 'condition', labelEN: 'Condition', labelID: 'Kondisi Barang', type: 'text' },
    { name: 'batch_no', labelEN: 'Batch / Serial Number', labelID: 'Nomor Batch / Seri', type: 'text' },
    { name: 'location', labelEN: 'Initial Placement', labelID: 'Lokasi Penempatan Awal', type: 'text' },
    { name: 'document_url', labelEN: 'Upload GRN', labelID: 'Unggah GRN', type: 'file' }
  ] },
  { id: 'doc_4_b', textEN: 'Put Away List', textID: 'Daftar Penempatan Barang (Put Away)', requiresInput: true, fields: [
    { name: 'put_away_no', labelEN: 'Sequence Number', labelID: 'Nomor Urut', type: 'text' },
    { name: 'item_sku', labelEN: 'Item Code', labelID: 'Kode Barang', type: 'text' },
    { name: 'item_name', labelEN: 'Item Name', labelID: 'Nama Barang', type: 'text' },
    { name: 'qty', labelEN: 'Quantity', labelID: 'Jumlah Barang', type: 'number' },
    { name: 'unit', labelEN: 'Unit', labelID: 'Satuan', type: 'text' },
    { name: 'origin_loc', labelEN: 'Origin Location', labelID: 'Lokasi Asal', type: 'text' },
    { name: 'dest_loc', labelEN: 'Destination Location', labelID: 'Lokasi Tujuan', type: 'text' },
    { name: 'handling_notes', labelEN: 'Handling Notes', labelID: 'Keterangan Penanganan', type: 'text' },
    { name: 'document_url', labelEN: 'Upload Put Away List', labelID: 'Unggah Put Away List', type: 'file' }
  ] },
  { id: 'doc_4_c', textEN: 'Stock Card', textID: 'Kartu Stok', requiresInput: true, fields: [
    { name: 'trans_date', labelEN: 'Date & Time', labelID: 'Tanggal & Waktu', type: 'text' },
    { name: 'ref_doc', labelEN: 'Reference Document', labelID: 'Nomor Dokumen Referensi', type: 'text' },
    { name: 'trans_type', labelEN: 'Transaction Type', labelID: 'Jenis Transaksi', type: 'text' },
    { name: 'qty_in', labelEN: 'Qty In', labelID: 'Jumlah Masuk', type: 'number' },
    { name: 'qty_out', labelEN: 'Qty Out', labelID: 'Jumlah Keluar', type: 'number' },
    { name: 'qty_balance', labelEN: 'Balance', labelID: 'Sisa Stok', type: 'number' },
    { name: 'batch_no', labelEN: 'Batch/Serial Number', labelID: 'Nomor Batch/Seri', type: 'text' },
    { name: 'document_url', labelEN: 'Upload Stock Card', labelID: 'Unggah Kartu Stok', type: 'file' }
  ] },
  { id: 'doc_4_d', textEN: 'Packing List (WH)', textID: 'Daftar Isi Kemasan (Gudang)', requiresInput: true, fields: [
    { name: 'package_no', labelEN: 'Package Number', labelID: 'Nomor Kemasan/Kardus', type: 'text' },
    { name: 'item_sku', labelEN: 'Item Code', labelID: 'Kode Barang', type: 'text' },
    { name: 'item_name', labelEN: 'Item Name', labelID: 'Nama Barang', type: 'text' },
    { name: 'qty_per_package', labelEN: 'Qty In Package', labelID: 'Jumlah Dalam Kemasan', type: 'number' },
    { name: 'unit', labelEN: 'Unit', labelID: 'Satuan', type: 'text' },
    { name: 'weight_per_package', labelEN: 'Weight Per Package', labelID: 'Berat Per Kemasan', type: 'text' },
    { name: 'handling_notes', labelEN: 'Handling Marks', labelID: 'Tanda Penanganan', type: 'text' },
    { name: 'document_url', labelEN: 'Upload Packing List', labelID: 'Unggah Packing List', type: 'file' }
  ] },
  { id: 'doc_4_e', textEN: 'Good Issue (GI)', textID: 'Bukti Pengeluaran Barang (GI)', requiresInput: true, fields: [
    { name: 'gi_no', labelEN: 'Sequence Number', labelID: 'Nomor Urut', type: 'text' },
    { name: 'item_sku', labelEN: 'Item Code', labelID: 'Kode Barang', type: 'text' },
    { name: 'item_name', labelEN: 'Item Name', labelID: 'Nama Barang', type: 'text' },
    { name: 'unit', labelEN: 'Unit', labelID: 'Satuan', type: 'text' },
    { name: 'qty_diff', labelEN: 'Requested vs Issued Qty', labelID: 'Jumlah Diminta vs Dikeluarkan', type: 'text' },
    { name: 'batch_no', labelEN: 'Batch / Serial Number', labelID: 'Nomor Batch / Seri', type: 'text' },
    { name: 'location', labelEN: 'Picking Location', labelID: 'Lokasi Pengambilan', type: 'text' },
    { name: 'document_url', labelEN: 'Upload GI', labelID: 'Unggah GI', type: 'file' }
  ] },
  { id: 'doc_4_f', textEN: 'Delivery Order (DO)', textID: 'Surat Pengantar Pengiriman (DO Gudang)', requiresInput: true, fields: [
    { name: 'do_no', labelEN: 'Sequence Number', labelID: 'Nomor Urut', type: 'text' },
    { name: 'item_sku', labelEN: 'Item Code', labelID: 'Kode Barang', type: 'text' },
    { name: 'item_name', labelEN: 'Item Name & Specs', labelID: 'Nama Barang & Spesifikasi', type: 'text' },
    { name: 'unit', labelEN: 'Unit', labelID: 'Satuan', type: 'text' },
    { name: 'quantity', labelEN: 'Delivered Qty', labelID: 'Jumlah Dikirim', type: 'number' },
    { name: 'notes', labelEN: 'Additional Notes', labelID: 'Keterangan Tambahan', type: 'text' },
    { name: 'document_url', labelEN: 'Upload DO', labelID: 'Unggah DO', type: 'file' }
  ] },
  { id: 'doc_4_g', textEN: 'Proof of Delivery (WH POD)', textID: 'Bukti Serah Terima (POD Gudang)', requiresInput: true, fields: [
    { name: 'item_details', labelEN: 'Delivered Items', labelID: 'Daftar Barang Dikirim', type: 'text' },
    { name: 'qty_condition', labelEN: 'Quantity Confirmation', labelID: 'Konfirmasi Jumlah Diterima', type: 'text' },
    { name: 'condition', labelEN: 'Item Condition', labelID: 'Kondisi Barang', type: 'text' },
    { name: 'notes', labelEN: 'Complaints/Approvals', labelID: 'Catatan Keluhan/Persetujuan', type: 'text' },
    { name: 'receiver', labelEN: 'Receiver Signature & Name', labelID: 'Tanda Tangan & Nama Penerima', type: 'text' },
    { name: 'document_url', labelEN: 'Upload POD & Photo', labelID: 'Unggah POD & Foto', type: 'file' }
  ] },
  { id: 'doc_4_h', textEN: 'Shipping Manifest', textID: 'Daftar Muatan Pengiriman', requiresInput: true, fields: [
    { name: 'manifest_no', labelEN: 'Shipment Sequence', labelID: 'Nomor Urut Kiriman', type: 'text' },
    { name: 'do_ref', labelEN: 'DO / Receipt Number', labelID: 'Nomor DO / Resi', type: 'text' },
    { name: 'sender', labelEN: 'Sender Name & Address', labelID: 'Nama & Alamat Pengirim', type: 'text' },
    { name: 'receiver', labelEN: 'Receiver Name & Address', labelID: 'Nama & Alamat Penerima', type: 'text' },
    { name: 'total_packages', labelEN: 'Total Packages', labelID: 'Jumlah Kemasan', type: 'number' },
    { name: 'cargo_details', labelEN: 'General Cargo Description', labelID: 'Isi Barang Secara Umum', type: 'text' },
    { name: 'weight', labelEN: 'Weight Per Shipment', labelID: 'Berat Per Kiriman', type: 'text' },
    { name: 'document_url', labelEN: 'Upload Manifest', labelID: 'Unggah Manifest', type: 'file' }
  ] },
  { id: 'doc_4_i', textEN: 'RMA (Return Merchandise Authorization)', textID: 'Izin Pengembalian Barang (RMA)', requiresInput: true, fields: [
    { name: 'rma_no', labelEN: 'RMA Number', labelID: 'Nomor RMA', type: 'text' },
    { name: 'dates', labelEN: 'Request & Approval Dates', labelID: 'Tanggal Permohonan & Disetujui', type: 'text' },
    { name: 'do_ref', labelEN: 'Origin DO/Invoice Number', labelID: 'Nomor DO/Invoice Asal', type: 'text' },
    { name: 'customer', labelEN: 'Returner Info', labelID: 'Nama & Alamat Pengembali', type: 'text' },
    { name: 'reason', labelEN: 'Return Reason', labelID: 'Alasan Pengembalian', type: 'text' },
    { name: 'status', labelEN: 'RMA Status', labelID: 'Status RMA', type: 'text' },
    { name: 'item_sku', labelEN: 'Item Code & Name', labelID: 'Kode & Nama Barang', type: 'text' },
    { name: 'qty', labelEN: 'Returned Qty', labelID: 'Jumlah Dikembalikan', type: 'number' },
    { name: 'condition', labelEN: 'Item Condition', labelID: 'Kondisi Barang', type: 'text' },
    { name: 'action', labelEN: 'Further Action', labelID: 'Tindakan Lanjut', type: 'text' },
    { name: 'document_url', labelEN: 'Upload RMA', labelID: 'Unggah RMA', type: 'file' }
  ] },

  // Process 5 Documents
  { id: 'doc_5_a', textEN: 'e-POD (Electronic Proof of Delivery)', textID: 'e-POD (Bukti Serah Terima Elektronik)', requiresInput: true, fields: [
    { name: 'item_details', labelEN: 'Delivered Items List', labelID: 'Daftar Barang Dikirim', type: 'text' },
    { name: 'status', labelEN: 'Receiving Status', labelID: 'Status Penerimaan', type: 'text' },
    { name: 'condition', labelEN: 'Package Condition & Notes', labelID: 'Kondisi Kemasan & Catatan', type: 'text' },
    { name: 'signature', labelEN: 'Digital Signature / OTP', labelID: 'Tanda Tangan Digital / OTP', type: 'text' },
    { name: 'metadata', labelEN: 'Digital Metadata', labelID: 'Metadata Digital', type: 'text' },
    { name: 'document_url', labelEN: 'Upload e-POD / Photo', labelID: 'Unggah e-POD / Foto Bukti', type: 'file' }
  ] },
  { id: 'doc_5_b', textEN: 'Digital Waybill + QR Code', textID: 'Digital Waybill + QR Code', requiresInput: true, fields: [
    { name: 'waybill_no', labelEN: 'Unique Waybill Number', labelID: 'Nomor Unik Waybill', type: 'text' },
    { name: 'dates', labelEN: 'Issue & Expiry Dates', labelID: 'Tanggal Terbit & Masa Berlaku', type: 'text' },
    { name: 'sender', labelEN: 'Sender Details', labelID: 'Pengirim (Nama/Alamat/NPWP)', type: 'text' },
    { name: 'receiver', labelEN: 'Receiver Details', labelID: 'Penerima (Nama/Alamat)', type: 'text' },
    { name: 'route', labelEN: 'Route & Transit Points', labelID: 'Rute & Titik Transit', type: 'text' },
    { name: 'vehicle', labelEN: 'Vehicle & Driver Details', labelID: 'Data Kendaraan & Pengemudi', type: 'text' },
    { name: 'cargo', labelEN: 'Cargo Details & Weight', labelID: 'Rincian Barang & Berat', type: 'text' },
    { name: 'hs_code', labelEN: 'Item Value & HS Code', labelID: 'Nilai Barang & Kode HS', type: 'text' },
    { name: 'instructions', labelEN: 'Special Instructions', labelID: 'Instruksi Khusus', type: 'text' },
    { name: 'signature', labelEN: 'Sender & Carrier Signature', labelID: 'Tanda Tangan Pengirim & Angkut', type: 'text' },
    { name: 'document_url', labelEN: 'Upload Waybill', labelID: 'Unggah Waybill', type: 'file' }
  ] },
  { id: 'doc_5_c', textEN: 'OTP Verification Token', textID: 'Token Verifikasi Sekali Pakai (OTP)', requiresInput: true, fields: [
    { name: 'otp_code', labelEN: 'OTP Code', labelID: 'Kode OTP', type: 'text' },
    { name: 'ref_no', labelEN: 'Reference Number', labelID: 'Nomor Referensi', type: 'text' },
    { name: 'purpose', labelEN: 'Verification Purpose', labelID: 'Tujuan Verifikasi', type: 'text' },
    { name: 'limits', labelEN: 'Attempt & Time Limits', labelID: 'Batas Percobaan & Waktu', type: 'text' },
    { name: 'status', labelEN: 'OTP Status', labelID: 'Status OTP', type: 'text' },
    { name: 'contact', labelEN: 'Receiver Phone/Email', labelID: 'No HP / Email Penerima', type: 'text' },
    { name: 'timestamp', labelEN: 'Verification Time', labelID: 'Waktu Verifikasi', type: 'text' }
  ] },
  { id: 'doc_5_d', textEN: 'Electronic Consignment Note (e-CMR)', textID: 'e-CMR (Catatan Konsinyasi Elektronik)', requiresInput: true, fields: [
    { name: 'package_info', labelEN: 'Package Type & Qty', labelID: 'Jenis & Jumlah Kemasan', type: 'text' },
    { name: 'weight_vol', labelEN: 'Gross/Net Weight & Volume', labelID: 'Berat Kotor/Bersih & Volume', type: 'text' },
    { name: 'value', labelEN: 'Item Value', labelID: 'Nilai Barang', type: 'text' },
    { name: 'danger_goods', labelEN: 'Dangerous Goods (ADR/UN)', labelID: 'Barang Berbahaya (ADR/UN)', type: 'text' },
    { name: 'instructions', labelEN: 'Special Instructions', labelID: 'Instruksi Khusus', type: 'text' },
    { name: 'finance', labelEN: 'Finance & Transport Fees', labelID: 'Keuangan & Biaya Angkut', type: 'text' },
    { name: 'document_url', labelEN: 'Upload e-CMR', labelID: 'Unggah e-CMR', type: 'file' }
  ] },

  // Process 6 Documents
  { id: 'doc_6_a', textEN: '3PL Inbound Delivery Note', textID: 'Catatan Pengiriman Masuk 3PL', requiresInput: true, fields: [
    { name: 'inbound_no', labelEN: 'Sequence Number', labelID: 'Nomor Urut', type: 'text' },
    { name: 'item_sku', labelEN: 'Item Code / SKU', labelID: 'Kode Barang / SKU', type: 'text' },
    { name: 'item_name', labelEN: 'Item Name & Specs', labelID: 'Nama Barang & Spesifikasi', type: 'text' },
    { name: 'qty', labelEN: 'Delivered Qty & Unit', labelID: 'Jumlah Dikirim & Satuan', type: 'text' },
    { name: 'package', labelEN: 'Package Type & Qty', labelID: 'Jenis & Jumlah Kemasan', type: 'text' },
    { name: 'weight', labelEN: 'Weight & Volume per Item', labelID: 'Berat & Volume per Item', type: 'text' },
    { name: 'batch_no', labelEN: 'Batch / Serial Number', labelID: 'Nomor Batch / Seri', type: 'text' },
    { name: 'handling', labelEN: 'Handling Notes', labelID: 'Keterangan Penanganan', type: 'text' },
    { name: 'document_url', labelEN: 'Upload Inbound Note', labelID: 'Unggah Catatan Inbound', type: 'file' }
  ] },
  { id: 'doc_6_b', textEN: 'Advance Shipping Notice (ASN)', textID: 'Pemberitahuan Pengiriman Awal (ASN)', requiresInput: true, fields: [
    { name: 'asn_items', labelEN: 'Full Items List', labelID: 'Daftar Lengkap Barang', type: 'text' },
    { name: 'package', labelEN: 'Package Identity', labelID: 'Identitas Kemasan', type: 'text' },
    { name: 'weight', labelEN: 'Gross/Net Weight & Volume', labelID: 'Berat Kotor/Bersih & Volume', type: 'text' },
    { name: 'route', labelEN: 'Origin & Destination', labelID: 'Lokasi Asal & Tujuan', type: 'text' },
    { name: 'extra_data', labelEN: 'Extra Data (Serial/Batch)', labelID: 'Data Tambahan (Seri/Batch)', type: 'text' },
    { name: 'metadata', labelEN: 'Submission Metadata', labelID: 'Metadata Pengiriman Data', type: 'text' },
    { name: 'document_url', labelEN: 'Upload ASN', labelID: 'Unggah ASN', type: 'file' }
  ] },
  { id: 'doc_6_c', textEN: 'Transfer Letter (STO)', textID: 'Surat Jalan Pindahan (STO)', requiresInput: true, fields: [
    { name: 'sto_no', labelEN: 'STO Number', labelID: 'Nomor STO', type: 'text' },
    { name: 'item_sku', labelEN: 'Item Code / SKU', labelID: 'Kode Barang / SKU', type: 'text' },
    { name: 'item_name', labelEN: 'Item Name', labelID: 'Nama Barang', type: 'text' },
    { name: 'qty', labelEN: 'Transferred Qty', labelID: 'Jumlah Dipindah', type: 'number' },
    { name: 'unit', labelEN: 'Unit', labelID: 'Satuan', type: 'text' },
    { name: 'condition', labelEN: 'Item Condition', labelID: 'Kondisi Barang', type: 'text' },
    { name: 'batch_no', labelEN: 'Batch / Serial Number', labelID: 'Nomor Batch / Seri', type: 'text' },
    { name: 'document_url', labelEN: 'Upload STO', labelID: 'Unggah STO', type: 'file' }
  ] },
  { id: 'doc_6_d', textEN: '3PL Contract Agreement', textID: 'Perjanjian Kerjasama 3PL', requiresInput: true, fields: [
    { name: 'contract_no', labelEN: 'Contract Number', labelID: 'Nomor Kontrak', type: 'text' },
    { name: 'dates', labelEN: 'Validity Dates', labelID: 'Tanggal Berlaku & Berakhir', type: 'text' },
    { name: 'parties', labelEN: 'Parties & Representatives', labelID: 'Nama Pihak & Wakil Sah', type: 'text' },
    { name: 'scope', labelEN: 'Scope of Service', labelID: 'Ruang Lingkup Layanan', type: 'text' },
    { name: 'terms_storage', labelEN: 'Storage Terms', labelID: 'Ketentuan Penyimpanan', type: 'text' },
    { name: 'terms_transport', labelEN: 'Transport Terms', labelID: 'Ketentuan Pengangkutan', type: 'text' },
    { name: 'rates', labelEN: 'Rate Structure', labelID: 'Struktur Tarif', type: 'text' },
    { name: 'sla', labelEN: 'SLA (Service Level)', labelID: 'SLA (Tingkat Layanan)', type: 'text' },
    { name: 'liability', labelEN: 'Risk Liability & Insurance', labelID: 'Tanggung Jawab Risiko & Asuransi', type: 'text' },
    { name: 'document_url', labelEN: 'Upload Contract', labelID: 'Unggah Kontrak', type: 'file' }
  ] },
  { id: 'doc_6_e', textEN: 'Stock Reconciliation Report', textID: 'Laporan Rekonsiliasi Stok', requiresInput: true, fields: [
    { name: 'item_sku', labelEN: 'Item Code / SKU', labelID: 'Kode Barang / SKU', type: 'text' },
    { name: 'item_name', labelEN: 'Item Name & Unit', labelID: 'Nama Barang & Satuan', type: 'text' },
    { name: 'stock_system', labelEN: 'System Stock', labelID: 'Stok Sistem', type: 'number' },
    { name: 'stock_physical', labelEN: 'Physical Stock', labelID: 'Stok Fisik', type: 'number' },
    { name: 'diff', labelEN: 'Difference (+/-)', labelID: 'Selisih (+/-)', type: 'number' },
    { name: 'diff_percent', labelEN: 'Difference Percentage', labelID: 'Persentase Selisih', type: 'text' },
    { name: 'reason', labelEN: 'Reason for Difference', labelID: 'Alasan Selisih', type: 'text' },
    { name: 'action', labelEN: 'Corrective Action', labelID: 'Tindakan Perbaikan', type: 'text' },
    { name: 'document_url', labelEN: 'Upload Recon Report', labelID: 'Unggah Laporan Recon', type: 'file' }
  ] },
  { id: 'doc_6_f', textEN: 'Material Damage Report', textID: 'Laporan Kerusakan Barang', requiresInput: true, fields: [
    { name: 'item_sku', labelEN: 'Item Code / SKU', labelID: 'Kode Barang / SKU', type: 'text' },
    { name: 'item_name', labelEN: 'Item Name', labelID: 'Nama Barang', type: 'text' },
    { name: 'damage_qty', labelEN: 'Damaged/Lost Qty', labelID: 'Jumlah Rusak/Hilang', type: 'number' },
    { name: 'damage_type', labelEN: 'Damage Type', labelID: 'Jenis Kerusakan', type: 'text' },
    { name: 'cause', labelEN: 'Cause of Damage', labelID: 'Penyebab Kerusakan', type: 'text' },
    { name: 'value', labelEN: 'Estimated Loss Value', labelID: 'Estimasi Kerugian', type: 'number' },
    { name: 'document_url', labelEN: 'Upload Damage Report & Photo', labelID: 'Unggah Laporan & Foto', type: 'file' }
  ] },
  { id: 'doc_6_g', textEN: 'Shipping Order (SO)', textID: 'Perintah Pengiriman (SO)', requiresInput: true, fields: [
    { name: 'so_no', labelEN: 'SO Number', labelID: 'Nomor SO', type: 'text' },
    { name: 'item_sku', labelEN: 'Item Code / SKU', labelID: 'Kode Barang / SKU', type: 'text' },
    { name: 'item_name', labelEN: 'Item Name', labelID: 'Nama Barang', type: 'text' },
    { name: 'qty', labelEN: 'Delivered Qty', labelID: 'Jumlah Dikirim', type: 'number' },
    { name: 'instructions', labelEN: 'Special Instructions', labelID: 'Instruksi Khusus', type: 'text' },
    { name: 'transport', labelEN: 'Transport Data & Cost', labelID: 'Data Pengangkutan & Estimasi Biaya', type: 'text' },
    { name: 'document_url', labelEN: 'Upload SO', labelID: 'Unggah SO', type: 'file' }
  ] },
  { id: 'doc_6_h', textEN: '3PL Shipping Manifest', textID: 'Daftar Muatan Pengiriman 3PL', requiresInput: true, fields: [
    { name: 'manifest_no', labelEN: 'Shipment Sequence', labelID: 'Nomor Urut Kiriman', type: 'text' },
    { name: 'ref_no', labelEN: 'DO/Receipt/SO Number', labelID: 'Nomor DO/Resi/SO', type: 'text' },
    { name: 'client', labelEN: 'Client/Owner Name', labelID: 'Nama Klien/Pemilik', type: 'text' },
    { name: 'parties', labelEN: 'Sender & Receiver Names', labelID: 'Nama Pengirim & Penerima', type: 'text' },
    { name: 'cargo', labelEN: 'Cargo Details', labelID: 'Rincian Isi Barang', type: 'text' },
    { name: 'packages', labelEN: 'Total Packages', labelID: 'Jumlah Kemasan', type: 'number' },
    { name: 'weight_value', labelEN: 'Weight & Value', labelID: 'Berat & Nilai', type: 'text' },
    { name: 'destination', labelEN: 'Unloading Destination', labelID: 'Tujuan Bongkar', type: 'text' },
    { name: 'document_url', labelEN: 'Upload Manifest', labelID: 'Unggah Manifest', type: 'file' }
  ] },
  { id: 'doc_6_i', textEN: 'Delivery Note & POD', textID: 'Surat Jalan & POD', requiresInput: true, fields: [
    { name: 'surat_jalan_no', labelEN: 'Delivery Note No & Date', labelID: 'Nomor Surat Jalan & Tanggal', type: 'text' },
    { name: 'parties', labelEN: 'Sender, Owner, Receiver Data', labelID: 'Data Pengirim, Pemilik, Penerima', type: 'text' },
    { name: 'vehicle', labelEN: 'Vehicle & Driver Details', labelID: 'Data Kendaraan & Pengemudi', type: 'text' },
    { name: 'item_details', labelEN: 'Item Details', labelID: 'Rincian Barang', type: 'text' },
    { name: 'pod_details', labelEN: 'POD Data (Time, Location, Status)', labelID: 'Data POD (Waktu, Lokasi, Konfirmasi)', type: 'text' },
    { name: 'signature', labelEN: 'Receiver Signature & Stamp', labelID: 'Tanda Tangan & Cap Penerima', type: 'text' },
    { name: 'document_url', labelEN: 'Upload Delivery Note & POD', labelID: 'Unggah Surat Jalan & POD', type: 'file' }
  ] },
  { id: 'doc_6_j', textEN: 'Logistics Invoice', textID: 'Faktur Tagihan Logistik (Invoice)', requiresInput: true, fields: [
    { name: 'storage_fee', labelEN: 'Storage Fee', labelID: 'Biaya Penyimpanan', type: 'number' },
    { name: 'transport_fee', labelEN: 'Transport Fee', labelID: 'Biaya Pengangkutan', type: 'number' },
    { name: 'extra_fee', labelEN: 'Additional Fees', labelID: 'Biaya Tambahan', type: 'number' },
    { name: 'taxes', labelEN: 'Taxes & Deductions', labelID: 'Pajak & Potongan', type: 'number' },
    { name: 'total_fee', labelEN: 'Total Invoice Amount', labelID: 'Total Tagihan', type: 'number' },
    { name: 'amount_words', labelEN: 'Amount in Words', labelID: 'Terbilang', type: 'text' },
    { name: 'bank_account', labelEN: 'Payment Bank Account', labelID: 'Rekening Pembayaran', type: 'text' },
    { name: 'document_url', labelEN: 'Upload Invoice', labelID: 'Unggah Invoice', type: 'file' }
  ] },
  { id: 'doc_6_k', textEN: 'Billing Statement', textID: 'Laporan Penagihan (Billing Statement)', requiresInput: true, fields: [
    { name: 'ref_no', labelEN: 'Transaction Ref Number', labelID: 'Nomor Referensi Transaksi', type: 'text' },
    { name: 'date', labelEN: 'Service Date', labelID: 'Tanggal Layanan', type: 'date' },
    { name: 'service_type', labelEN: 'Service Type', labelID: 'Jenis Layanan', type: 'text' },
    { name: 'volume', labelEN: 'Unit/Volume Count', labelID: 'Jumlah Unit/Volume', type: 'number' },
    { name: 'rate', labelEN: 'Unit Rate', labelID: 'Tarif Satuan', type: 'number' },
    { name: 'amount_per_trans', labelEN: 'Transaction Amount', labelID: 'Nilai Tagihan Transaksi', type: 'number' },
    { name: 'total_amount', labelEN: 'Total Period Amount', labelID: 'Total Tagihan Periode', type: 'number' },
    { name: 'status', labelEN: 'Payment Status', labelID: 'Status Pembayaran', type: 'text' },
    { name: 'prev_balance', labelEN: 'Previous Balance', labelID: 'Saldo Sebelumnya', type: 'number' },
    { name: 'document_url', labelEN: 'Upload Billing Statement', labelID: 'Unggah Billing Statement', type: 'file' }
  ] }
];

export const initialTasks = [
  { id: 'ORD-1001', title: 'Telecom Site 4A Upgrades', stage: 'cpo_esta', system: 'boq', priority: 'High', assignee: 'John D.', checklistState: {} },
  { 
    id: 'ORD-1002', 
    title: 'Radio Network Expansion Project', 
    stage: 'vc_wbs', 
    system: 'sap', 
    priority: 'Medium', 
    assignee: 'Sarah K.', 
    checklistState: { 
      chk_1: true, 
      chk_2: { completed: true, data: { vc_number: 'VC-882199', wbs_code: 'WBS-NW-772', esta_po: 'PO-5512' } } 
    } 
  },
  { 
    id: 'ORD-1003', 
    title: 'Fiber Optic Cable Batch A', 
    stage: 'review_stock', 
    system: 'sap', 
    priority: 'High', 
    assignee: 'Mike T.', 
    checklistState: { 
      chk_1: true, 
      chk_2: { completed: true, data: { vc_number: 'VC-100455', wbs_code: 'WBS-NW-110', esta_po: 'PO-9922' } }, 
      chk_3: { completed: true, data: { partner_name: 'Acme Logistics', customer_contact: 'support@acme.com', planned_date: '2024-01-15' } }, 
      chk_6: true 
    } 
  },
  { 
    id: 'ORD-1004', 
    title: 'Server Racks Distribution', 
    stage: 'premium_proposal', 
    system: 'premium', 
    priority: 'Low', 
    assignee: 'Anna W.', 
    checklistState: { 
      chk_1: true, 
      chk_2: { completed: true, data: { vc_number: 'VC-990234', wbs_code: 'WBS-NW-330', esta_po: 'PO-1134' } }, 
      chk_3: { completed: true, data: { partner_name: 'TechFlow Corp', customer_contact: 'admin@techflow.com', planned_date: '2024-02-10' } }, 
      chk_4: true, 
      chk_5: true 
    } 
  },
  { 
    id: 'ORD-1005', 
    title: 'Backup Generators Setup', 
    stage: 'release_inquiry', 
    system: 'premium', 
    priority: 'Medium', 
    assignee: 'David L.', 
    checklistState: Object.fromEntries(clarificationChecklist.map(c => {
      if (c.id === 'chk_2') return [c.id, { completed: true, data: { vc_number: 'VC-8899', wbs_code: 'WBS-01', esta_po: 'PO-111' } }];
      if (c.id === 'chk_3') return [c.id, { completed: true, data: { partner_name: 'GenSys', customer_contact: 'bob@gensys.com', planned_date: '2024-03-01' } }];
      if (c.id === 'cc_9') return [c.id, { completed: true, data: { permit_number: 'IMP-2024-001', permit_expiry: '2025-01-01' } }];
      if (c.id === 'eid_5') return [c.id, { completed: true, data: { obd_number: 'OBD-500', courier_name: 'FedEx' } }];
      if (c.id === 'post_8') return [c.id, { completed: true, data: { awb_number: 'AWB-100', eta_date: '2024-03-10' } }];
      return [c.id, true];
    })) 
  },
  { 
    id: 'ORD-1006', 
    title: 'Cooling Systems Q3', 
    stage: 'po_creation', 
    system: 'sap', 
    priority: 'High', 
    assignee: 'Lisa M.', 
    checklistState: Object.fromEntries(clarificationChecklist.map(c => {
      if (c.id === 'chk_2') return [c.id, { completed: true, data: { vc_number: 'VC-5544', wbs_code: 'WBS-88', esta_po: 'PO-332' } }];
      if (c.id === 'chk_3') return [c.id, { completed: true, data: { partner_name: 'CoolTech', customer_contact: 'sarah@cooltech.com', planned_date: '2024-04-15' } }];
      if (c.id === 'cc_9') return [c.id, { completed: true, data: { permit_number: 'IMP-2024-998', permit_expiry: '2024-12-31' } }];
      if (c.id === 'eid_5') return [c.id, { completed: true, data: { obd_number: 'OBD-802', courier_name: 'DHL' } }];
      if (c.id === 'post_8') return [c.id, { completed: true, data: { awb_number: 'AWB-205', eta_date: '2024-04-20' } }];
      return [c.id, true];
    })) 
  },
  { 
    id: 'ORD-1007', 
    title: 'Network Switches Delivery', 
    stage: 'material_calloff', 
    system: 'sap', 
    priority: 'Medium', 
    assignee: 'Tom B.', 
    checklistState: Object.fromEntries(clarificationChecklist.map(c => {
      if (c.id === 'chk_2') return [c.id, { completed: true, data: { vc_number: 'VC-1111', wbs_code: 'WBS-99', esta_po: 'PO-999' } }];
      if (c.id === 'chk_3') return [c.id, { completed: true, data: { partner_name: 'NetSwitch Corp', customer_contact: 'contact@netswitch.com', planned_date: '2024-05-10' } }];
      if (c.id === 'cc_9') return [c.id, { completed: true, data: { permit_number: 'IMP-2024-112', permit_expiry: '2025-05-10' } }];
      if (c.id === 'eid_5') return [c.id, { completed: true, data: { obd_number: 'OBD-900', courier_name: 'UPS' } }];
      if (c.id === 'post_8') return [c.id, { completed: true, data: { awb_number: 'AWB-303', eta_date: '2024-05-15' } }];
      return [c.id, true];
    })) 
  },
];

export const dictionaryTerms = [
  { term: "CPO / ESTA", desc: "Customer Purchase Order / Early Start Technical Approval. The initial request or commercial approval triggering the planning phase." },
  { term: "VC", desc: "Value Contract. The commercial agreement framework in SAP detailing prices and terms." },
  { term: "WBS", desc: "Work Breakdown Structure. Used in SAP to allocate budgets and track costs for specific project segments." },
  { term: "NW", desc: "Network. References the SAP Network number used for project scheduling and execution." },
  { term: "BoQ", desc: "Bill of Quantities. The detailed list of materials, hardware, and services needed for a site." },
  { term: "PP", desc: "Premium Proposal. An advanced system/step where the exact material mapping and site requirements are finalized." },
  { term: "RO", desc: "Rollout Order. The operational plan dictating when and where sites are built." },
  { term: "OCL", desc: "Order Checklist. The verification document ensuring all prerequisites are met before PO creation." },
  { term: "EPC", desc: "Equipment Procurement & Construction. The team responsible for releasing inquiries and creating Purchase Orders." },
  { term: "SLDM", desc: "Supply Logistics Delivery Management. The team managing the actual material flow, warehousing, and delivery call-offs." },
  { term: "LSP", desc: "Logistics Service Provider. The third-party vendor handling transport, customs brokerage, or warehouse operations." },
  { term: "GR / GI", desc: "Goods Receipt / Goods Issue. SAP transactions indicating material entering (GR) or leaving (GI) the warehouse/system." },
  { term: "OBD", desc: "Outbound Delivery. The system document and process for dispatching goods from the warehouse to the site." },
  { term: "POD", desc: "Proof of Delivery. The signed document confirming materials have physically arrived and been accepted at the site." },
  { term: "MR", desc: "Material Request. A formal request to transfer or release specific inventory from the warehouse for a site build." },
  { term: "3PP", desc: "Third Party Provider / Procurement. Pertains to purchasing materials or services from local external vendors rather than internal global hubs." },
  { term: "Process 1: Ordering Preparation", desc: "The very beginning of the supply chain. Focuses on planning, validating budgets (VC/WBS), checking existing stock, and finalizing the Bill of Quantities (BoQ) to create a 100% clarified order." },
  { term: "Process 2: Material Delivery", desc: "The execution phase. This involves releasing inquiries to suppliers, creating actual Purchase Orders (PO), hub activities, and material call-offs." },
  { term: "Process 3: Custom Clearance", desc: "The importation phase. Involves gathering pre-alerts, coordinating with customs brokers (LSP) for declarations, paying duties, and getting the materials released legally." },
  { term: "Process 4: WH Management", desc: "The warehouse operations phase. Includes inbound Goods Receipt (GR), inventory reconciliation, stock adjustments, scrapping, and general capacity governance." },
  { term: "Process 5: EID Last Mile", desc: "The physical dispatch phase. Involves validating Material Requests (MR), creating Outbound Deliveries (OBD), picking/packing in the WMS, Goods Issue (GI), and final transport to the site." },
  { term: "Process 6: Local 3PP Flow", desc: "A specialized alternate workflow for locally sourced materials. Involves sourcing local vendors, forecasting, creating local POs, and managing local deliveries." }
];

export const stageRequirements = {
  'cpo_esta': [],
  'vc_wbs': ['chk_1'],
  'review_stock': ['chk_2', 'chk_3'],
  'premium_proposal': ['chk_4', 'chk_5', 'chk_6'],
  'release_inquiry': ['chk_8', 'chk_9', 'chk_10'],
  'po_creation': ['chk_11'],
  'hub_activities': ['chk_12'],
  'material_calloff': ['doc_2_a', 'doc_2_b', 'doc_2_c', 'doc_2_d', 'doc_2_e'],
  'pre_alert_docs': [],
  'custom_declaration': ['cc_1', 'cc_2', 'cc_9'],
  'custom_payment': ['cc_3', 'cc_4', 'cc_5', 'cc_6'],
  'release_delivery': ['cc_7', 'cc_8', 'cc_10'],
  'wh_inbound': ['cc_11', 'doc_4_a', 'doc_4_b'],
  'wh_inventory': ['wh_1', 'inv_7', 'doc_4_c', 'doc_4_i'],
  'wh_outbound': ['wh_2', 'inv_4', 'acc_1', 'doc_4_d', 'doc_4_e', 'doc_4_f', 'doc_4_g', 'doc_4_h'],
  'eid_planning': ['eid_1', 'eid_2', 'eid_3'],
  'eid_obd': ['eid_4', 'eid_5', 'eid_6'],
  'eid_delivery': ['eid_7', 'eid_8', 'eid_9', 'doc_5_a', 'doc_5_b', 'doc_5_c', 'doc_5_d'],
  'tpp_request': ['tpp_1', 'tpp_2', 'tpp_3', 'tpp_4', 'doc_6_d'],
  'tpp_po': ['tpp_5', 'tpp_6', 'doc_6_b', 'doc_6_g'],
  'tpp_delivery': ['tpp_7', 'tpp_8', 'tpp_9', 'doc_6_a', 'doc_6_c', 'doc_6_e', 'doc_6_f', 'doc_6_h', 'doc_6_i', 'doc_6_j', 'doc_6_k']
};
