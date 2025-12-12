# ERP ADI

## Cara Deploy ke Render

Project ini sudah dilengkapi dengan konfigurasi `render.yaml` untuk memudahkan deployment ke Render menggunakan fitur **Blueprint**.

### 1. Persiapan Database (Supabase)
Pastikan Anda sudah memiliki project di Supabase dan siapkan 2 connection string berikut:
- **Transaction Connection String** (untuk `DATABASE_URL`)
- **Session/Direct Connection String** (untuk `DIRECT_URL`)

### 2. Push Kode ke Git
Pastikan semua perubahan kode, termasuk file `render.yaml` dan `frontend/next.config.js`, sudah di-push ke repository Git Anda (GitHub/GitLab/Bitbucket).

### 3. Buat Blueprint di Render
1. Masuk ke dashboard [Render](https://dashboard.render.com).
2. Klik tombol **"New +"** di pojok kanan atas.
3. Pilih menu **"Blueprint"**.
4. Hubungkan repository project ini.

### 4. Konfigurasi Environment Variables
Render akan mendeteksi `render.yaml` dan meminta Anda mengisi variabel berikut:
- `DATABASE_URL`: Isi dengan connection string Supabase (Transaction Mode).
- `DIRECT_URL`: Isi dengan connection string Supabase (Direct/Session Mode).

Variabel lain seperti `JWT_SECRET` akan digenerate otomatis, dan `BACKEND_URL` akan otomatis terhubung antar service.

### 5. Deploy
Klik **"Apply"** atau **"Create Blueprint"**. Render akan membuat dua layanan:
1. **erp-adi-backend**: Web Service untuk API Node.js.
2. **erp-adi-frontend**: Web Service untuk Frontend Next.js.

Tunggu hingga status keduanya menjadi **Live**. Aplikasi bisa diakses melalui URL yang tertera pada service `erp-adi-frontend`.
