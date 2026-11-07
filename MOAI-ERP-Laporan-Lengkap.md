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

## 5.1 Cerita: Satu Hari dengan MOAI ERP *(data contoh mengalir sinkron dari awal ke akhir)*

**Skema contoh:** PT Kompakom melayani pesanan **3 unit PC gaming "MOAI Ares Elite"** dari **Toko Jaya Makmur Komputer** (klien retail, bayar COD). Ikuti angkanya — semuanya saling cocok dari awal sampai akhir.

**FASE A — Data induk sudah siap (Master Data).**
- **6.1 Products Catalog** — barang jadi `PB-ARES-78X` "MOAI Ares Elite Gaming PC (Ryzen 7 7800X3D / RTX 4070)", harga jual **Rp 27.500.000**/unit, memakai nomor seri, jenis *rakitan*. Komponen tercatat sebagai *spare part* (CPU, motherboard, RAM, SSD, VGA, PSU, casing).
- **6.2 Warehouse & Bins** — gudang `WH-JKT-01` "Gudang Pusat Cikarang"; VGA di bin `SP-GPU-C-01`, PC jadi di `PB-A-1-01`.
- **6.3 Brands · 6.4 Suppliers · 6.5 Clients** — brand: MOAI, AMD, Gigabyte, Kingston, Samsung, Corsair. Pemasok `SUPP-SYNNEX` (PT Synnex Metrodata, kirim 7 hari, cacat 1,2%, NET 30). Klien `CLI-JAYA` (Toko Jaya Makmur, COD, kredit Rp 100 jt).

**FASE B — Belanja komponen (Procure-to-Pay).**
- **1.1 3 Racks Overview** — cek rak: stok VGA `SP-GPU-RTX4070` tinggal **2 pcs** di bin `SP-GPU-C-01`.
- **2.2 Auto Reorder** — sistem mendeteksi `SP-GPU-RTX4070`: **2 pcs < reorder point 12** → usulan **Purchase Requisition: VGA 15 pcs**. (CPU 7800X3D juga ditandai: 3 < 15, tapi 3 cukup untuk order ini, jadi ditangguhkan.)
- **2.5 Price Comparison** — bandingkan penawaran VGA: Synnex Rp 9.900.000 (5 hari, cacat 0,9%) vs Silicon Rp 9.600.000 (14 hari, cacat 1,5%). Harga beli final **Rp 9.800.000** (harga pokok standar MOAI).
- **2.1 Purchase Orders** — PO ke PT Synnex: **15 × Rp 9.800.000 = Rp 147.000.000**.
- **2.3 Receiving & QC Gate** — GRN masuk **15 VGA** → inspeksi QC → **15 PASS**.
- **5.2 AP Bills** — AP Bill Synnex **Rp 147.000.000** (NET 30) → **Dibayar**.
- **1.3 Stock Ledger** *(otomatis)* — stok VGA: **2 + 15 = 17 pcs** (mutasi `QC_RELEASE`).

**FASE C — Merakit 3 PC (Plan-to-Produce).**
- **3.1 BOM Recipes** — resep "Ares Elite v1.0" (7 komponen ×1 per unit): CPU 7800X3D Rp 5.900.000, motherboard B650 Rp 2.600.000, RAM 32GB Rp 1.650.000, SSD 1TB Rp 1.850.000, VGA RTX 4070 Rp 9.800.000, PSU 750W Rp 1.750.000, casing Rp 750.000 + jasa rakit Rp 250.000 + overhead Rp 100.000 → **bahan Rp 24.300.000 / unit, total Rp 24.650.000 / unit**.
- **3.3 Build Simulator** — cek untuk **3 unit**: CPU butuh 3 (stok 3 ✓), VGA butuh 3 (stok 17 ✓), semua komponen ✓ → **"cukup"**.
- **3.2 Assembly Orders** — buat Assembly Order **3 unit** → **Complete**: konsumsi 3× tiap komponen (`ASM_OUT`), terima 3 unit jadi (`ASM_IN`). Stok `PB-ARES-78X`: **6 + 3 = 9 unit**; CPU **3 − 3 = 0**; VGA **17 − 3 = 14**.
- **1.2 Serial Registry** *(otomatis)* — 3 unit baru dapat nomor seri `SN-ARES-2026-001`, `SN-ARES-2026-002`, `SN-ARES-2026-003`.
- **3.4 De-bundling** — *(opsional; tidak dipakai di contoh ini)* untuk membongkar unit jadi komponen kembali.
- **5.1 HPP / COGS Roll-up** *(otomatis)* — HPP terkunci **Rp 24.650.000/unit**.

