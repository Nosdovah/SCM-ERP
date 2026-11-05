# Panduan Pengguna — MOAI ERP v2.0
### Distributor & Integrator · Semua fitur per modul + alur proses bisnis

> Setiap fitur memiliki **endpoint API** dan **form/aksi di UI**. Cara termudah menjalankan satu alur:
> klik sidebar → pilih modul → pilih tab fitur → isi form → submit → data tersimpan ke PostgreSQL.

---

## 1. Cara masuk
1. Buka aplikasi (lokal: `http://localhost:5174`, produksi: `https://scm-erp-pied.vercel.app`).
2. Klik tombol **⚡ Quick Demo Access — PT Kompakom** (mode lokal tidak butuh akun Supabase).
3. Navigasi pakai **sidebar** kiri. Setiap tab fitur punya **deep-link** `#/modul/fitur` (mis. `#/inventory/serials`).

---

## 2. Alur Proses Bisnis (gambaran besar)

```
                    PROCURE-TO-PAY (belanja barang)
  Auto Reorder (PR) ──► Purchase Order ──► Penerimaan (GRN) ──► QC PASS/Reject
        │                                            │                 │
        ▼                                            ▼                 ▼
   (2.2) SCM                              (2.3) SCM           AP Bill (5.2) → Bayar
                                              RTV (2.4) bila reject/defective

                    PLAN-TO-PRODUCE (rakit PC)
  Resep BOM (3.1) ──► Simulator (3.3) ──► Assembly Order (3.2) ──► Complete
                                                          │  konsumsi komponen (ASM_OUT)
                                                          ▼  terima barang jadi (ASM_IN) + Serial
                                                          Debundle (3.4) = bongkar balik

                    ORDER-TO-CASH (jual & kirim)
  Sales Order (4.1) ──► Picking (4.2) ──► Packing (4.3) ──► Surat Jalan/GI (4.4)
        │                                                          │
        ▼                                                          ▼
  AR Invoice (5.3) → Bayar                                    stok berkurang (GI)

                    INVENTORY & KEUANGAN (lapisan kontrol)
  Ledger (1.3) · Serial (1.2) · Rack/Bin (1.1) · Transfer/Adjustment (1.4)
  Opname (1.7) · Aging (1.5) · RMA (1.6) · COGS (5.1) · Warranty (5.4)
  Master Data (6) = satu sumber data untuk semua modul di atas
```

---

## 3. Modul 1 — Inventory & Serial (`#/inventory`)

| # | Fitur | Cara pakai | Aksi / endpoint |
|---|---|---|---|
| 1.1 | 3 Racks Overview | Tab **Overview** — lihat rak Prebuilt (PB-A), Barebone (BB-A), Spare-part (SP-*) per bin | `GET /inventory/balances` + `/master/bins` |
| 1.2 | Serial Registry | Tab **Serials** — cari SN + isi form **"+ Daftar Serial"** (SN, SKU, status, bin, HPP) | `POST /inventory/serials` |
| 1.3 | Stock Ledger | Tab **Ledger** — mutasi immutable; isi form **"Catat Mutasi"** untuk adjust/opening manual | `GET/POST /inventory/movements` |
| 1.4 | Operations | Tab **Operations** — Transfer antar-bin & Adjustment (selisih) | `POST /inventory/transfers`, `/adjustments` |
| 1.5 | Aging & Obsolescence | Tab **Aging** — bucket umur stok + idle capital + klasifikasi fast/med/slow/dead (dihitung dari ledger) | `GET /inventory/aging` |
| 1.6 | RMA & Defective | Tab **RMA** — buka kasus RMA (status SN → RMA), aksi "kirim servis" / "return vendor" | `POST /inventory/rma` |
| 1.7 | Stock Setup | Tab **Operations → Opname** — set qty absolut banyak SKU sekaligus (menulis ADJ_IN/OUT) | `POST /inventory/stock-setup` |

## 4. Modul 2 — SCM & Inbound QC (`#/scm`)

| # | Fitur | Cara pakai | Aksi |
|---|---|---|---|
| 2.1 | Purchase Orders | Tab **Orders** — form "Buat PO" (supplier + item) atau konversi PR → PO | `POST /scm/purchase-orders`, `requisitions/:id/convert` |
| 2.2 | Auto Reorder | Tab **Reorder** — form **"+ Generate PR"** (SKU + qty usulan) utk buat PR | `POST /scm/requisitions` |
| 2.3 | Receiving & QC Gate | Tab **Receiving** — form **"+ Buat GRN"** (supplier + item SKU:qty), lalu tombol **"Mulai Inspeksi QC"** → PASS/Reject | `POST /scm/goods-receipts`, `qc-inspections/:id/action` |
| 2.4 | Inbound Return | Tab **Inbound Return** — form retur (DRAFT) → **Ship** (RTV_OUT + credit note) | `POST /scm/rtv`, `/rtv/:id/ship` |
| 2.5 | Price Comparison | Tab **Price Compare** — bandingkan harga vendor + form **"+ Tambah Quote"** | `GET/POST /scm/vendor-prices` |

