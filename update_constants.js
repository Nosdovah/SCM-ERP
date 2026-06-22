const fs = require('fs');
let content = fs.readFileSync('src/data/constants.js', 'utf8');

const newDocsCode = `
  // Process 2 Documents
  { id: 'doc_2_a', text: 'Delivery Order (DO) / Surat Pengantar Pengiriman', requiresInput: true, fields: [
    { name: 'supplier_name', label: 'Kode/Nama Pemasok', type: 'text' },
    { name: 'customer_name', label: 'Kode/Nama Pelanggan', type: 'text' },
    { name: 'delivery_address', label: 'Alamat Tujuan', type: 'text' },
    { name: 'so_po_number', label: 'Nomor SO/PO', type: 'text' },
    { name: 'origin_warehouse', label: 'Kode Gudang Asal', type: 'text' },
    { name: 'courier_name', label: 'Nama Kurir/Ekspedisi', type: 'text' },
    { name: 'vehicle_number', label: 'Plat Nomor Kendaraan', type: 'text' },
    { name: 'seq_number', label: 'Nomor Urut', type: 'text' },
    { name: 'item_sku', label: 'Kode Barang / SKU', type: 'text' },
    { name: 'item_name', label: 'Nama Barang', type: 'text' },
    { name: 'unit', label: 'Satuan Ukuran', type: 'text' },
    { name: 'quantity', label: 'Jumlah Dikirim', type: 'number' },
    { name: 'notes', label: 'Keterangan Tambahan', type: 'text' },
    { name: 'sender_signature', label: 'Tanda Tangan Pengirim', type: 'text' },
    { name: 'receiver_signature', label: 'Tanda Tangan Penerima', type: 'text' },
    { name: 'delivery_terms', label: 'Syarat Pengiriman', type: 'text' },
    { name: 'document_url', label: 'Upload DO Document', type: 'file' }
  ] },
  { id: 'doc_2_b', text: 'Packing List (Daftar Isi Kemasan)', requiresInput: true, fields: [
    { name: 'packing_list_no', label: 'Nomor Packing List', type: 'text' },
    { name: 'do_ref', label: 'Nomor DO Referensi', type: 'text' },
    { name: 'po_ref', label: 'Nomor PO Referensi', type: 'text' },
    { name: 'creation_date', label: 'Tanggal Pembuatan', type: 'date' },
    { name: 'sender_receiver', label: 'Pengirim & Penerima', type: 'text' },
    { name: 'total_packages', label: 'Total Jumlah Kemasan', type: 'number' },
    { name: 'weight_bruto_neto', label: 'Berat Kotor & Bersih', type: 'text' },
    { name: 'dimensions', label: 'Dimensi Total (PxLxT)', type: 'text' },
    { name: 'package_no', label: 'Nomor Kemasan/Kardus', type: 'text' },
    { name: 'item_sku', label: 'Kode Barang', type: 'text' },
    { name: 'item_name', label: 'Nama Barang', type: 'text' },
    { name: 'qty_per_package', label: 'Jumlah per Kemasan', type: 'number' },
    { name: 'unit', label: 'Satuan', type: 'text' },
    { name: 'weight_per_package', label: 'Berat per Kemasan', type: 'text' },
    { name: 'handling_notes', label: 'Keterangan Penanganan', type: 'text' },
    { name: 'packer_signature', label: 'Tanda Tangan Pengepak', type: 'text' },
    { name: 'document_url', label: 'Upload Packing List', type: 'file' }
  ] },
  { id: 'doc_2_c', text: 'Invoice / Faktur Penjualan', requiresInput: true, fields: [
    { name: 'invoice_no', label: 'Nomor Urut / Invoice', type: 'text' },
    { name: 'item_sku', label: 'Kode Barang', type: 'text' },
    { name: 'item_name', label: 'Nama Barang & Spesifikasi', type: 'text' },
    { name: 'quantity', label: 'Jumlah', type: 'number' },
    { name: 'unit', label: 'Satuan', type: 'text' },
    { name: 'unit_price', label: 'Harga Satuan', type: 'number' },
    { name: 'discount', label: 'Diskon', type: 'number' },
    { name: 'total_per_item', label: 'Nilai Total per Barang', type: 'number' },
    { name: 'subtotal', label: 'Subtotal Nilai Barang', type: 'number' },
    { name: 'extra_discount', label: 'Potongan Tambahan', type: 'number' },
    { name: 'extra_fees', label: 'Biaya Tambahan', type: 'number' },
    { name: 'tax', label: 'Pajak (PPN/PPh)', type: 'number' },
    { name: 'total_amount', label: 'Total Tagihan Akhir', type: 'number' },
    { name: 'amount_in_words', label: 'Terbilang', type: 'text' },
    { name: 'document_url', label: 'Upload Invoice', type: 'file' }
  ] },
  { id: 'doc_2_d', text: 'Proof of Delivery (POD)', requiresInput: true, fields: [
    { name: 'item_details', label: 'Rincian Barang Dikirim', type: 'text' },
    { name: 'item_condition', label: 'Kondisi Barang Diterima', type: 'text' },
    { name: 'qty_received', label: 'Jumlah Diterima', type: 'number' },
    { name: 'notes', label: 'Catatan/Keluhan', type: 'text' },
    { name: 'receiver_signature', label: 'Tanda Tangan Penerima', type: 'text' },
    { name: 'receiver_name', label: 'Nama & Jabatan Penerima', type: 'text' },
    { name: 'gps_location', label: 'Lokasi Koordinat GPS', type: 'text' },
    { name: 'document_url', label: 'Upload POD & Foto Bukti', type: 'file' }
  ] },
  { id: 'doc_2_e', text: 'Surat Muatan / Bill of Lading', requiresInput: true, fields: [
    { name: 'vehicle_type', label: 'Jenis Kendaraan', type: 'text' },
    { name: 'vehicle_number', label: 'Plat Nomor', type: 'text' },
    { name: 'driver_info', label: 'Nama & Identitas Pengemudi', type: 'text' },
    { name: 'route', label: 'Rute (Dari - Ke)', type: 'text' },
    { name: 'eta', label: 'Estimasi Waktu Tempuh', type: 'text' },
    { name: 'cargo_details', label: 'Isi Muatan & Berat', type: 'text' },
    { name: 'document_url', label: 'Upload BOL / Surat Jalan', type: 'file' }
  ] },

  // Process 4 Documents
  { id: 'doc_4_a', text: 'Good Receipts Notes (GRN)', requiresInput: true, fields: [
    { name: 'grn_no', label: 'Nomor Urut', type: 'text' },
    { name: 'item_sku', label: 'Kode Barang / SKU', type: 'text' },
    { name: 'item_name', label: 'Nama Barang & Spesifikasi', type: 'text' },
    { name: 'unit', label: 'Satuan', type: 'text' },
    { name: 'qty_diff', label: 'Jumlah Dikirim vs Diterima', type: 'text' },
    { name: 'condition', label: 'Kondisi Barang', type: 'text' },
    { name: 'batch_no', label: 'Nomor Batch / Seri', type: 'text' },
    { name: 'location', label: 'Lokasi Penempatan Awal', type: 'text' },
    { name: 'document_url', label: 'Upload GRN', type: 'file' }
  ] },
  { id: 'doc_4_b', text: 'Put Away List', requiresInput: true, fields: [
    { name: 'put_away_no', label: 'Nomor Urut', type: 'text' },
    { name: 'item_sku', label: 'Kode Barang', type: 'text' },
    { name: 'item_name', label: 'Nama Barang', type: 'text' },
    { name: 'qty', label: 'Jumlah Barang', type: 'number' },
    { name: 'unit', label: 'Satuan', type: 'text' },
    { name: 'origin_loc', label: 'Lokasi Asal', type: 'text' },
    { name: 'dest_loc', label: 'Lokasi Tujuan', type: 'text' },
    { name: 'handling_notes', label: 'Keterangan Penanganan', type: 'text' },
    { name: 'document_url', label: 'Upload Put Away List', type: 'file' }
  ] },
  { id: 'doc_4_c', text: 'Stock Card', requiresInput: true, fields: [
    { name: 'trans_date', label: 'Tanggal & Waktu', type: 'text' },
    { name: 'ref_doc', label: 'Nomor Dokumen Referensi', type: 'text' },
    { name: 'trans_type', label: 'Jenis Transaksi', type: 'text' },
    { name: 'qty_in', label: 'Jumlah Masuk', type: 'number' },
    { name: 'qty_out', label: 'Jumlah Keluar', type: 'number' },
    { name: 'qty_balance', label: 'Sisa Stok', type: 'number' },
    { name: 'batch_no', label: 'Nomor Batch/Seri', type: 'text' },
    { name: 'document_url', label: 'Upload Stock Card', type: 'file' }
  ] },
  { id: 'doc_4_d', text: 'Packing List (WH)', requiresInput: true, fields: [
    { name: 'package_no', label: 'Nomor Kemasan/Kardus', type: 'text' },
    { name: 'item_sku', label: 'Kode Barang', type: 'text' },
    { name: 'item_name', label: 'Nama Barang', type: 'text' },
    { name: 'qty_per_package', label: 'Jumlah Dalam Kemasan', type: 'number' },
    { name: 'unit', label: 'Satuan', type: 'text' },
    { name: 'weight_per_package', label: 'Berat Per Kemasan', type: 'text' },
    { name: 'handling_notes', label: 'Tanda Penanganan', type: 'text' },
    { name: 'document_url', label: 'Upload Packing List', type: 'file' }
  ] },
  { id: 'doc_4_e', text: 'Good Issue (GI)', requiresInput: true, fields: [
    { name: 'gi_no', label: 'Nomor Urut', type: 'text' },
    { name: 'item_sku', label: 'Kode Barang', type: 'text' },
    { name: 'item_name', label: 'Nama Barang', type: 'text' },
    { name: 'unit', label: 'Satuan', type: 'text' },
    { name: 'qty_diff', label: 'Jumlah Diminta vs Dikeluarkan', type: 'text' },
    { name: 'batch_no', label: 'Nomor Batch / Seri', type: 'text' },
    { name: 'location', label: 'Lokasi Pengambilan', type: 'text' },
    { name: 'document_url', label: 'Upload GI', type: 'file' }
  ] },
  { id: 'doc_4_f', text: 'Delivery Order (DO)', requiresInput: true, fields: [
    { name: 'do_no', label: 'Nomor Urut', type: 'text' },
    { name: 'item_sku', label: 'Kode Barang', type: 'text' },
    { name: 'item_name', label: 'Nama Barang & Spesifikasi', type: 'text' },
    { name: 'unit', label: 'Satuan', type: 'text' },
    { name: 'quantity', label: 'Jumlah Dikirim', type: 'number' },
    { name: 'notes', label: 'Keterangan Tambahan', type: 'text' },
    { name: 'document_url', label: 'Upload DO', type: 'file' }
  ] },
  { id: 'doc_4_g', text: 'Proof of Delivery (POD) (WH)', requiresInput: true, fields: [
    { name: 'item_details', label: 'Daftar Barang Dikirim', type: 'text' },
    { name: 'qty_condition', label: 'Konfirmasi Jumlah Diterima', type: 'text' },
    { name: 'condition', label: 'Kondisi Barang', type: 'text' },
    { name: 'notes', label: 'Catatan Keluhan/Persetujuan', type: 'text' },
    { name: 'receiver', label: 'Tanda Tangan & Nama Penerima', type: 'text' },
    { name: 'document_url', label: 'Upload POD & Foto', type: 'file' }
  ] },
  { id: 'doc_4_h', text: 'Shipping Manifest', requiresInput: true, fields: [
    { name: 'manifest_no', label: 'Nomor Urut Kiriman', type: 'text' },
    { name: 'do_ref', label: 'Nomor DO / Resi', type: 'text' },
    { name: 'sender', label: 'Nama & Alamat Pengirim', type: 'text' },
    { name: 'receiver', label: 'Nama & Alamat Penerima', type: 'text' },
    { name: 'total_packages', label: 'Jumlah Kemasan', type: 'number' },
    { name: 'cargo_details', label: 'Isi Barang Secara Umum', type: 'text' },
    { name: 'weight', label: 'Berat Per Kiriman', type: 'text' },
    { name: 'document_url', label: 'Upload Manifest', type: 'file' }
  ] },
  { id: 'doc_4_i', text: 'RMA (Return Merchandise Authorization)', requiresInput: true, fields: [
    { name: 'rma_no', label: 'Nomor RMA', type: 'text' },
    { name: 'dates', label: 'Tanggal Permohonan & Disetujui', type: 'text' },
    { name: 'do_ref', label: 'Nomor DO/Invoice Asal', type: 'text' },
    { name: 'customer', label: 'Nama & Alamat Pengembali', type: 'text' },
    { name: 'reason', label: 'Alasan Pengembalian', type: 'text' },
    { name: 'status', label: 'Status RMA', type: 'text' },
    { name: 'item_sku', label: 'Kode & Nama Barang', type: 'text' },
    { name: 'qty', label: 'Jumlah Dikembalikan', type: 'number' },
    { name: 'condition', label: 'Kondisi Barang', type: 'text' },
    { name: 'action', label: 'Tindakan Lanjut', type: 'text' },
    { name: 'document_url', label: 'Upload RMA', type: 'file' }
  ] },

  // Process 5 Documents
  { id: 'doc_5_a', text: 'e-POD (Electronic Proof of Delivery)', requiresInput: true, fields: [
    { name: 'item_details', label: 'Daftar Barang Dikirim', type: 'text' },
    { name: 'status', label: 'Status Penerimaan', type: 'text' },
    { name: 'condition', label: 'Kondisi Kemasan & Catatan', type: 'text' },
    { name: 'signature', label: 'Tanda Tangan Digital / OTP', type: 'text' },
    { name: 'metadata', label: 'Metadata Digital', type: 'text' },
    { name: 'document_url', label: 'Upload e-POD / Foto Bukti', type: 'file' }
  ] },
  { id: 'doc_5_b', text: 'Digital Waybill + QR Code', requiresInput: true, fields: [
    { name: 'waybill_no', label: 'Nomor Unik Waybill', type: 'text' },
    { name: 'dates', label: 'Tanggal Terbit & Masa Berlaku', type: 'text' },
    { name: 'sender', label: 'Pengirim (Nama/Alamat/NPWP)', type: 'text' },
    { name: 'receiver', label: 'Penerima (Nama/Alamat)', type: 'text' },
    { name: 'route', label: 'Rute & Titik Transit', type: 'text' },
    { name: 'vehicle', label: 'Data Kendaraan & Pengemudi', type: 'text' },
    { name: 'cargo', label: 'Rincian Barang & Berat', type: 'text' },
    { name: 'hs_code', label: 'Nilai Barang & Kode HS', type: 'text' },
    { name: 'instructions', label: 'Instruksi Khusus', type: 'text' },
    { name: 'signature', label: 'Tanda Tangan Pengirim & Angkut', type: 'text' },
    { name: 'document_url', label: 'Upload Waybill', type: 'file' }
  ] },
  { id: 'doc_5_c', text: 'OTP Verification Token', requiresInput: true, fields: [
    { name: 'otp_code', label: 'Kode OTP', type: 'text' },
    { name: 'ref_no', label: 'Nomor Referensi', type: 'text' },
    { name: 'purpose', label: 'Tujuan Verifikasi', type: 'text' },
    { name: 'limits', label: 'Batas Percobaan & Waktu', type: 'text' },
    { name: 'status', label: 'Status OTP', type: 'text' },
    { name: 'contact', label: 'No HP / Email Penerima', type: 'text' },
    { name: 'timestamp', label: 'Waktu Verifikasi', type: 'text' }
  ] },
  { id: 'doc_5_d', text: 'Electronic Consignment Note (e-CMR)', requiresInput: true, fields: [
    { name: 'package_info', label: 'Jenis & Jumlah Kemasan', type: 'text' },
    { name: 'weight_vol', label: 'Berat Kotor/Bersih & Volume', type: 'text' },
    { name: 'value', label: 'Nilai Barang', type: 'text' },
    { name: 'danger_goods', label: 'Barang Berbahaya (ADR/UN)', type: 'text' },
    { name: 'instructions', label: 'Instruksi Khusus', type: 'text' },
    { name: 'finance', label: 'Keuangan & Biaya Angkut', type: 'text' },
    { name: 'document_url', label: 'Upload e-CMR', type: 'file' }
  ] },

  // Process 6 Documents
  { id: 'doc_6_a', text: '3PL Inbound Delivery Note', requiresInput: true, fields: [
    { name: 'inbound_no', label: 'Nomor Urut', type: 'text' },
    { name: 'item_sku', label: 'Kode Barang / SKU', type: 'text' },
    { name: 'item_name', label: 'Nama Barang & Spesifikasi', type: 'text' },
    { name: 'qty', label: 'Jumlah Dikirim & Satuan', type: 'text' },
    { name: 'package', label: 'Jenis & Jumlah Kemasan', type: 'text' },
    { name: 'weight', label: 'Berat & Volume per Item', type: 'text' },
    { name: 'batch_no', label: 'Nomor Batch / Seri', type: 'text' },
    { name: 'handling', label: 'Keterangan Penanganan', type: 'text' },
    { name: 'document_url', label: 'Upload Inbound Note', type: 'file' }
  ] },
  { id: 'doc_6_b', text: 'Advance Shipping Notice (ASN)', requiresInput: true, fields: [
    { name: 'asn_items', label: 'Daftar Lengkap Barang', type: 'text' },
    { name: 'package', label: 'Identitas Kemasan', type: 'text' },
    { name: 'weight', label: 'Berat Kotor/Bersih & Volume', type: 'text' },
    { name: 'route', label: 'Lokasi Asal & Tujuan', type: 'text' },
    { name: 'extra_data', label: 'Data Tambahan (Seri/Batch)', type: 'text' },
    { name: 'metadata', label: 'Metadata Pengiriman Data', type: 'text' },
    { name: 'document_url', label: 'Upload ASN', type: 'file' }
  ] },
  { id: 'doc_6_c', text: 'Surat Jalan Pindahan (STO)', requiresInput: true, fields: [
    { name: 'sto_no', label: 'Nomor STO', type: 'text' },
    { name: 'item_sku', label: 'Kode Barang / SKU', type: 'text' },
    { name: 'item_name', label: 'Nama Barang', type: 'text' },
    { name: 'qty', label: 'Jumlah Dipindah', type: 'number' },
    { name: 'unit', label: 'Satuan', type: 'text' },
    { name: 'condition', label: 'Kondisi Barang', type: 'text' },
    { name: 'batch_no', label: 'Nomor Batch / Seri', type: 'text' },
    { name: 'document_url', label: 'Upload STO', type: 'file' }
  ] },
  { id: 'doc_6_d', text: 'Contract / Perjanjian Kerjasama 3PL', requiresInput: true, fields: [
    { name: 'contract_no', label: 'Nomor Kontrak', type: 'text' },
    { name: 'dates', label: 'Tanggal Berlaku & Berakhir', type: 'text' },
    { name: 'parties', label: 'Nama Pihak & Wakil Sah', type: 'text' },
    { name: 'scope', label: 'Ruang Lingkup Layanan', type: 'text' },
    { name: 'terms_storage', label: 'Ketentuan Penyimpanan', type: 'text' },
    { name: 'terms_transport', label: 'Ketentuan Pengangkutan', type: 'text' },
    { name: 'rates', label: 'Struktur Tarif', type: 'text' },
    { name: 'sla', label: 'SLA (Tingkat Layanan)', type: 'text' },
    { name: 'liability', label: 'Tanggung Jawab Risiko & Asuransi', type: 'text' },
    { name: 'document_url', label: 'Upload Contract', type: 'file' }
  ] },
  { id: 'doc_6_e', text: 'Stock Reconciliation Report', requiresInput: true, fields: [
    { name: 'item_sku', label: 'Kode Barang / SKU', type: 'text' },
    { name: 'item_name', label: 'Nama Barang & Satuan', type: 'text' },
    { name: 'stock_system', label: 'Stok Sistem', type: 'number' },
    { name: 'stock_physical', label: 'Stok Fisik', type: 'number' },
    { name: 'diff', label: 'Selisih (+/-)', type: 'number' },
    { name: 'diff_percent', label: 'Persentase Selisih', type: 'text' },
    { name: 'reason', label: 'Alasan Selisih', type: 'text' },
    { name: 'action', label: 'Tindakan Perbaikan', type: 'text' },
    { name: 'document_url', label: 'Upload Recon Report', type: 'file' }
  ] },
  { id: 'doc_6_f', text: 'Material Damage Report', requiresInput: true, fields: [
    { name: 'item_sku', label: 'Kode Barang / SKU', type: 'text' },
    { name: 'item_name', label: 'Nama Barang', type: 'text' },
    { name: 'damage_qty', label: 'Jumlah Rusak/Hilang', type: 'number' },
    { name: 'damage_type', label: 'Jenis Kerusakan', type: 'text' },
    { name: 'cause', label: 'Penyebab Kerusakan', type: 'text' },
    { name: 'value', label: 'Estimasi Kerugian', type: 'number' },
    { name: 'document_url', label: 'Upload Damage Report & Foto Bukti', type: 'file' }
  ] },
  { id: 'doc_6_g', text: 'Shipping Order (SO)', requiresInput: true, fields: [
    { name: 'so_no', label: 'Nomor SO', type: 'text' },
    { name: 'item_sku', label: 'Kode Barang / SKU', type: 'text' },
    { name: 'item_name', label: 'Nama Barang', type: 'text' },
    { name: 'qty', label: 'Jumlah Dikirim', type: 'number' },
    { name: 'instructions', label: 'Instruksi Khusus', type: 'text' },
    { name: 'transport', label: 'Data Pengangkutan & Estimasi Biaya', type: 'text' },
    { name: 'document_url', label: 'Upload SO', type: 'file' }
  ] },
  { id: 'doc_6_h', text: '3PL Shipping Manifest', requiresInput: true, fields: [
    { name: 'manifest_no', label: 'Nomor Urut Kiriman', type: 'text' },
    { name: 'ref_no', label: 'Nomor DO/Resi/SO', type: 'text' },
    { name: 'client', label: 'Nama Klien/Pemilik', type: 'text' },
    { name: 'parties', label: 'Nama Pengirim & Penerima', type: 'text' },
    { name: 'cargo', label: 'Rincian Isi Barang', type: 'text' },
    { name: 'packages', label: 'Jumlah Kemasan', type: 'number' },
    { name: 'weight_value', label: 'Berat & Nilai', type: 'text' },
    { name: 'destination', label: 'Tujuan Bongkar', type: 'text' },
    { name: 'document_url', label: 'Upload Manifest', type: 'file' }
  ] },
  { id: 'doc_6_i', text: 'Surat Jalan & POD', requiresInput: true, fields: [
    { name: 'surat_jalan_no', label: 'Nomor Surat Jalan & Tanggal', type: 'text' },
    { name: 'parties', label: 'Data Pengirim, Pemilik, Penerima', type: 'text' },
    { name: 'vehicle', label: 'Data Kendaraan & Pengemudi', type: 'text' },
    { name: 'item_details', label: 'Rincian Barang', type: 'text' },
    { name: 'pod_details', label: 'Data POD (Waktu, Lokasi, Konfirmasi)', type: 'text' },
    { name: 'signature', label: 'Tanda Tangan & Cap Penerima', type: 'text' },
    { name: 'document_url', label: 'Upload Surat Jalan & POD', type: 'file' }
  ] },
  { id: 'doc_6_j', text: 'Logistics Invoice', requiresInput: true, fields: [
    { name: 'storage_fee', label: 'Biaya Penyimpanan', type: 'number' },
    { name: 'transport_fee', label: 'Biaya Pengangkutan', type: 'number' },
    { name: 'extra_fee', label: 'Biaya Tambahan', type: 'number' },
    { name: 'taxes', label: 'Pajak & Potongan', type: 'number' },
    { name: 'total_fee', label: 'Total Tagihan', type: 'number' },
    { name: 'amount_words', label: 'Terbilang', type: 'text' },
    { name: 'bank_account', label: 'Rekening Pembayaran', type: 'text' },
    { name: 'document_url', label: 'Upload Invoice', type: 'file' }
  ] },
  { id: 'doc_6_k', text: 'Billing Statement', requiresInput: true, fields: [
    { name: 'ref_no', label: 'Nomor Referensi Transaksi', type: 'text' },
    { name: 'date', label: 'Tanggal Layanan', type: 'date' },
    { name: 'service_type', label: 'Jenis Layanan', type: 'text' },
    { name: 'volume', label: 'Jumlah Unit/Volume', type: 'number' },
    { name: 'rate', label: 'Tarif Satuan', type: 'number' },
    { name: 'amount_per_trans', label: 'Nilai Tagihan Transaksi', type: 'number' },
    { name: 'total_amount', label: 'Total Tagihan Periode', type: 'number' },
    { name: 'status', label: 'Status Pembayaran', type: 'text' },
    { name: 'prev_balance', label: 'Saldo Sebelumnya', type: 'number' },
    { name: 'document_url', label: 'Upload Billing Statement', type: 'file' }
  ] }
`;

const startIndex = content.indexOf('  // Process 2 Documents');
const endIndex = content.indexOf('];', startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  const newContent = content.slice(0, startIndex) + newDocsCode.trim() + '\n' + content.slice(endIndex);
  fs.writeFileSync('src/data/constants.js', newContent);
  console.log('Update successful');
} else {
  console.log('Indices not found');
}
