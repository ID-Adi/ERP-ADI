# MCP PostgreSQL Setup Guide

## ✅ Konfigurasi Selesai

Berikut ini adalah file-file yang telah dikonfigurasi untuk menghubungkan MCP ke PostgreSQL yang berjalan di Docker:

### 1. `.mcp.json` - Konfigurasi MCP Server
```json
{
  "mcpServers": {
    "postgres": {
      "command": "server-postgres",
      "args": ["postgresql://postgres:anandakeren@localhost:5433/erp_adi"]
    }
  }
}
```

**Penjelasan:**
- `command`: Perintah yang menjalankan MCP server PostgreSQL
- `args`: Connection string PostgreSQL
  - `postgres`: Username database
  - `anandakeren`: Password (dari docker-compose)
  - `localhost:5433`: Host dan port (port 5433 dipetakan ke 5432 dalam container)
  - `erp_adi`: Nama database

### 2. `docker-compose.yml` - Konfigurasi Docker
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16
    container_name: erp_adi_postgres
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "${POSTGRES_PORT}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

**Penjelasan:**
- Menggunakan variabel environment dari file `.env`
- Port `5433:5432` - Docker container port 5432 dipetakan ke port 5433 di host
- Volume `postgres_data` untuk persistent data

### 3. `.env` - Environment Variables
```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=anandakeren
POSTGRES_DB=erp_adi
POSTGRES_PORT=5433
```

**Keamanan:**
- File ini sudah ditambahkan ke `.gitignore` agar password tidak ter-upload ke git
- Jangan commit file ini ke repository

## 🚀 Cara Menggunakan

### Start PostgreSQL
```bash
docker-compose up -d
```

### Stop PostgreSQL
```bash
docker-compose down
```

### Check status
```bash
docker-compose ps
```

### Access database langsung
```bash
docker exec erp_adi_postgres psql -U postgres -d erp_adi
```

## ✨ Hasil Verifikasi

PostgreSQL sudah berhasil terhubung dan berfungsi:
```
PostgreSQL 16.11 (Debian 16.11-1.pgdg13+1) on x86_64-pc-linux-gnu
```

## 📋 Checklist Setup

- ✅ MCP Server PostgreSQL dikonfigurasi di `.mcp.json`
- ✅ Connection string sudah benar (username, password, port, database)
- ✅ Docker Compose dikonfigurasi dengan environment variables
- ✅ PostgreSQL container berjalan dan dapat diakses
- ✅ Password disimpan aman di `.env` dan di-ignore dari git

## 🔧 Troubleshooting

Jika ada masalah koneksi:

1. **Cek PostgreSQL container running:**
   ```bash
   docker-compose ps
   ```

2. **Cek logs:**
   ```bash
   docker-compose logs postgres
   ```

3. **Test koneksi manual:**
   ```bash
   docker exec erp_adi_postgres psql -U postgres -d erp_adi -c "SELECT version();"
   ```

4. **Restart container:**
   ```bash
   docker-compose restart postgres
   ```
