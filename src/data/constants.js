export const processes = [
  {
    id: 'proc-1',
    titleEN: 'Process 1: Ordering Preparation / Planning',
    titleID: 'Proses 1: Persiapan / Perencanaan Pesanan',
    stages: [
      { id: 'cpo_esta', titleEN: 'CPO/ESTA', titleID: 'CPO/ESTA', subtitleEN: 'Planning/Sales', subtitleID: 'Perencanaan/Penjualan', system: 'boq', systemLabel: 'BOQ/PO', color: '#8b5cf6' },
      { id: 'vc_wbs', titleEN: 'VC & WBS Ordering', titleID: 'Pemesanan VC & WBS', subtitleEN: 'PFA/PP', subtitleID: 'PFA/PP', system: 'sap', systemLabel: 'SAP', color: '#3b82f6' },
      { id: 'review_stock', titleEN: 'Review Stock', titleID: 'Tinjau Stok', subtitleEN: 'MP', subtitleID: 'MP', system: 'sap', systemLabel: 'SAP', color: '#0ea5e9' },
      { id: 'premium_proposal', titleEN: 'BoQ & Premium Proposal', titleID: 'BoQ & Premium Proposal', subtitleEN: 'Solution & Eng.', subtitleID: 'Solusi & Teknis', system: 'premium', systemLabel: 'Premium Proposal', color: '#10b981' },
    ]
  },
  {
    id: 'proc-2',
    titleEN: 'Process 2: Material Delivery',
    titleID: 'Proses 2: Pengiriman Material',
    stages: [
      { id: 'release_inquiry', titleEN: 'Release Inquiry', titleID: 'Rilis Permintaan', subtitleEN: 'EPC', subtitleID: 'EPC', system: 'premium', systemLabel: 'SAP - Premium', color: '#f59e0b' },
      { id: 'po_creation', titleEN: 'PO Creation', titleID: 'Pembuatan PO', subtitleEN: 'EPC', subtitleID: 'EPC', system: 'sap', systemLabel: 'SAP', color: '#f97316' },
      { id: 'hub_activities', titleEN: 'Hub Activities (EAB)', titleID: 'Aktivitas Hub (EAB)', subtitleEN: 'ESH NJ', subtitleID: 'ESH NJ', system: 'sap', systemLabel: 'Hub', color: '#ef4444' },
      { id: 'material_calloff', titleEN: 'Material Call-off', titleID: 'Material Call-off', subtitleEN: 'EPC/SLDM', subtitleID: 'EPC/SLDM', system: 'sap', systemLabel: 'SAP', color: '#dc2626' },
    ]
  },
  {
    id: 'proc-3',
    titleEN: 'Process 3: Custom Clearance',
    titleID: 'Proses 3: Custom Clearance (Pabean)',
    stages: [
      { id: 'pre_alert_docs', titleEN: 'Pre-Alert & Docs', titleID: 'Pre-Alert & Dokumen', subtitleEN: 'Supply/SLDM', subtitleID: 'Supply/SLDM', system: 'customs', systemLabel: 'Documentation', color: '#8b5cf6' },
      { id: 'custom_declaration', titleEN: 'Custom Declaration', titleID: 'Deklarasi Pabean', subtitleEN: 'Broker/LSP', subtitleID: 'Broker/LSP', system: 'customs', systemLabel: 'Brokerage', color: '#3b82f6' },
      { id: 'custom_payment', titleEN: 'Duty & Payment', titleID: 'Pajak & Pembayaran', subtitleEN: 'Customs/Bank', subtitleID: 'Bea Cukai/Bank', system: 'customs', systemLabel: 'Payment', color: '#f59e0b' },
      { id: 'release_delivery', titleEN: 'Release & Delivery', titleID: 'Rilis & Pengiriman', subtitleEN: 'LSP', subtitleID: 'LSP', system: 'sap', systemLabel: 'Logistics', color: '#10b981' },
    ]
  },
  {
    id: 'proc-4',
    titleEN: 'Process 4: WH Management & Last Mile',
    titleID: 'Proses 4: Manajemen Gudang & Last Mile',
    stages: [
      { id: 'wh_inbound', titleEN: 'Inbound & GR', titleID: 'Inbound & GR', subtitleEN: 'LSP/SLDM', subtitleID: 'LSP/SLDM', system: 'sap', systemLabel: 'SAP IM/WMS', color: '#8b5cf6' },
      { id: 'wh_inventory', titleEN: 'Warehouse & Inventory', titleID: 'Gudang & Inventaris', subtitleEN: 'SLDM/DWM', subtitleID: 'SLDM/DWM', system: 'sap', systemLabel: 'SAP IM/WMS', color: '#3b82f6' },
      { id: 'wh_outbound', titleEN: 'Outbound & Last Mile', titleID: 'Outbound & Last Mile', subtitleEN: 'LSP/EPC', subtitleID: 'LSP/EPC', system: 'sap', systemLabel: 'SAP IM/WMS', color: '#10b981' }
    ]
  },
  {
    id: 'proc-5',
    titleEN: 'Process 5: EID Last Mile',
    titleID: 'Proses 5: EID Last Mile',
    stages: [
      { id: 'eid_planning', titleEN: 'MR Validation', titleID: 'Validasi MR', subtitleEN: 'IM/EPC', subtitleID: 'IM/EPC', system: 'sap', systemLabel: 'SAP', color: '#8b5cf6' },
      { id: 'eid_obd', titleEN: 'OBD Creation', titleID: 'Pembuatan OBD', subtitleEN: 'EPC', subtitleID: 'EPC', system: 'sap', systemLabel: 'SAP', color: '#3b82f6' },
      { id: 'eid_delivery', titleEN: 'Pick, Pack & Deliver', titleID: 'Ambil, Kemas & Kirim', subtitleEN: 'WH', subtitleID: 'WH', system: 'sap', systemLabel: 'WMS', color: '#10b981' }
    ]
  },
  {
    id: 'proc-6',
    titleEN: 'Process 6: Local 3PP Flow',
    titleID: 'Proses 6: Alur 3PP Lokal',
    stages: [
      { id: 'tpp_request', titleEN: 'Request & Validate', titleID: 'Permintaan & Validasi', subtitleEN: 'Supply Local', subtitleID: 'Pasokan Lokal', system: 'boq', systemLabel: 'Sourcing', color: '#f59e0b' },
      { id: 'tpp_po', titleEN: 'Create/Change PO', titleID: 'Buat/Ubah PO', subtitleEN: 'Supply Local & EPC', subtitleID: 'Pasokan Lokal & EPC', system: 'sap', systemLabel: 'SAP', color: '#ef4444' },
      { id: 'tpp_delivery', titleEN: 'Delivery & GR Posting', titleID: 'Pengiriman & GR', subtitleEN: 'Supply Local', subtitleID: 'Pasokan Lokal', system: 'sap', systemLabel: 'SAP', color: '#dc2626' }
    ]
  }
];