**FASE D — Jual & kirim (Order-to-Cash).**
- **4.1 Sales Orders** — buat SO untuk Toko Jaya Makmur: **3 × Rp 27.500.000 = Rp 82.500.000**.
- **4.2 Picking Engine** — single pick **3 unit** dari bin `PB-A-1-01`.
- **4.3 Packing Station** — kemas 3 dus, verifikasi fisik.
- **4.4 Delivery Notes** — buat Surat Jalan → `GI` 3 unit: stok `PB-ARES-78X` **9 − 3 = 6 unit**.
- **5.3 AR Invoices** — AR Invoice **Rp 82.500.000** (COD) → **Dibayar tunai**.

**FASE E — Kendali & audit (agar angka tetap benar).**
- **1.4 Operations** — *(contoh)* pindahkan sisa VGA dari `SP-GPU-C-01` ke rak cadangan bila penuh.
- **1.7 Stock Setup** — opname akhir pekan: hitung fisik, ternyata **selisih 0** (semua cocok).
- **1.5 Aging & Obsolescence** — 14 VGA sisa berumur < 30 hari (kelas *fast-moving*), modal menganggur Rp 0.
- **1.6 RMA & Defective** — 1 unit Ares Elite dikembalikan klien (DOA) → serialnya berstatus **RMA**.
- **2.4 Inbound Return** — 1 VGA hasil servis dikirim balik (RTV) ke Synnex + credit note.
- **5.4 Warranty Cost** — buka tiket garansi `WAR-2026-####` untuk unit DOA (estimasi Rp 850.000).
- **1.3 Stock Ledger** — audit akhir: **saldo = mutasi, semua cocok dua arah**.

**Jejak sinkron — stok dari awal ke akhir:**

| SKU | Saldo awal | + Masuk | − Keluar | Saldo akhir | Sebab |
|---|---|---|---|---|---|
| SP-GPU-RTX4070 | 2 | +15 | −3 | 14 | beli 15 → rakit 3 |
| SP-CPU-7800X3D | 3 | 0 | −3 | 0 | rakit 3 |
| SP-MB-B650PLUS | 9 | 0 | −3 | 6 | rakit 3 |
| SP-RAM-DDR5-32G | 50 | 0 | −3 | 47 | rakit 3 |
| SP-SSD-990P-1T | 40 | 0 | −3 | 37 | rakit 3 |
| SP-PSU-RM750E | 30 | 0 | −3 | 27 | rakit 3 |
| SP-CASE-CC560 | 25 | 0 | −3 | 22 | rakit 3 |
| PB-ARES-78X | 6 | +3 | −3 | 6 | rakit 3 → jual 3 |

**Jejak sinkron — uang:**

| Alur | Nilai |
|---|---|
| Belanja VGA (AP, dibayar) | Rp 147.000.000 |
| Penjualan 3 PC (AR, COD) | Rp 82.500.000 |
| HPP 3 PC (bahan + jasa + overhead) | Rp 73.950.000 |
| Laba kotor | Rp 8.550.000 |

> **Intinya:** satu pesanan menghasilkan rantai angka yang saling cocok — beli 15 VGA (Rp 147 jt) → rakit 3 PC (HPP Rp 73,95 jt) → jual 3 PC (Rp 82,5 jt, laba kotor Rp 8,55 jt). Di tiap tahap, fitur `X.Y` mencatat angkanya, dan di akhir semuanya bisa ditelusuri dari ledger.

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