## 5. Modul 3 — BOM & Assembly (`#/assembly`)

| # | Fitur | Cara pakai | Aksi |
|---|---|---|---|
| 3.1 | BOM Recipes | Tab **BOM** — lihat daftar resep + form **"Tambah Resep BOM Baru"** (target_sku + komponen `SKU:qty`) | `GET/POST /assembly/boms` |
| 3.2 | Assembly Orders | Tab **Orders** — form "Buat Assembly Order" (qty + bin) → tombol **Complete** (konsumsi komponen + terima barang jadi + serial) | `POST /assembly/orders`, `PATCH .../complete` |
| 3.3 | Build Simulator | Tab **Simulator** — cek kecukupan komponen utk qty tertentu sebelum build | `POST /assembly/simulate` |
| 3.4 | De-bundling | Tab **Debundle** — bongkar 1 unit prebuilt jadi komponen (kembalikan ke stok) | `POST /assembly/debundle` |

## 6. Modul 4 — Outbound (`#/outbound`)

| # | Fitur | Cara pakai | Aksi |
|---|---|---|---|
| 4.1 | Sales Orders | Tab **Orders** — form "Buat SO" (klien + item línea) | `POST /outbound/sales-orders` |
| 4.2 | Picking (Single/Wave) | Tab **Picking** — form **"+ Single Pick"** + tombol **"Mulai Wave Picking"** (multi-SO) | `POST /outbound/pick-tasks`, `/pick-tasks/wave` |
| 4.3 | Packing Station | Tab **Packing** — form packing (box, berat) utk verifikasi fisik | `POST /outbound/pack-tasks` |
| 4.4 | Delivery Notes | Tab **Surat Jalan** — form "Buat SJ" → otomatis GI (kurangi stok per baris) + AR Invoice | `POST /outbound/delivery-notes` |

## 7. Modul 5 — Finance, COGS & AP/AR (`#/finance`)

| # | Fitur | Cara pakai | Aksi |
|---|---|---|---|
| 5.1 | HPP / COGS Roll-up | Tab **COGS** — roll-up biaya per produk (BOM_ROLLUP / SPECIFIC_ID / FIFO) | `GET /finance/cogs`, P&L `managerial/pnl` |
| 5.2 | AP Bills | Tab **AP** — lihat tagihan vendor + tombol **Bayar** (status PAID + payment) | `POST /finance/ap-bills/:id/pay` |
| 5.3 | AR Invoices | Tab **AR** — lihat tagihan klien + tombol **Bayar** (rekonsiliasi) | `POST /finance/ar-invoices/:id/pay` |
| 5.4 | Warranty Cost | Tab **Warranty** — provisi 2% + form **"+ Buka Tiket"** (biaya servis/garansi) | `GET/POST /finance/warranty-tickets` |

## 8. Modul 6 — Master Data (`#/master-data`)

| # | Fitur | Cara pakai | Aksi |
|---|---|---|---|
| 6.1 | Products Catalog | Tab **Products** — form buat/ubah produk (SKU, kategori, HPP, harga jual) | `POST/PUT /master/products` |
| 6.2 | Warehouse & Bins | Tab **Hierarchy** — form tambah bin, lihat gudang/zona/bin | `GET /master/{warehouses,zones,bins}`, `POST /master/bins` |
| 6.3 | Brands | Tab **Brands** — CRUD brand | `GET/POST/PUT/DELETE /master/brands` |
| 6.4 | Suppliers | Tab **Suppliers** — CRUD supplier (lead time, defect rate) | `GET/POST/PUT/DELETE /master/suppliers` |
| 6.5 | Clients | Tab **Clients** — CRUD klien (segmen, credit limit) | `GET/POST/PUT/DELETE /master/clients` |

---

## 9. Contoh alur harian (end-to-end)
1. **Master Data (6)** — pastikan produk, supplier, dan klien sudah ada.
2. **Reorder/PO (2.1–2.2)** — generate PR bila stok tipis → konversi ke PO → setujui.
3. **Terima barang (2.3)** — buat GRN → QC PASS → stok komponen naik + AP Bill terbit.
4. **Rakit (3)** — pilih resep BOM → simulator → buat assembly order → complete → barang jadi + serial masuk stok.
5. **Jual (4)** — buat SO → pick → pack → SJ → stok berkurang (GI) + AR Invoice terbit.
6. **Bayar (5)** — bayar AP ke vendor, terima AR dari klien; pantau COGS/Warranty.
7. **Pantau (1)** — ledger, serial, aging, RMA sebagai jejak audit; stock opname (1.7) utk koreksi fisik.

> Prinsip inti: **saldo ⇄ mutasi harus selalu rekonsiliasi dua arah** — setiap perubahan stok wajib berjurnal, setiap jurnal wajib tercermin di saldo. Semua data tersimpan di Postgres (durable), realtime via SSE.