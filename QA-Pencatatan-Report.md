# LAPORAN PEMERIKSAAN PENCATATAN
### Sudut pandang: ERP Specialist — Pencatatan, Integritas Ledger & Jejak Audit
**Sistem:** MOAI ERP v2.0 (SCM-ERP) · **Lingkungan:** Lokal — PostgreSQL `moai_erp`
**Tanggal:** 05 Nov 2026 · **Cakupan:** Kebenaran & kelengkapan pencatatan transaksi **bulk multi-line** lintas modul

> **✅ STATUS RESOLUSI (05 Nov 2026):** Seluruh temuan T-1–T-4 sudah diperbaiki & terverifikasi end-to-end.
> - T-1 PO-convert → **P3**: PR items kini terbawa ke PO (`items[]` + `items_count` + total dari biaya item).
> - T-2 SJ/GI single-line → **P1**: GI kini per baris SO (multi-line) + saldo dikurangi per baris.
> - T-3 RTV tanpa efek saldo → **P1**: RTV jadi two-step (create DRAFT → ship = RTV_OUT + efek saldo + credit note).
> - T-4 assembly tanpa jurnal komponen → **P2**: build menulis `ASM_OUT` per komponen, debundle menulis `ASM_IN` per komponen, `unit_cost` dari biaya aktual.
> - P&L HPP flat 80% → **P4**: HPP kini diturunkan dari ledger GI. Saldo ⇄ mutasi rekonsiliasi 2 arah. Data flow frontend↔endpoint lengkap (PR #13/#14/#16/#17).

---

## 1. Tujuan & Standar Pemeriksaan
Saya (ERP Specialist, ditugaskan pada **pencatatan**) memeriksa kepatuhan sistem terhadap **golden rule pencatatan persediaan**:

1. `Saldo ⇄ Mutasi harus rekonsiliasi DUA ARAH` — tiap perubahan saldo wajib punya jurnal, dan tiap jurnal wajib tercermin di saldo.
2. `Setiap dokumen membawa rincian baris (line)` agar rantai dokumen tertelusur (PR→PO→GRN→QC→invoice→payment).
3. `Posting keuangan diturunkan dari transaksi asalnya` (AP dari GRN, AR dari SO, HPP dari biaya aktual).

---

## 2. Ringkasan Eksekutif
Verdict: **Pencatatan belum andal.**

Dasar transaksinya ada dan sebagian benar, tetapi saya menemukan **4 cacat pencatatan**:
- 2 cacat membuat **saldo ≠ realitas** → **aset persediaan overstated ± Rp 30.850.000**, HPP rendah saji, laba tinggi saji.
- 1 cacat membuat **jurnal produksi tidak lengkap** → konsumsi komponen ± Rp 72,9 juta bergerak tanpa jejak mutasi.
- 1 cacat memutus **rantai dokumen** (PR→PO).

| Temuan | Jenis cacat | Dampak pencatatan |
|---|---|---|
| T-1 PO-convert | Traceability dokumen | 7 line PR tidak terbawa ke PO (`items_count=1`) |
| T-2 SJ/GI single-line | Kelengkapan outbound | 2 ThinkPad (Rp 36 jt) ditagih tapi **tidak dikeluarkan stok** |
| T-3 RTV | Konsistensi saldo⇄mutasi | 1 SSD diretur, saldo tidak turun (Rp 1,85 jt) |
| T-4 Assembly komponen | Kelengkapan jurnal | Konsumsi/restore komponen **tanpa mutasi** |

---

## 3. Rekonsiliasi Ledger vs Saldo (inti pemeriksaan)

### 3.1 SKU yang SEHAT (kontrol positif)
| SKU | Saldo awal | Mutasi seharusnya | Saldo tercatat | Status |
|---|---|---|---|---|
| PB-ARES-78X | 6 | +3 build −1 debundle −1 adjust −3 GI | **4** | ✅ rekonsiliasi |
| SP-GPU-RTX4070 | 2 | +2 QC −3 build +1 debundle | **2** | ⚠️ saldo benar, jurnal belum lengkap (T-4) |

### 3.2 SKU yang TIDAK rekonsiliasi
| SKU | Saldo tercatat | Saldo seharusnya | Selisih | Akar |
|---|---|---|---|---|
| PB-LN-E14G5 | 4 | **2** | +2 unit (Rp 29 jt overstated) | T-2: line-2 tidak di-GI |
| SP-SSD-990P-1T | 41 | **40** | +1 unit (Rp 1,85 jt overstated) | T-3: RTV_OUT tanpa efek saldo |

**Total aset persediaan overstated = Rp 30.850.000.**

### 3.3 Rendah saji HPP & tinggi saji pendapatan (akibat T-2)
- Diakui **pendapatan/AR Rp 118.500.000** (2 line), padahal yang dikirim hanya line-1 (3 ARES).
- Nilai line-2 yang belum dikirim **Rp 36.000.000** tetap diakui sebagai pendapatan.
- HPP aktual yang seharusnya diakui = 3 × Rp 22 jt = **Rp 66 jt**; namun P&L menghitung HPP = flat 80% × Rp 118,5 jt = **Rp 94,8 jt** (biaya tidak diturunkan dari biaya aktual, melainkan persentase tetap).

---

## 4. Rincian Temuan Pencatatan

### T-1 — PO-convert memutus rincian baris (traceability)
- **Fakta:** `PR-AUTO-954` berisi **7 line**; hasil convert `PO-2026-4374` mencatat `items_count: 1` (hardcode), line PR tidak dibawa.
- **Akibat:** PO tidak bisa direkonsiliasi terhadap PR; GRN juga tidak punya rujukan PO yang memuat line → rantai 3-dokumen (PR→PO→GRN) terputus. Auditor tidak bisa membuktikan "barang diterima = barang yang dipesan".

### T-2 — SJ/GI hanya memproses baris pertama (outbound tidak lengkap)
- **Fakta:** `SO-2026-5670` 2 line (3 ARES + 2 ThinkPad). Handler SJ hanya membaca `items[0]` → hanya ARES yang di-GI (−3). ThinkPad tidak pernah dikeluarkan.
- **Akibat pencatatan:**
  - Persediaan ThinkPad tetap 4 (seharusnya 2) → **aset overstated Rp 29.000.000**.
  - AR ditagih penuh Rp 118,5 jt → **pendapatan/piutang overstated Rp 36.000.000** untuk barang yang belum keluar.
  - HPP tidak diakui untuk line-2 → laba kotor tinggi saji.

### T-3 — RTV membukukan mutasi tanpa menggerakkan saldo
- **Fakta:** `RTV-2026-9258` memposting mutasi `RTV_OUT -1`, tetapi saldo SSD tidak dikurangi. Hasil: saldo 41 (seharusnya 40).
- **Akibat:** barang sudah keluar gudang, tetapi buku masih mencatatnya → **aset overstated Rp 1.850.000**. Ini cacat yang **sama persis** dengan cacat GI yang sudah diperbaiki sebelumnya — artinya pola *"mutasi tanpa efek saldo"* masih muncul di modul lain.

### T-4 — Assembly tidak membukukan jurnal konsumsi/restore komponen
- **Fakta:** `complete` build 3 unit mengubah saldo 7 komponen (−3 tiap SKU) **tanpa satu pun mutasi `ASM_OUT`**. Yang dibukukan hanya `ASM_IN +3` untuk produk jadi. `debundle` sebaliknya: restore 7 komponen (+1 tiap SKU) tanpa mutasi `ASM_IN`, hanya `ASM_OUT -1` untuk produk jadi.
- **Akibat:** nilai material **± Rp 72.900.000** (build) dan **Rp 24.300.000** (restore) bergerak pada saldo **tanpa jejak jurnal**. Saldo komponen benar (kebetulan), tetapi **riwayat mutasi tidak menjelaskan** mengapa saldo naik/turun → gagal uji *audit trail*.
- **Catatan tambahan:** `unit_cost` mutasi `ASM_IN` di-hardcode **Rp 25.450.000**, tidak sama dengan biaya BOM aktual Rp 24.650.000.

---

## 5. Kontrol yang Sudah Benar (untuk keseimbangan pemeriksaan)
- **GRN→QC multi-line:** 7 line dirilis, AP **Rp 69.000.000** diturunkan dari item (bukan angka tetap). ✅
- **stock-setup (opname bulk):** 3 SKU re-baseline dengan menulis `ADJ_IN/ADJ_OUT` per selisih — mematuhi golden rule. ✅
- **Adjustment & transfer:** `ADJ_OUT` mengurangi saldo langsung; transfer menulis `TRF_OUT/TRF_IN` (net total netral — benar). ✅
- **Payment:** AP `PAID` + arsip payment; AR `paid`. ✅

---

## 6. Risiko Pencatatan (dampak keandalan laporan)
1. **Overstated aset** Rp 30,85 jt → nilai persediaan di neraca tidak akurat.
2. **Overstated pendapatan** Rp 36 jt dan **rendah saji HPP** → laba kotor tidak dapat diandalkan.
3. **Jejak audit terputus** di PR→PO dan di konsumsi komponen → tidak lolos uji kelengkapan *vouching/tracing*.
4. **HPP flat 80%** → tidak merepresentasikan biaya aktual per metode (FIFO/BOM roll-up yang diiklankan tidak diterapkan di P&L).

---

## 7. Rekomendasi (prioritas)
| Prioritas | Tindakan | Target |
|---|---|---|
| **P1** | Loop `so.items` di SJ/GI (GI per baris) + terapkan `RTV_OUT` ke saldo | Nol-kan selisih T-2 & T-3 |
| **P2** | Buka jurnal `ASM_OUT` (build) & `ASM_IN` (restore) per komponen, `unit_cost` dari biaya aktual | Lengkapi mutasi T-4 |
| **P3** | Bawa `pr.items` ke `po.items` saat convert | Pulihkan rantai dokumen T-1 |
| **P4** | HPP P&L dari roll-up biaya (ledger), bukan persentase tetap | Andalkan laporan laba |

---

## 8. Penutup
Dari sudut pandang pencatatan, sistem ini **belum layak dijadikan "system of record"** untuk persediaan multi-line karena golden rule dilanggar di tiga titik (T-2, T-3, T-4) dan rantai dokumen terputus (T-1). Kontrol dasar (GRN/QC multiline, opname bulk, payment) sudah benar dan menjadi fondasi perbaikan. Prioritas tertinggi adalah **menyamakan pola saldo⇄mutasi di semua penulis mutasi** — satu prinsip, satu implementasi.

*Laporan disusun dari pemeriksaan langsung terhadap sistem berjalan (bukan membaca kode semata). Bukti angka bersumber dari journal movements & saldo live.*