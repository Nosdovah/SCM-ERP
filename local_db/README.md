# Menjalankan MOAI SCM-ERP di lokal dengan PostgreSQL (persisten + realtime)

Setup ini mengganti Supabase dengan **PostgreSQL lokal** untuk penyimpanan data,
plus **realtime render** via Server-Sent Events (SSE). Tidak butuh Docker.

## Prasyarat
- PostgreSQL 15 (server sudah jalan di port 5432 cluster `main`).
- Node.js 22+.

## 1. Buat database & apply schema (sekali saja)
```bash
# buat role + database (jika belum ada)
sudo -u postgres psql -c "CREATE ROLE moai LOGIN PASSWORD 'moai_local_pw';"
sudo -u postgres psql -c "CREATE DATABASE moai_erp OWNER moai;"

# apply schema (v2_store + tabel legacy)
PGPASSWORD=moai_local_pw psql -h 127.0.0.1 -U moai -d moai_erp -f local_db/schema.sql
```

## 2. Install dependensi
```bash
npm install
```

## 3. Jalankan backend (Express + PostgreSQL)
```bash
npm run server
# -> base URL http://localhost:5000/api, mode persistence: "postgres"
```

## 4. Jalankan frontend (Vite, terminal terpisah)
```bash
npm run dev
# -> http://localhost:5173  (Vite mem-proxy /api ke :5000)
```

Login lewat tombol **⚡ Quick Demo Access** (tidak butuh akun Supabase).

## Apa yang berubah vs Supabase
| Komponen | Sebelum (Supabase) | Sekarang (PostgreSQL lokal) |
|---|---|---|
| v2 collection store | `v2_store` di Supabase | `v2_store` di Postgres lokal (JSONB) |
| Legacy tables | `orders/items/suppliers/...` di Supabase | tabel lokal ekuivalen |
| Backend persistence | `@supabase/supabase-js` | `pg` (server/db.js) + kompat shim |
| Realtime | Supabase Realtime (dihapus) | SSE `/api/stream` + bus event |

## Verifikasi persistence
1. `POST /api/v2/master/brands` (record unik) → `201`.
2. Matikan server (`Ctrl+C`), jalankan lagi `npm run server`.
3. `GET /api/v2/master/brands` → record masih ada (tersimpan di Postgres, bukan memory).
   Cek juga: `GET /api/health` → `persistence.mode` = `postgres`, `durable` = `true`.

## Verifikasi realtime render
1. Buka app di 2 tab browser.
2. Di tab 1, tambah brand/supplier (Master Data) atau posting stock movement.
3. Tab 2 otomatis *meng-update* tanpa refresh — notifikasi bell di TopNav dan
   modul Inventory me-refetch begitu server broadcast perubahan koleksi via SSE.

## Cara menambahkan realtime ke modul lain
Gunakan hook `useLiveData`:
```js
import { useLiveData } from '../../hooks/useLiveData';
// di dalam komponen:
useLiveData(loadSaya, ['nama_koleksi_1', 'nama_koleksi_2']);
```
Nama koleksi = nama row di `v2_store` (mis. `products`, `suppliers`, `clients`,
`movements`, `sales_orders`, `purchase_orders`, `delivery_notes`, dll).

## File baru
- `local_db/schema.sql` — skema Postgres lokal (v2_store + tabel legacy + trigger NOTIFY).
- `server/db.js` — pool `pg` + query builder kompatibel Supabase + bus realtime.
- `server/store.js` — di-rewrite agar persist via `pg` (fallback ke Supabase).
- `src/services/live.js` — klien SSE.
- `src/hooks/useLiveData.js` — hook realtime untuk re-fetch.