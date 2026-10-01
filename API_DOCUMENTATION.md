# Dokumentasi Pengujian Backend & REST API
## MOAI Supply Chain ERP

Dokumentasi ini berisi panduan lengkap untuk memverifikasi, menguji, dan memantau backend REST API baik di lingkungan **Lokal (Localhost)** maupun setelah di-deploy ke **Vercel (Production)** dengan basis data **Supabase**.

---

## 1. Lingkungan & Base URL

| Lingkungan | Base URL | Keterangan |
| :--- | :--- | :--- |
| **Lokal (Node.js)** | `http://localhost:5000/api` | Dijalankan via `npm run server` |
| **Lokal (Vite Proxy)**| `http://localhost:5173/api` | Ter-proxy otomatis saat `npm run dev` |
| **Vercel Production** | `https://<domain-proyek-anda>.vercel.app/api` | Vercel Serverless Functions (`api/index.js`) |

---

## 2. Persiapan & Menjalankan Server Lokal

1. Pastikan dependensi sudah terpasang:
   ```bash
   npm install
   ```

2. Buat file `.env` di root project jika ingin menghubungkan langsung ke Supabase:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   PORT=5000
   ```
   *(Catatan: Jika `.env` belum diisi, server akan otomatis beralih ke mode fallback lokal sehingga tetap bisa diuji tanpa crash).*

3. Jalankan server backend:
   ```bash
   npm run server
   ```
   *Output yang diharapkan:*
   ```text
   ====================================================
   🚀 MOAI SCM-ERP REST API Server running on port 5000
      Base URL: http://localhost:5000/api
      Supabase: https://your-project.supabase.co
   ====================================================
   ```

---

## 3. Skrip Otomatis Pengujian Cepat

Anda dapat menjalankan skrip pengujian otomatis menyeluruh untuk menguji semua endpoint sekaligus dengan perintah:
```bash
node test_api.js
```

---

## 4. Panduan Manual Pengujian Endpoint (cURL & PowerShell)

Berikut adalah daftar perintah pengujian untuk setiap endpoint menggunakan **cURL** (Linux/macOS/Git Bash) atau **PowerShell** (Windows).

### A. Healthcheck & Status Backend
Memastikan server menyala dan mendeteksi apakah terhubung ke Supabase atau mode lokal.

* **cURL:**
  ```bash
  curl -i http://localhost:5000/api/health
  ```
* **PowerShell:**
  ```powershell
  Invoke-RestMethod -Uri "http://localhost:5000/api/health" | ConvertTo-Json
  ```
* **Respon Sukses (`200 OK`):**
  ```json
  {
    "status": "healthy",
    "backend": "Supabase PostgreSQL + Storage",
    "timestamp": "2026-10-01T03:16:14.295Z"
  }
  ```

---

### B. Modul Autentikasi (`/api/auth`)

#### 1. Registrasi Akun & Tenant Baru (`POST /api/auth/register`)
* **cURL:**
  ```bash
  curl -X POST http://localhost:5000/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@pt-logistik.com","password":"Password123!","company_name":"PT LOGISTIK","role":"Admin"}'
  ```
* **PowerShell:**
  ```powershell
  $body = @{
    email = "admin@pt-logistik.com"
    password = "Password123!"
    company_name = "PT LOGISTIK"
    role = "Admin"
  } | ConvertTo-Json

  Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method Post -Body $body -ContentType "application/json"
  ```

#### 2. Login (`POST /api/auth/login`)
* **cURL:**
  ```bash
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@pt-logistik.com","password":"Password123!"}'
  ```
* **PowerShell:**
  ```powershell
  $login = @{ email = "admin@pt-logistik.com"; password = "Password123!" } | ConvertTo-Json
  $res = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body $login -ContentType "application/json"
  $res.session.user
  ```

---

### C. Modul Perusahaan & Tenant (`/api/companies`)

#### 1. Ambil Daftar Perusahaan Terdaftar (`GET /api/companies`)
* **PowerShell:**
  ```powershell
  Invoke-RestMethod -Uri "http://localhost:5000/api/companies" | Format-Table
  ```

#### 2. Tambah Perusahaan Baru (`POST /api/companies`)
* **PowerShell:**
  ```powershell
  $comp = @{ name = "PT GLOBAL CARGO" } | ConvertTo-Json
  Invoke-RestMethod -Uri "http://localhost:5000/api/companies" -Method Post -Body $comp -ContentType "application/json"
  ```

---

### D. Modul Master Data: Supplier & Item (`/api/suppliers` & `/api/items`)

#### 1. Ambil Daftar Supplier (`GET /api/suppliers`)
* **PowerShell:**
  ```powershell
  Invoke-RestMethod -Uri "http://localhost:5000/api/suppliers?company_name=MANUFACTURE"
  ```

#### 2. Tambah Supplier Baru (`POST /api/suppliers`)
* **PowerShell:**
  ```powershell
  $sup = @{ name = "PT Samudera Logistik"; company_name = "MANUFACTURE" } | ConvertTo-Json
  Invoke-RestMethod -Uri "http://localhost:5000/api/suppliers" -Method Post -Body $sup -ContentType "application/json"
  ```

#### 3. Ambil Daftar Master Item / SKU (`GET /api/items`)
* **PowerShell:**
  ```powershell
  Invoke-RestMethod -Uri "http://localhost:5000/api/items?company_name=MANUFACTURE" | Format-Table name, sku, stock_on_hand, unit_price
  ```

#### 4. Tambah SKU Item Baru (`POST /api/items`)
* **PowerShell:**
  ```powershell
  $item = @{
    sku = "CHA-CUS-001"
    name = "Custom Aluminum Enclosure V1"
    category = "Chassis"
    company_name = "MANUFACTURE"
    unit_price = 55.50
    stock_on_hand = 120
  } | ConvertTo-Json
  Invoke-RestMethod -Uri "http://localhost:5000/api/items" -Method Post -Body $item -ContentType "application/json"
  ```

---

### E. Modul Pesanan Kanban (`/api/orders`)

#### 1. Ambil Semua Pesanan Perusahaan (`GET /api/orders`)
* **PowerShell:**
  ```powershell
  Invoke-RestMethod -Uri "http://localhost:5000/api/orders?company_name=MANUFACTURE" | Format-Table id, title, stage, priority, assignee, quantity
  ```

#### 2. Buat Pesanan Baru (`POST /api/orders`)
* **PowerShell:**
  ```powershell
  $order = @{
    title = "MSI Modern Series (Low): Full Polycarbonate, Slim Bezel"
    stage = "cpo_esta"
    priority = "High"
    assignee = "Ahmad Dani"
    quantity = 25
    company_name = "MANUFACTURE"
  } | ConvertTo-Json

  $created = Invoke-RestMethod -Uri "http://localhost:5000/api/orders" -Method Post -Body $order -ContentType "application/json"
  $created
  ```

#### 3. Pindah Tahapan Pesanan (`PATCH /api/orders/:id/stage`)
*Mendukung perpindahan tahapan, pencatatan alasan mundur (revert), serta auto-increment stok saat sampai gudang (`wh_inbound`).*
* **PowerShell:**
  ```powershell
  $stageUpdate = @{
    stage = "wh_inbound"
    user_email = "admin@manufacture.com"
  } | ConvertTo-Json

  Invoke-RestMethod -Uri "http://localhost:5000/api/orders/ORD-8942/stage" -Method Patch -Body $stageUpdate -ContentType "application/json"
  ```

#### 4. Update Checklist Pesanan (`PATCH /api/orders/:id/checklist`)
* **PowerShell:**
  ```powershell
  $checkUpdate = @{
    checklistState = @{ "item_vc_validation" = $true }
    itemText = "Value Contract & WBS validation"
    status = "Completed"
    user_email = "procurement@manufacture.com"
  } | ConvertTo-Json

  Invoke-RestMethod -Uri "http://localhost:5000/api/orders/ORD-8942/checklist" -Method Patch -Body $checkUpdate -ContentType "application/json"
  ```

---

### F. Modul Riwayat Audit & Notifikasi (`/api/order-history` & `/api/notifications`)

#### 1. Ambil Riwayat Suatu Pesanan (`GET /api/orders/:id/history`)
* **PowerShell:**
  ```powershell
  Invoke-RestMethod -Uri "http://localhost:5000/api/orders/ORD-8942/history" | Format-Table action, user_email, created_at
  ```

#### 2. Ambil 20 Notifikasi Terbaru (`GET /api/notifications`)
* **PowerShell:**
  ```powershell
  Invoke-RestMethod -Uri "http://localhost:5000/api/notifications?company_name=MANUFACTURE&limit=20"
  ```

---

### G. Modul Analytics Dashboard (`/api/analytics/dashboard`)
Menghitung Lead Time rata-rata, deteksi tahapan *bottleneck*, valuasi inventaris, dan jumlah item stok menipis secara agregat.

* **PowerShell:**
  ```powershell
  Invoke-RestMethod -Uri "http://localhost:5000/api/analytics/dashboard?company_name=MANUFACTURE"
  ```

---

### H. Pengganti WebSockets: REST Delta Sync (`/api/sync`)
Mengambil data delta terbaru secara efisien dengan parameter `since`:

#### 1. Sinkronisasi Order Terbaru (`GET /api/sync/orders`)
* **PowerShell:**
  ```powershell
  Invoke-RestMethod -Uri "http://localhost:5000/api/sync/orders?company_name=MANUFACTURE&since=2026-10-01T00:00:00Z"
  ```

#### 2. Sinkronisasi Seluruh Data Sekaligus (`GET /api/sync/all`)
* **PowerShell:**
  ```powershell
  Invoke-RestMethod -Uri "http://localhost:5000/api/sync/all?company_name=MANUFACTURE"
  ```

---

### I. Upload Dokumen ke Supabase Storage (`POST /api/documents/upload`)
Mengunggah file (PDF / Gambar) multipart form-data langsung ke bucket `documents` di Supabase.

* **cURL:**
  ```bash
  curl -X POST http://localhost:5000/api/documents/upload \
    -F "order_id=ORD-8942" \
    -F "item_id=check_airway_bill" \
    -F "file=@./test_document.pdf"
  ```

---

## 5. Memverifikasi Deployment di Vercel (Production)

Setelah kode di-push ke GitHub dan dideploy oleh Vercel:

1. Ganti `http://localhost:5000` dengan domain Vercel Anda:
   ```bash
   curl -i https://<project-name>.vercel.app/api/health
   ```
2. Pastikan respon mengembalikan status `healthy`:
   ```json
   {
     "status": "healthy",
     "backend": "Supabase PostgreSQL + Storage",
     "timestamp": "..."
   }
   ```
3. Jika status bukan `healthy` atau terdapat error koneksi, pastikan Environment Variables pada dashboard Vercel (**Project Settings > Environment Variables**) sudah terisi:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
