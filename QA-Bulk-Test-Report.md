# Laporan QA End-to-End — Skenario Bulk Item (Multi-Line)
**SCM-ERP (MOAI ERP v2.0)** · Local PostgreSQL (`moai_erp`) · 05 Nov 2026
Screenshot per modul: `/home/octarine/projects/SCM-ERP/qa_screenshots/`

> **✅ STATUS RESOLUSI (05 Nov 2026):** 3 gap yang ditemukan sudah diperbaiki & terverifikasi:
> 1. Assembly (field BOM mismatch) → multi-BOM + jurnal komponen (PR #13/#15).
> 2. SJ/GI single-line → GI multi-line + RTV two-step (PR #14).
> 3. QC hardcode → turunan dari item GRN (PR #13); plus semua fitur kini endpoint-driven + ber-form (PR #16/#17/#18).

---

## 1. Skenario (contoh konkret)
**Dinas Kominfo Pemprov DKI** memesan **bulk**: 3× PC Ares Elite + 2× Lenovo ThinkPad E14 Gen 5 (SO 2 line).
Untuk memenuhinya end-to-end:
purchasing memesan komponen **bulk (7 line)** → terima barang **bulk (7 line GRN)** → QC lulus **semua line** → assembly **produksi 3 unit sekaligus** → pick/pack → kirim (SJ/GI).

Semua item diambil dari **Master Data seed yang sudah ada** (bukan dibuat baru).

---

## 2. Master Data yang dipakai (existing SKU)
| SKU | Nama | Cost | Qty alur |
|---|---|---|---|
| PB-ARES-78X | MOAI Ares Elite Gaming PC | 22.000.000 | output build |
| PB-LN-E14G5 | Lenovo ThinkPad E14 Gen 5 | 14.500.000 | SO line-2 |
| SP-CPU-7800X3D | AMD Ryzen 7 7800X3D | 5.900.000 | komponen |
| SP-MB-B650PLUS | ASUS TUF B650-PLUS | 2.600.000 | komponen |
| SP-RAM-DDR5-32G | Kingston FURY 32GB | 1.650.000 | komponen |
| SP-SSD-990P-1T | Samsung 990 PRO 1TB | 1.850.000 | komponen |
| SP-GPU-RTX4070 | Gigabyte RTX 4070 | 9.800.000 | komponen |
| SP-PSU-RM750E | Corsair RM750e | 1.750.000 | komponen |
| SP-CASE-CC560 | DeepCool CC560 | 750.000 | komponen |

Supplier: **PT Asus Technology Indonesia** · Client: **Dinas Kominfo Pemprov DKI** (keduanya data seed).

---

## 3. Hasil per modul (dengan bukti before→after)

### M1 — Inventory & Serial · `m1_inventory.png`
- **Stock-setup (bulk opname)**: re-baseline 3 SKU sekaligus — `applied=3, changed=3` (ADJ_IN +3/+2/+5). ✅ bulk berfungsi
- **Transfer** 2× SSD antar bin (`TRF_OUT -2` / `TRF_IN +2`, total stok netral — benar).
- **Adjustment** `ADJ_OUT -1` ARES → stok langsung berkurang. ✅
- **RMA** dibuka untuk serial `SN-ARES-PC-5503`.

### M2 — SCM & QC Gate · `m2_scm.png`
- **PR bulk 7 line** (`PR-AUTO-954`, items=7) → **convert → PO** (`PO-2026-4374`).
  - ⚠️ **GAP-1**: PO hasil convert `items_count=1` (hardcode), 7 line PR tidak terbawa.
- **GRN bulk 7 line** (`GRN-2026-5459`) → **QC PASS**: **7 line dirilis** semua, stok +per-line, **AP Rp 69.000.000** otomatis. ✅ QC benar-benar bulk (hasil fix PR #13).
- **RTV 1× SSD** (`RTV-2026-9258`).
  - ⚠️ **GAP-3**: movement `RTV_OUT -1` tercatat, tapi **stok SSD tidak turun** (tetap 41, seharusnya 40).

### M3 — BOM & Assembly · `m3_assembly.png`
- **simulate qty=3** → `canBuildAll=true` (semua komponen cukup, GPU 4/3). ✅
- **build 3 unit** → ARES **6→9**, `total_cost=73.950.000` (3×24,65 jt), serial `SN-ARES-PC-5503`. ✅
- **debundle 1** → ARES **9→8**, GPU **1→2** (restore komponen). ✅

### M4 — Outbound & SJ · `m4_outbound.png`
- **SO bulk 2 line** (3× ARES + 2× ThinkPad), `total=118.500.000`.
- **Pick wave** (`WAVE-BATCH-39`) + **pack** (`PACK-2026-5574`, box=5). ✅
- **SJ/GI**: ARES **7→4** (GI -3).
  - ⚠️ **GAP-2**: SJ hanya memproses `items[0]` — **line-2 (ThinkPad) tidak terkirim**, stok ThinkPad tetap 4.

### M5 — Finance & COGS · `m5_finance.png`
- **AP bayar** Rp 69.000.000 → `PAID` (+payment record). ✅
- **AR terima** Rp 118.500.000 → `paid`. ✅

### M6 — Master Data v2.0 · `m6_masterdata.png`
- 15 SKU + 3 supplier + 3 client terbaca benar dari backend lokal. ✅

### Managerial & Worker KPI · `m7_managerial.png`
- revenue **118.500.000**, valuasi gudang **779.960.000**, gross margin 15%, active SO=1, active PO=1.

### Lead Time Analytics · `m8_analytics.png`
- Halaman analytics render (real data, fallback demo saat kosong).

---

## 4. Temuan (3 gap)
| # | Gap | Bukti | Dampak |
|---|---|---|---|
| 1 | **PO-convert** drop line: PR 7 item → PO `items_count=1` (hardcode) | `M2_PR_TO_PO_GAP` | PO tidak memuat rincian item |
| 2 | **SJ/GI single-line**: hanya `items[0]` yang diproses | ThinkPad tetap 4 (line-2 tidak terkirim) | Outbound multi-line tidak akurat |
| 3 | **RTV** movement terekam tanpa update stok | SSD tetap 41 (bukan 40) | Sama kelasnya dengan bug GI yang sudah diperbaiki |

## 5. Ledger movements (24 = 7 seed + 17 baru)
GI -3 · ADJ_OUT -1 · TRF_IN/OUT ±2 · ASM_OUT -1 · ASM_IN +3 · RTV_OUT -1 · QC_RELEASE ×7 · ADJ_IN ×3 (stock-setup) + seed OPN_IN ×7.

## 6. Verdict
- **Sudah benar-benar bulk**: GRN→QC (7 line), Assembly (build 3 + debundle), Inventory stock-setup (3 SKU), Outbound SO (2 line tersimpan).
- **Belum bulk / belum konsisten**: outbound SJ/GI (single-line), PO-convert (items_count hardcode), RTV (movement tanpa update stok).
- Rekomendasi: samakan pola multi-line di ketiga handler tersebut (loop `so.items`/`grn.items`, bawa `pr.items` ke PO, terapkan `RTV_OUT` ke stok) — pola persistence-nya sudah ada.