export const clarificationChecklist = [
  { id: 'chk_1', textEN: 'Verify 100% clarified order & provide feedback to ASR/Core-3+', textID: 'Verifikasi 100% order dan berikan feedback ke ASR/Core-3+' },
  { 
    id: 'chk_2', 
    textEN: 'Request/Check Value Contract, FAS, ESTA#/PO# & NN/WBS for Ordering',
    textID: 'Permintaan/Cek Value Contract, FAS, ESTA#/PO# & NN/WBS untuk Pemesanan',
    requiresInput: true,
    fields: [
      { name: 'vc_number', labelEN: 'Value Contract (VC)', labelID: 'Value Contract (VC)', type: 'text', placeholder: 'e.g. VC-100293' },
      { name: 'wbs_code', labelEN: 'WBS Code', labelID: 'Kode WBS', type: 'text', placeholder: 'e.g. WBS-XYZ-99' },
      { name: 'esta_po', labelEN: 'ESTA / PO Number', labelID: 'Nomor ESTA / PO', type: 'text', placeholder: 'e.g. PO-5001' }
    ]
  },
  { 
    id: 'chk_3', 
    textEN: 'Update Order Plan, Partner/Customer info in PP',
    textID: 'Update Rencana Pesanan, info Partner/Pelanggan di PP',
    requiresInput: true,
    fields: [
      { name: 'partner_name', labelEN: 'Partner Name', labelID: 'Nama Partner', type: 'text', placeholder: 'e.g. Acme Corp' },
      { name: 'customer_contact', labelEN: 'Customer Contact', labelID: 'Kontak Pelanggan', type: 'text', placeholder: 'e.g. john@acme.com' },
      { name: 'planned_date', labelEN: 'Planned Date', labelID: 'Tanggal Direncanakan', type: 'date' }
    ]
  },
  { id: 'chk_4', textEN: 'Checking with solution for type site availability in Premium Proposal', textID: 'Pengecekan dengan solusi untuk ketersediaan tipe site di Premium Proposal' },
  { id: 'chk_5', textEN: 'NIF file preparation', textID: 'Persiapan file NIF' },
  { id: 'chk_6', textEN: 'Checking existing available stock to decide partially or fully order', textID: 'Pengecekan stok tersedia untuk memutuskan pemesanan sebagian atau penuh' },
  { id: 'chk_7', textEN: 'Perform Material Borrow or Transfer for available stock', textID: 'Lakukan Peminjaman Material atau Transfer untuk stok yang tersedia' },
  { id: 'chk_8', textEN: 'Request and assess RO Plan for Batching order', textID: 'Permintaan dan evaluasi RO Plan untuk pemesanan Batch' },
  { id: 'chk_9', textEN: 'Request/Create Premium Proposal Ordering (Mapping SKU & Qty)', textID: 'Permintaan/Buat Pemesanan Premium Proposal (Pemetaan SKU & Qty)' },
  { id: 'chk_10', textEN: 'Checking the Premium proposal ordering (Clarified Order)', textID: 'Pengecekan pemesanan Premium proposal (Order Terklarifikasi)' },
  { id: 'chk_11', textEN: 'Request PR/PO Creation to ROD for Import material', textID: 'Permintaan Pembuatan PR/PO ke ROD untuk material Impor' },
  { id: 'chk_12', textEN: 'Escalation to PFM or Solution Architect if Order failed to create', textID: 'Eskalasi ke PFM atau Solution Architect jika pembuatan Order gagal' },
  { id: 'cc_1', textEN: 'Received Pre alert', textID: 'Menerima Pre-alert' },
  { id: 'cc_2', textEN: 'Review shipping documents', textID: 'Review dokumen pengiriman' },
  { id: 'cc_3', textEN: 'Send shipping document to customs brokerage, coordinating and monitoring', textID: 'Kirim dokumen pengiriman ke pialang bea cukai, koordinasi dan pantau' },
  { id: 'cc_4', textEN: 'Custom declaration verifications', textID: 'Verifikasi deklarasi pabean' },
  { id: 'cc_5', textEN: 'Verify the HC code in the import declaration draft and confirm to custom broker', textID: 'Verifikasi kode HC pada draf deklarasi impor dan konfirmasi ke pialang bea cukai' },
  { id: 'cc_6', textEN: 'Coordinate with solutions to collect and share product catalogue/brochure to custom broker', textID: 'Koordinasi dengan solusi untuk mengumpulkan dan membagikan katalog produk ke pialang bea cukai' },
  { id: 'cc_7', textEN: 'Physical visit in customs', textID: 'Kunjungan fisik di bea cukai' },
  { id: 'cc_8', textEN: 'Responsible for custom duty and payment process', textID: 'Bertanggung jawab atas bea masuk dan proses pembayaran' },
  { 
    id: 'cc_9', 
    textEN: 'Import permit',
    textID: 'Izin Impor',
    requiresInput: true,
    fields: [
      { name: 'permit_number', labelEN: 'Permit Number', labelID: 'Nomor Izin', type: 'text', placeholder: 'e.g. IMP-2023-441' },
      { name: 'permit_expiry', labelEN: 'Permit Expiry Date', labelID: 'Tanggal Kadaluarsa Izin', type: 'date' },
      { name: 'document_url', labelEN: 'Upload Import Permit (PDF/Image)', labelID: 'Unggah Izin Impor (PDF/Gambar)', type: 'file' }
    ]
  },
  { id: 'cc_10', textEN: 'Ensure to comply local laws and regulations', textID: 'Pastikan mematuhi hukum dan peraturan setempat' },
  { id: 'cc_11', textEN: 'Arrange delivery from custom to local project WH', textID: 'Atur pengiriman dari pabean ke gudang proyek lokal' },
  { id: 'wh_1', textEN: 'Follow up, GR/GI on time', textID: 'Follow up, Penerimaan (GR)/Pengeluaran (GI) tepat waktu' },
  { id: 'wh_2', textEN: 'Warehouse Priorities Picking & Outbound Activity', textID: 'Prioritas Gudang: Pengambilan & Aktivitas Keluar' },
  { id: 'wh_3', textEN: 'Domestic Transport Priority, Delivery & Approval', textID: 'Prioritas Transportasi Domestik, Pengiriman & Persetujuan' },
  { id: 'wh_4', textEN: 'Operational Escalation', textID: 'Eskalasi Operasional' },
  { id: 'wh_5', textEN: 'Invoicing/LSP billing', textID: 'Penagihan Faktur/Tagihan LSP' },
  { id: 'wh_6', textEN: 'Sox Controls Monthly, Quarterly & Annually', textID: 'Kontrol Sox Bulanan, Kuartalan & Tahunan' },
  { id: 'wh_7', textEN: 'Scrap list proposal based on TG5 Settlement document, follow up, approval and execute', textID: 'Proposal daftar barang rongsok berdasarkan dokumen TG5 Settlement, tindak lanjut, persetujuan dan eksekusi' },
  { id: 'wh_8', textEN: 'Open box inspection', textID: 'Inspeksi buka kemasan' },
  { id: 'wh_9', textEN: 'Conduct monthly KPI meeting - Governance meeting (Performance Analysis)', textID: 'Adakan rapat KPI bulanan - Rapat Tata Kelola (Analisis Kinerja)' },
  { id: 'wh_10', textEN: 'Create inbound orders for customer owned inventory', textID: 'Buat order masuk untuk inventaris milik pelanggan' },
  { id: 'wh_11', textEN: 'Managing GR/IR issues included aged invoices and parked invoices', textID: 'Mengelola masalah GR/IR termasuk faktur lama dan faktur yang ditangguhkan' },
  { id: 'wh_12', textEN: 'Create and Update Supply Chain Cost Last mile', textID: 'Buat dan Update Biaya Supply Chain Last mile' },
  { id: 'inv_1', textEN: 'Update FG report daily and monitor to make sure WM perform GR and GI in timely manner', textID: 'Update laporan FG harian dan pantau untuk memastikan WM melakukan GR dan GI tepat waktu' },
  { id: 'inv_2', textEN: 'Provide stock report to stakeholder', textID: 'Sediakan laporan stok ke pemangku kepentingan' },
  { id: 'inv_3', textEN: 'Create inventory dismantle report material belong to customer', textID: 'Buat laporan inventaris material bongkar milik pelanggan' },
  { id: 'inv_4', textEN: 'Monitor and control stock to maintain FG level and also Aging material', textID: 'Pantau dan kontrol stok untuk menjaga level FG dan juga material Aging' },
  { id: 'inv_5', textEN: 'Inter-warehouse transfer and WBS to WBS transfer to manage stock', textID: 'Transfer antar-gudang dan transfer WBS ke WBS untuk mengelola stok' },
  { id: 'inv_6', textEN: 'Secure effective inventory management, including reconciliation of stock, physical stock take, scrapping and initiation and follow up of return flows.', textID: 'Amankan manajemen inventaris yang efektif, termasuk rekonsiliasi stok, opname fisik, scrap dan inisiasi tindak lanjut arus balik.' },
  { id: 'inv_7', textEN: 'Manage inventory level, control and monitoring GR Inbound Shipment', textID: 'Kelola level inventaris, kontrol dan pantau Pengiriman Masuk (GR)' },
  { id: 'inv_8', textEN: 'Unreserved material from network due to wrong assignment or change request', textID: 'Lepaskan reservasi material dari jaringan akibat kesalahan assignment atau change request' },
  { id: 'inv_9', textEN: 'Arrange delivery material for excess from PO, Dismantle material, transfer order (STO) to customer warehouse', textID: 'Atur pengiriman material sisa dari PO, material bongkar, transfer order (STO) ke gudang pelanggan' },
  { id: 'inv_10', textEN: 'To manage customer specific requirements', textID: 'Mengelola persyaratan khusus pelanggan' },
  { id: 'acc_1', textEN: 'Weekly System Reconciliation', textID: 'Rekonsiliasi Sistem Mingguan' },
  { id: 'acc_2', textEN: 'Monthly Cycle Count', textID: 'Penghitungan Siklus Bulanan' },
  { id: 'acc_3', textEN: 'Yearly Stock Take', textID: 'Opname Stok Tahunan' },
  { id: 'acc_4', textEN: 'Stock Adjustment / Scrap', textID: 'Penyesuaian Stok / Scrap' },
  { id: 'lsp_1', textEN: 'Warehouse capacity setup and control', textID: 'Pengaturan dan kontrol kapasitas gudang' },
  { id: 'lsp_2', textEN: 'Conduct monthly governance meeting', textID: 'Lakukan rapat tata kelola bulanan' },
  { id: 'lsp_3', textEN: 'Follow-up escalation for warehouse operational issue', textID: 'Tindak lanjut eskalasi untuk masalah operasional gudang' },
  { id: 'lsp_4', textEN: 'Vendor RFP Support – Sourcing', textID: 'Dukungan Vendor RFP – Pengadaan' },
  { id: 'lsp_5', textEN: 'Drive operational LSP development', textID: 'Dorong pengembangan operasional LSP' },
  { id: 'post_1', textEN: 'Check EAB HW PO compare with PP Ordering', textID: 'Periksa EAB HW PO dibandingkan dengan Pemesanan PP' },
  { id: 'post_2', textEN: 'Follow-up with EAB ODM/EAB Supplier for RFS dates', textID: 'Follow-up dengan ODM EAB/Pemasok EAB untuk tanggal RFS' },
  { id: 'post_3', textEN: 'Prepare report order and delivery plan (RFS, ETA) tracking reporting to CPM/stakeholders.', textID: 'Siapkan laporan pelacakan rencana pesanan dan pengiriman (RFS, ETA) ke CPM/stakeholders.' },
  { id: 'post_4', textEN: 'Handle pre-escalation and assist formal escalation to improve dates', textID: 'Tangani pra-eskalasi dan bantu eskalasi formal untuk mempercepat tanggal' },
  { id: 'post_5', textEN: 'Prepare Air exemption approval for speed-up delivery', textID: 'Siapkan persetujuan Air exemption untuk pengiriman cepat' },
  { id: 'post_6', textEN: 'Send Call off instruction to EPC according to Project Plan', textID: 'Kirim instruksi Call off ke EPC sesuai dengan Rencana Proyek' },
  { id: 'post_7', textEN: 'Check against One Report whether everything is called off', textID: 'Periksa dengan One Report apakah semuanya telah di-call off' },
  { 
    id: 'post_8', 
    textEN: 'Checking document AWB and record delivery plan',
    textID: 'Pemeriksaan dokumen AWB dan catat rencana pengiriman',
    requiresInput: true,
    fields: [
      { name: 'awb_number', labelEN: 'Air Waybill (AWB) Number', labelID: 'Nomor Air Waybill (AWB)', type: 'text', placeholder: 'e.g. AWB-889922' },
      { name: 'eta_date', labelEN: 'Estimated Time of Arrival (ETA)', labelID: 'Estimasi Kedatangan (ETA)', type: 'date' },
      { name: 'document_url', labelEN: 'Upload AWB Document (PDF/Image)', labelID: 'Unggah Dokumen AWB (PDF/Gambar)', type: 'file' }
    ]
  },
  { id: 'post_9', textEN: 'Follow up with DSP for update ETA and or deviation during shipment', textID: 'Follow up dengan DSP untuk update ETA atau jika ada masalah pengiriman' },
  { id: 'post_10', textEN: 'Inform detail material arrival to stakeholder', textID: 'Informasikan detail kedatangan material ke stakeholder' },
  { id: 'post_11', textEN: 'Provide copy customer PO and material detail sheet to customs officer when requested', textID: 'Berikan salinan PO pelanggan dan detail material ke petugas pabean saat diminta' },
  { id: 'post_12', textEN: 'Monitor custom clearance process', textID: 'Pantau proses Custom Clearance' },
  { id: 'oth_1', textEN: 'Coordinate with Finance for NS target achievements', textID: 'Koordinasi dengan Keuangan untuk pencapaian target NS' },
  { id: 'oth_2', textEN: 'Support Acceptance manager for Invoice submitted (WIP, NS, and Invoice)', textID: 'Dukung Manajer Acceptance untuk Invoice yang dikirim (WIP, NS, dan Faktur)' },
  { id: 'oth_3', textEN: 'Report cost utilize from EAB HW, SW, Warehouse and Delivery to TPM', textID: 'Laporkan penggunaan biaya dari EAB HW, SW, Gudang, dan Pengiriman ke TPM' },
  { id: 'oth_4', textEN: 'Clean up plan cost and any pending transaction in network before TG5', textID: 'Bersihkan plan cost dan transaksi tertunda di jaringan sebelum TG5' },
  { id: 'oth_5', textEN: 'Create form TG5 Project Settlement of Excess Materials, sanity network, clean up remaining stock', textID: 'Buat formulir TG5 Penyelesaian Proyek Material Berlebih, periksa kewarasan jaringan, bersihkan stok tersisa' },
  { id: 'oth_6', textEN: 'Prepare Scrap list proposal based on TG5 Settlement document or quarterly review Ericsson owned material and circulate for approval', textID: 'Siapkan proposal scrap berdasarkan dokumen TG5 Settlement atau kuartalan untuk material milik Ericsson dan edarkan persetujuan' },
  { id: 'oth_7', textEN: 'Request to Return Logistic management to register Scrap material to Product Take Back Management', textID: 'Minta ke Manajemen Logistik Retur untuk mendaftarkan material Scrap ke Product Take Back Management' },
  { id: 'oth_8', textEN: 'Prepare and follow up Supplier statement letter of project closure signed', textID: 'Siapkan dan tindak lanjuti surat pernyataan pemasok tentang penutupan proyek yang ditandatangani' },
  { id: 'oth_9', textEN: 'Arrange delivery material to customer warehouse (dismantle or new material assign for customer warehouse)', textID: 'Atur pengiriman material ke gudang pelanggan (material bongkar atau material baru untuk pelanggan)' },
  { id: 'tpp_1', textEN: 'Vendor development, capacity and capability build', textID: 'Pengembangan vendor, pembangunan kapasitas dan kapabilitas' },
  { id: 'tpp_2', textEN: 'Forecast and shared with Suppliers and Local sourcing', textID: 'Forecast dan bagikan dengan Pemasok dan sumber lokal' },
  { id: 'tpp_3', textEN: 'Initiate request for ordering', textID: 'Inisiasi permintaan pemesanan' },
  { id: 'tpp_4', textEN: 'Validate request/100% clarified order', textID: 'Validasi permintaan/100% pesanan terklarifikasi' },
  { id: 'tpp_5', textEN: 'Request to EPC to execute order', textID: 'Minta EPC untuk eksekusi pesanan' },
  { id: 'tpp_6', textEN: 'Validate & ordering for PO-PR, GR/IR balance, PO closure', textID: 'Validasi & pemesanan PO-PR, saldo GR/IR, penutupan PO' },
  { id: 'tpp_7', textEN: 'Follow up delivery to project WH', textID: 'Follow up pengiriman ke Gudang proyek' },
  { id: 'tpp_8', textEN: 'Manage escalation', textID: 'Mengelola eskalasi' },
  { id: 'tpp_9', textEN: 'Manage share of business', textID: 'Mengelola share of business' },
  { id: 'eid_1', textEN: 'Release WBS/NN and send to IM', textID: 'Rilis WBS/NN dan kirim ke IM' },
  { id: 'eid_2', textEN: 'PP Upload in DPM', textID: 'Unggah PP di DPM' },
  { id: 'eid_3', textEN: 'Create MR and submit to BAM', textID: 'Buat MR dan kirim ke BAM' },
  { id: 'eid_4', textEN: 'MR auto transfer to PDB & Data validation', textID: 'MR auto transfer ke PDB & validasi Data' },
  { 
    id: 'eid_5', 
    textEN: 'Direct/Indirect OBD creation based on WBS evaluation',
    textID: 'Pembuatan OBD Langsung/Tidak Langsung berdasarkan evaluasi WBS',
    requiresInput: true,
    fields: [
      { name: 'obd_number', labelEN: 'Outbound Delivery (OBD) Number', labelID: 'Nomor Outbound Delivery (OBD)', type: 'text', placeholder: 'e.g. OBD-77382' },
      { name: 'courier_name', labelEN: 'Courier Service', labelID: 'Layanan Kurir', type: 'text', placeholder: 'e.g. DHL Express' }
    ]
  },
  { id: 'eid_6', textEN: 'WBS Reservation & Transfer stock (MB1B/CN22)', textID: 'Reservasi WBS & Transfer Stok (MB1B/CN22)' },
  { id: 'eid_7', textEN: 'Send OBD daily report', textID: 'Kirim laporan harian OBD' },
  { id: 'eid_8', textEN: 'Pick and Pack items in Warehouse', textID: 'Pengambilan dan Pengemasan barang di Gudang' },
  { id: 'eid_9', textEN: 'GI in WMS and Deliver to site', textID: 'Pengeluaran (GI) di WMS dan Kirim ke site' },
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
  { term: "CPO / ESTA", desc: "Customer Purchase Order / Early Start Technical Approval. The initial request or commercial approval triggering the planning phase.", descID: "Pesanan Pembelian Pelanggan / Persetujuan Teknis Awal. Permintaan awal atau persetujuan komersial yang memicu fase perencanaan." },
  { term: "VC", desc: "Value Contract. The commercial agreement framework in SAP detailing prices and terms.", descID: "Value Contract (Kontrak Nilai). Kerangka perjanjian komersial di SAP yang merinci harga dan persyaratan." },
  { term: "WBS", desc: "Work Breakdown Structure. Used in SAP to allocate budgets and track costs for specific project segments.", descID: "Work Breakdown Structure (Struktur Rincian Kerja). Digunakan dalam SAP untuk mengalokasikan anggaran dan melacak biaya untuk segmen proyek tertentu." },
  { term: "NW", desc: "Network. References the SAP Network number used for project scheduling and execution.", descID: "Network (Jaringan). Merujuk pada nomor Jaringan SAP yang digunakan untuk penjadwalan dan pelaksanaan proyek." },
  { term: "BoQ", desc: "Bill of Quantities. The detailed list of materials, hardware, and services needed for a site.", descID: "Bill of Quantities (Daftar Kuantitas). Daftar rinci material, perangkat keras, dan layanan yang diperlukan untuk suatu situs (site)." },
  { term: "PP", desc: "Premium Proposal. An advanced system/step where the exact material mapping and site requirements are finalized.", descID: "Premium Proposal (Proposal Premium). Sistem/langkah lanjutan di mana pemetaan material yang tepat dan persyaratan situs diselesaikan." },
  { term: "RO", desc: "Rollout Order. The operational plan dictating when and where sites are built.", descID: "Rollout Order (Pesanan Implementasi). Rencana operasional yang menentukan kapan dan di mana situs dibangun." },
  { term: "OCL", desc: "Order Checklist. The verification document ensuring all prerequisites are met before PO creation.", descID: "Order Checklist (Daftar Periksa Pesanan). Dokumen verifikasi yang memastikan semua prasyarat terpenuhi sebelum pembuatan PO." },
  { term: "EPC", desc: "Equipment Procurement & Construction. The team responsible for releasing inquiries and creating Purchase Orders.", descID: "Equipment Procurement & Construction (Pengadaan & Konstruksi Peralatan). Tim yang bertanggung jawab untuk merilis pertanyaan/inquiry dan membuat Pesanan Pembelian (PO)." },
  { term: "SLDM", desc: "Supply Logistics Delivery Management. The team managing the actual material flow, warehousing, and delivery call-offs.", descID: "Supply Logistics Delivery Management (Manajemen Pengiriman Logistik Pasokan). Tim yang mengelola aliran fisik material, pergudangan, dan instruksi pengiriman (call-off)." },
  { term: "LSP", desc: "Logistics Service Provider. The third-party vendor handling transport, customs brokerage, or warehouse operations.", descID: "Logistics Service Provider (Penyedia Layanan Logistik). Vendor pihak ketiga yang menangani transportasi, perantara pabean, atau operasi gudang." },
  { term: "GR / GI", desc: "Goods Receipt / Goods Issue. SAP transactions indicating material entering (GR) or leaving (GI) the warehouse/system.", descID: "Goods Receipt / Goods Issue (Penerimaan/Pengeluaran Barang). Transaksi SAP yang menunjukkan material masuk (GR) atau keluar (GI) dari gudang/sistem." },
  { term: "OBD", desc: "Outbound Delivery. The system document and process for dispatching goods from the warehouse to the site.", descID: "Outbound Delivery (Pengiriman Keluar). Dokumen sistem dan proses untuk mengirimkan barang dari gudang ke lokasi (site)." },
  { term: "POD", desc: "Proof of Delivery. The signed document confirming materials have physically arrived and been accepted at the site.", descID: "Proof of Delivery (Bukti Pengiriman). Dokumen yang ditandatangani untuk mengonfirmasi bahwa material secara fisik telah tiba dan diterima di situs." },
  { term: "MR", desc: "Material Request. A formal request to transfer or release specific inventory from the warehouse for a site build.", descID: "Material Request (Permintaan Material). Permintaan formal untuk mentransfer atau merilis inventaris spesifik dari gudang untuk pembangunan situs." },
  { term: "3PP", desc: "Third Party Provider / Procurement. Pertains to purchasing materials or services from local external vendors rather than internal global hubs.", descID: "Third Party Provider / Procurement (Penyedia/Pengadaan Pihak Ketiga). Berkaitan dengan pembelian material atau layanan dari vendor eksternal lokal, bukan dari pusat global internal." },
  { term: "Process 1: Ordering Preparation", desc: "The very beginning of the supply chain. Focuses on planning, validating budgets (VC/WBS), checking existing stock, and finalizing the Bill of Quantities (BoQ) to create a 100% clarified order.", descID: "Bagian paling awal dari rantai pasokan. Berfokus pada perencanaan, validasi anggaran (VC/WBS), pemeriksaan stok yang ada, dan penyelesaian Bill of Quantities (BoQ) untuk membuat pesanan yang terklarifikasi 100%." },
  { term: "Process 2: Material Delivery", desc: "The execution phase. This involves releasing inquiries to suppliers, creating actual Purchase Orders (PO), hub activities, and material call-offs.", descID: "Fase pelaksanaan. Ini melibatkan perilisan permintaan ke pemasok, pembuatan Pesanan Pembelian (PO) aktual, aktivitas hub, dan call-off material." },
  { term: "Process 3: Custom Clearance", desc: "The importation phase. Involves gathering pre-alerts, coordinating with customs brokers (LSP) for declarations, paying duties, and getting the materials released legally.", descID: "Fase impor. Melibatkan pengumpulan pra-peringatan, koordinasi dengan pialang pabean (LSP) untuk deklarasi, pembayaran bea, dan mendapatkan rilis material secara hukum." },
  { term: "Process 4: WH Management", desc: "The warehouse operations phase. Includes inbound Goods Receipt (GR), inventory reconciliation, stock adjustments, scrapping, and general capacity governance.", descID: "Fase operasi gudang. Meliputi Penerimaan Barang (GR) inbound, rekonsiliasi inventaris, penyesuaian stok, pemusnahan (scrapping), dan tata kelola kapasitas umum." },
  { term: "Process 5: EID Last Mile", desc: "The physical dispatch phase. Involves validating Material Requests (MR), creating Outbound Deliveries (OBD), picking/packing in the WMS, Goods Issue (GI), and final transport to the site.", descID: "Fase pengiriman fisik. Melibatkan validasi Permintaan Material (MR), pembuatan Pengiriman Keluar (OBD), pengambilan/pengepakan di WMS, Pengeluaran Barang (GI), dan transportasi akhir ke lokasi." },
  { term: "Process 6: Local 3PP Flow", desc: "A specialized alternate workflow for locally sourced materials. Involves sourcing local vendors, forecasting, creating local POs, and managing local deliveries.", descID: "Alur kerja alternatif khusus untuk material yang bersumber secara lokal. Melibatkan pencarian vendor lokal, perkiraan, pembuatan PO lokal, dan pengelolaan pengiriman lokal." }
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
