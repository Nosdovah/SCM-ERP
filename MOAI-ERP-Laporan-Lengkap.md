# LAPORAN LENGKAP — MOAI ERP v2.0
### QA Terpadu · Tutorial Pengguna · Alur Proses Bisnis
**Sistem:** SCM-ERP (MOAI ERP v2.0 — Distributor & Integrator) · **Repo:** `Nosdovah/SCM-ERP`
**Lingkungan:** Lokal — PostgreSQL `moai_erp` (durable) · **Tanggal:** 05 Nov 2026

> Dokumen ini **menggabungkan** tiga artefak: (1) laporan QA end-to-end (bulk + pencatatan), (2) tutorial pengguna per fitur, dan (3) alur proses bisnis — menjadi satu laporan utuh.

---

# BAGIAN 1 — RINGKASAN EKSEKUTIF

MOAI ERP v2.0 adalah sistem supply-chain untuk distributor & integrator komputer (3 kategori: Prebuilt, Barebone, Spare Part) dengan **6 modul, 26 fitur**. Setelah serangkaian perbaikan (PR #13–#18), semua fitur kini:

- ✅ **Backend lengkap** — 26/26 fitur punya endpoint REST.
- ✅ **Frontend terhubung** — semua fitur baca/tulis lewat endpoint (bukan hardcode/localStorage-only).
- ✅ **Form aksi lengkap** — semua fitur yang butuh input punya form/button POST.
- ✅ **Pencatatan rekonsiliasi 2 arah** — saldo ⇄ mutasi selalu cocok (golden rule).

**Verdict:** sistem layak dipakai sebagai *system of record* untuk alur procure-to-pay, plan-to-produce, dan order-to-cash.

---

# BAGIAN 2 — ALUR PROSES BISNIS

```
        PROCURE-TO-PAY (belanja barang)
  Auto Reorder (PR) → Purchase Order → Penerimaan (GRN) → QC PASS/Reject
        │                │                │              │
        ▼                ▼                ▼              ▼
  (2.2) SCM        (2.1) SCM        (2.3) SCM     QC: stok naik + AP Bill (5.2) → Bayar
                                                    Reject → RTV (2.4) / Scrap

        PLAN-TO-PRODUCE (rakit PC)
  Resep BOM (3.1) → Simulator (3.3) → Assembly Order (3.2) → Complete
                                              │  konsumsi komponen (ASM_OUT ×n)
                                              ▼  terima barang jadi (ASM_IN) + Serial
                                              Debundle (3.4) = bongkar balik jadi komponen

        ORDER-TO-CASH (jual & kirim)
  Sales Order (4.1) → Picking (4.2) → Packing (4.3) → Surat Jalan / GI (4.4)
        │                                              │
        ▼                                              ▼
  AR Invoice (5.3) → Bayar                       stok berkurang (GI per baris)

        LAPISAN KONTROL
  Ledger (1.3) · Serial (1.2) · Rack/Bin (1.1) · Transfer/Adjustment (1.4)
  Opname (1.7) · Aging (1.5) · RMA (1.6) · COGS (5.1) · Warranty (5.4)
  Master Data (6) = satu sumber data untuk semua modul
```

**Urutan alami satu siklus:** Master Data → SCM (belanja) → Assembly (rakit) → Outbound (jual) → Finance (bayar) → Inventory (jejak audit).

---

# BAGIAN 3 — TEMUAN QA & STATUS RESOLUSI

## 3.1 Temuan Pencatatan (audit ERP Specialist → **semua terselesaikan**)

| Temuan | Gejala semula | Perbaikan |
|---|---|---|
| T-1 PO-convert | PR 7 item → PO `items_count=1` (hardcode) | **P3**: items terbawa ke PO (items[], items_count, total dari biaya) |
| T-2 SJ/GI single-line | SO 2 baris, hanya baris-1 terkirim (stok ThinkPad tak turun) | **P1**: GI per baris SO + saldo per baris |
| T-3 RTV tanpa efek saldo | `RTV_OUT −1` terekam, stok SSD tetap | **P1**: RTV two-step (DRAFT → ship = RTV_OUT + saldo + credit note) |
| T-4 Assembly tanpa jurnal | konsumsi komponen berubah tanpa `ASM_OUT` | **P2**: build menulis ASM_OUT per komponen, debundle ASM_IN per komponen |
| (rekomendasi) HPP flat 80% | laba tak akurat | **P4**: HPP dari ledger GI (biaya aktual) |

**Dampak finansial yang sempat salah:** aset overstated Rp 30,85 jt + pendapatan overstated Rp 36 jt — kini nol.

## 3.2 Temuan Bulk Test (skenario multi-line → **terselesaikan**)

1. Assembly field BOM mismatch (`sku=None`, stok tak berubah) → multi-BOM + jurnal komponen (PR #13/#15).
2. SJ/GI single-line → GI multi-line + RTV two-step (PR #14).
3. QC hardcode CPU+15 → turunan dari item GRN (PR #13).

## 3.3 Matriks Cakupan Fitur (26/26 — semua fungsional)

| Modul | Fitur | Status |
|---|---|---|
| Inventory | 1.1 Racks · 1.2 Serial · 1.3 Ledger · 1.4 Ops · 1.5 Aging · 1.6 RMA · 1.7 Stock Setup | ✅ semua (aging kini dinamis dari ledger) |
| SCM | 2.1 PO · 2.2 Reorder · 2.3 Receiving/QC · 2.4 Inbound Return · 2.5 Price | ✅ semua (price kini quote store) |
| Assembly | 3.1 BOM · 3.2 Orders · 3.3 Simulator · 3.4 Debundle | ✅ semua (BOM multi-resep) |
| Outbound | 4.1 SO · 4.2 Picking · 4.3 Packing · 4.4 Delivery Notes | ✅ semua (picking persist + single pick) |
| Finance | 5.1 COGS · 5.2 AP · 5.3 AR · 5.4 Warranty | ✅ semua (warranty kini tiket + provisi) |
| Master Data | 6.1 Products · 6.2 Warehouse/Bins · 6.3 Brands · 6.4 Suppliers · 6.5 Clients | ✅ semua (CRUD penuh) |

---

# BAGIAN 4 — TUTORIAL PENGGUNA (semua fitur)

## 4.1 Cara masuk
1. Buka aplikasi (lokal `http://localhost:5174`, produksi `https://scm-erp-pied.vercel.app`).
2. Klik **⚡ Quick Demo Access — PT Kompakom**.
3. Navigasi pakai sidebar; tiap tab punya **deep-link** `#/modul/fitur` (mis. `#/inventory/serials`).

## 4.2 Modul 1 — Inventory & Serial (`#/inventory`)
| Fitur | Cara pakai | Aksi |
|---|---|---|
| 1.1 3 Racks Overview | Tab Overview — lihat rak per bin (PB-A / BB-A / SP-*) | `GET /inventory/balances` |
| 1.2 Serial Registry | Tab Serials — cari SN + form **"+ Daftar Serial"** | `POST /inventory/serials` |
| 1.3 Stock Ledger | Tab Ledger — form **"Catat Mutasi"** (adjust/opening) | `GET/POST /inventory/movements` |
| 1.4 Operations | Tab Operations — transfer antar-bin & adjustment | `POST .../transfers` , `.../adjustments` |
| 1.5 Aging | Tab Aging — bucket umur + idle capital + kelas pergerakan | `GET /inventory/aging` |
| 1.6 RMA | Tab RMA — buka kasus; aksi servis/vendor | `POST /inventory/rma` |
| 1.7 Stock Setup | Tab Operations → Opname — set qty banyak SKU | `POST /inventory/stock-setup` |

## 4.3 Modul 2 — SCM & Inbound QC (`#/scm`)
| Fitur | Cara pakai | Aksi |
|---|---|---|
| 2.1 Purchase Orders | Tab Orders — form "Buat PO" / konversi PR | `POST /scm/purchase-orders`, `.../convert` |
| 2.2 Auto Reorder | Tab Reorder — form **"+ Generate PR"** | `POST /scm/requisitions` |
| 2.3 Receiving & QC | Tab Receiving — form **"+ Buat GRN"** → "Mulai QC" | `POST /scm/goods-receipts`, `qc-inspections/:id/action` |
| 2.4 Inbound Return | Tab Inbound Return — form retur → Ship | `POST /scm/rtv`, `/rtv/:id/ship` |
| 2.5 Price Comparison | Tab Price — form **"+ Tambah Quote"** | `GET/POST /scm/vendor-prices` |

## 4.4 Modul 3 — BOM & Assembly (`#/assembly`)
| Fitur | Cara pakai | Aksi |
|---|---|---|
| 3.1 BOM Recipes | Tab BOM — form **"Tambah Resep"** (target_sku + komponen) | `GET/POST /assembly/boms` |
| 3.2 Assembly Orders | Tab Orders — buat order → **Complete** | `POST /assembly/orders`, `PATCH .../complete` |
| 3.3 Build Simulator | Tab Simulator — cek kecukupan komponen | `POST /assembly/simulate` |
| 3.4 De-bundling | Tab Debundle — bongkar unit jadi komponen | `POST /assembly/debundle` |

## 4.5 Modul 4 — Outbound (`#/outbound`)
| Fitur | Cara pakai | Aksi |
|---|---|---|
| 4.1 Sales Orders | Tab Orders — form "Buat SO" | `POST /outbound/sales-orders` |
| 4.2 Picking (Single/Wave) | Tab Picking — form **"+ Single Pick"** + "Mulai Wave" | `POST /outbound/pick-tasks`, `/wave` |
| 4.3 Packing | Tab Packing — form packing (box/berat) | `POST /outbound/pack-tasks` |
| 4.4 Delivery Notes | Tab Surat Jalan — form "Buat SJ" (auto GI + AR) | `POST /outbound/delivery-notes` |

## 4.6 Modul 5 — Finance (`#/finance`)
| Fitur | Cara pakai | Aksi |
|---|---|---|
| 5.1 HPP/COGS | Tab COGS — roll-up biaya per metode | `GET /finance/cogs` |
| 5.2 AP Bills | Tab AP — **Bayar** tagihan vendor | `POST /finance/ap-bills/:id/pay` |
| 5.3 AR Invoices | Tab AR — **Bayar** tagihan klien | `POST /finance/ar-invoices/:id/pay` |
| 5.4 Warranty | Tab Warranty — form **"+ Buka Tiket"** | `GET/POST /finance/warranty-tickets` |

## 4.7 Modul 6 — Master Data (`#/master-data`)
| Fitur | Cara pakai | Aksi |
|---|---|---|
| 6.1 Products | Tab Products — CRUD produk | `POST/PUT /master/products` |
| 6.2 Warehouse/Bins | Tab Hierarchy — tambah bin, lihat layout | `GET/POST /master/bins` |
| 6.3 Brands | Tab Brands — CRUD | `GET/POST/PUT/DELETE /master/brands` |
| 6.4 Suppliers | Tab Suppliers — CRUD + lead/defect | `.../suppliers` |
| 6.5 Clients | Tab Clients — CRUD + credit limit | `.../clients` |

---

# BAGIAN 5 — ALUR PENGGUNAAN SISTEM

## 5.1 Cerita: Satu Hari dengan MOAI ERP *(untuk orang awam — tanpa istilah teknis)*

**Pagi hari.** Kompakom (toko komputer) mendapat pesanan dari sebuah kantor pemerintah: *"minta 10 unit PC untuk ruang kerja, dikirim minggu ini."* Mbak Rina, admin gudang, membuka sistem. Ia cek **daftar barang** yang tersedia — ternyata beberapa komponen seperti prosesor dan kartu grafis **tinggal sedikit**.

**Sistem yang mengingatkan.** Tanpa diminta, sistem menandai *"stok menipis, harus belanja lagi"*. Mbak Rina tinggal menekan satu tombol → muncul **daftar usulan belanja** (barang apa, berapa banyak). Ia **membandingkan harga** dari beberapa pemasok supaya dapat yang termurah dan tercepat, lalu mengirim **pesanan pembelian** ke pemasok terpilih.

**Barang datang.** Ketika truk pemasok tiba, barang **diperiksa dulu** (dicek fisiknya, dites). Yang lolos **masuk ke rak gudang** — dan stoknya **naik sendiri secara otomatis**, lengkap dengan catatan "barang ini masuk kapan, dari pemasok mana, berapa". Yang rusak **dikembalikan** ke pemasok.

**Merakit PC.** Tim teknisi mengambil komponen dari rak dan **merakit 10 PC sesuai "resep"** yang sudah tersimpan. Selesai satu PC, otomatis muncul **nomor seri unik** untuk tiap unit — seperti nomor rangka kendaraan, jadi tiap PC bisa dilacak satu per satu.

**Mengirim pesanan.** Petugas **mengambil barang** dari rak sesuai pesanan, **membungkus**, lalu **mengirim** ke alamat kantor. Begitu dikirim, **stok otomatis berkurang** dan **tagihan ke pelanggan** langsung terbit.

**Uang masuk.** Pelanggan membayar → catatan **uang masuk** tersimpan. Tagihan ke pemasok juga **dibayar** — semuanya tercatat rapi.

**Jaga agar tetap benar.** Akhir bulan, Mbak Rina **menghitung ulang fisik barang** (opname) — kalau ada selisih sedikit, langsung dikoreksi. Barang yang lama mengendap di gudang **diberi tanda "sudah lama, segera jual/diskon"**. Barang rusak dari pelanggan dicatat sebagai **retur/garansi**. Dan setiap saat, bos bisa melihat: *"stok sekarang segini, karena kemarin masuk 20 dan keluar 10"* — karena **setiap barang masuk dan keluar selalu tercatat, dan catatannya tidak bisa diubah seenaknya**.

> **Intinya:** sistem ini seperti "kasir + buku catatan + gudang" dalam satu aplikasi — tidak perlu menghafal istilah asing. Barang masuk, barang keluar, uang masuk, uang keluar — semua tercatat otomatis dan bisa ditelusuri kapan pun.

## 5.2 Referensi Teknis — Rincian Fitur per Langkah *(untuk pelaksana/auditor)*

*(setiap langkah menyebut titik fitur `X.Y` beserta nama fiturnya)*

**FASE A — Setup Master Data**
1. **6.1 Products Catalog** — pastikan SKU (prebuilt / barebone / spare-part) terdaftar dengan HPP & harga jual.
2. **6.2 Warehouse & Bins** — pastikan layout gudang → zona → bin (PB-A, SP-CPU-A, QC-IN-01, dst.).
3. **6.3 Brands · 6.4 Suppliers · 6.5 Clients** — daftar brand, supplier (lead time + defect rate), dan klien (segmen + credit limit).
4. **1.1 3 Racks Overview** — cek occupancy awal rak Prebuilt / Barebone / Spare-part.

**FASE B — Procure-to-Pay (belanja barang)**
5. **2.2 Auto Reorder** — generate **Purchase Requisition (PR)** saat stok di bawah reorder point.
6. **2.5 Price Comparison** — bandingkan harga multi-vendor sebelum menetapkan supplier.
7. **2.1 Purchase Orders** — konversi PR → **Purchase Order (PO)**, lalu setujui.
8. **2.3 Receiving & QC Gate** — buat **GRN** (penerimaan) → **Inspeksi QC** → PASS (atau Reject).
9. **5.2 AP Bills** — **AP Bill** vendor otomatis terbit dari hasil QC → **Bayar**.
10. *(otomatis)* **1.3 Stock Ledger** — mutasi `QC_RELEASE` menambah saldo komponen.

**FASE C — Plan-to-Produce (rakit PC)**
11. **3.1 BOM Recipes** — pilih resep perakitan (mis. Ares Elite / Office Pro).
12. **3.3 Build Simulator** — cek kecukupan komponen untuk qty target.
13. **3.2 Assembly Orders** — buat **Assembly Order** → **Complete** (konsumsi komponen = `ASM_OUT`, terima barang jadi = `ASM_IN`).
14. **1.2 Serial Registry** — serial number baru terdaftar otomatis untuk unit rakit.
15. **3.4 De-bundling** — *(opsional)* bongkar unit jadi komponen kembali.
16. *(otomatis)* **5.1 HPP / COGS Roll-up** — HPP per unit dihitung dari BOM.

**FASE D — Order-to-Cash (jual & kirim)**
17. **4.1 Sales Orders** — buat **Sales Order** (multi-item).
18. **4.2 Picking Engine** — single pick / wave pick barang.
19. **4.3 Packing Station** — verifikasi fisik & kemas dus.
20. **4.4 Delivery Notes** — buat **Surat Jalan** → otomatis `GI` (stok turun per baris) + AR Invoice terbit.
21. **5.3 AR Invoices** — **AR Invoice** klien terbit → **Bayar** saat diterima.

**FASE E — Kontrol & Audit**
22. **1.4 Operations** — transfer antar-bin / adjustment selisih.
23. **1.7 Stock Setup** — stock opname koreksi fisik massal (menulis ADJ_IN/OUT).
24. **1.5 Aging & Obsolescence** — pantau umur stok + idle capital.
25. **1.6 RMA & Defective** — kelola retur/defective (status serial → RMA).
26. **2.4 Inbound Return** — retur barang ke vendor (RTV) bila QC reject / DOA.
27. **5.4 Warranty Cost** — buka tiket garansi/servis + pantau provisi.
28. **1.3 Stock Ledger** — audit akhir: pastikan **saldo ⇄ mutasi rekonsiliasi dua arah**.

---

# BAGIAN 6 — PRINSIP & ARSITEKTUR

- **Golden rule dua arah:** tiap perubahan saldo wajib berjurnal, tiap jurnal wajib tercermin di saldo. Tak ada UPDATE saldo langsung.
- **Endpoint-driven:** `src/services/apiService.js` adalah lapisan klien; `localStorage` hanya cache, bukan source of truth.
- **Persistence:** PostgreSQL `v2_store` (write-before-respond), realtime via SSE `/api/stream`.
- **Sub-route per fitur:** hash routing `#/modul/fitur`, tab state di-derive dari URL (bukan setState-in-effect).
- **Deployment:** merge ke `main` auto-deploy Vercel; produksi `memory` mode sampai `DATABASE_URL` (mis. Neon) diset.

*Dokumen disusun dari hasil pengujian langsung terhadap sistem berjalan — bukan sekadar membaca kode. Bukti angka bersumber dari journal movements & saldo live.*