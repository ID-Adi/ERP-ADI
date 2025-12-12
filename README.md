# ERP ADI

## Panduan Deployment (Railway & Vercel)

Berikut adalah panduan untuk men-deploy aplikasi ini dengan strategi terpisah: **Backend di Railway** dan **Frontend di Vercel**.

### 1. Persiapan Database (Supabase)
Pastikan Anda memiliki 2 connection string dari Supabase:
- **Transaction Connection String** (untuk `DATABASE_URL`)
- **Session/Direct Connection String** (untuk `DIRECT_URL`)

---

### 2. Deploy Backend ke Railway
Langkah ini harus dilakukan pertama kali karena Frontend membutuhkan URL Backend.

1.  Login ke [Railway Dashboard](https://railway.app).
2.  Klik **New Project** > **Deploy from GitHub repo**.
3.  Pilih repository project ini.
4.  Setelah project terbuat, masuk ke **Settings** service tersebut.
    *   Cari bagian **Root Directory** dan ubah menjadi: `/backend`
    *   (Penting: Ini agar Railway mendeteksi aplikasi Node.js di folder backend).
5.  Masuk ke tab **Variables**, tambahkan:
    *   `DATABASE_URL`: (Isi dari Supabase)
    *   `DIRECT_URL`: (Isi dari Supabase)
    *   `JWT_SECRET`: (Isi dengan string acak/rahasia)
    *   `PORT`: `3000` (atau biarkan default, Railway akan mengaturnya).
6.  Masuk ke tab **Settings** > **Networking** > **Generate Domain**.
    *   Copy domain yang muncul (contoh: `erp-adi-backend.up.railway.app`). Ini akan dipakai di Frontend.

---

### 3. Deploy Frontend ke Vercel
Setelah Backend aktif (hijau), saatnya deploy Frontend.

1.  Login ke [Vercel Dashboard](https://vercel.com).
2.  Klik **Add New...** > **Project**.
3.  Import repository project ini.
4.  Pada konfigurasi **Project Settings**:
    *   **Framework Preset:** Next.js (Otomatis terdeteksi).
    *   **Root Directory:** Klik **Edit** dan pilih folder `frontend`.
5.  Buka bagian **Environment Variables**, tambahkan:
    *   **Key:** `BACKEND_URL`
    *   **Value:** `https://url-dari-railway-tadi` (Jangan lupa pakai `https://`).
6.  Klik **Deploy**.

### Catatan Penting
*   **CORS:** Backend sudah dikonfigurasi menggunakan `cors()`, sehingga seharusnya aman diakses dari Vercel. Namun jika terjadi error CORS, pastikan URL frontend Vercel ditambahkan ke whitelist CORS di backend (jika ada setup whitelist spesifik).
*   **Proxy:** Frontend menggunakan proxy via `next.config.js`. Request ke `/api/*` di frontend akan diteruskan ke `BACKEND_URL`.
