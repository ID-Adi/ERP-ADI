# 📋 Dokumentasi Perbaikan UI/UX Formulir Faktur

## 1️⃣ TABEL BIAYA LAINNYA (InvoiceCostsView)

### SEBELUM:
```
┌────────┬─────────────────┬─────────┬──────────┐
│ Action │  Nama Biaya     │ Kode #  │ Jumlah   │
├────────┼─────────────────┼─────────┼──────────┤
│ Edit   │ Aset Lancar     │ 1105    │ Rp 20.00 │
│ Del    │ Lainnya         │         │          │
└────────┴─────────────────┴─────────┴──────────┘
```

### SESUDAH:
```
┌────┬─────────────────┬─────────┬──────────┐
│ No │  Nama Biaya     │ Kode #  │ Jumlah   │
├────┼─────────────────┼─────────┼──────────┤
│ 1  │ Aset Lancar     │ 1105    │ Rp 20.00 │
│    │ Lainnya (CLICK) │         │          │
└────┴─────────────────┴─────────┴──────────┘
```

### PERUBAHAN LOGIKA:
- ✅ Hapus column "Action" dengan icon Edit & Delete
- ✅ Ganti dengan column "No" yang menampilkan nomor urut (1, 2, 3...)
- ✅ Seluruh row menjadi clickable → membuka modal edit
- ✅ Modal edit menampilkan button **"Hapus"** di footer (pojok kiri) saat edit mode

### FLOW INTERAKSI:
```
User Click Row
    ↓
Modal Terbuka (Edit Mode)
    ↓
┌─────────────────────────────┐
│ Rincian Biaya               │
│ ┌─────────────────────────┐ │
│ │ Kode #: 1105            │ │
│ │ Nama Biaya: Aset Lancar │ │
│ │ Jumlah: Rp 20.000       │ │
│ │ Catatan: ...            │ │
│ └─────────────────────────┘ │
│                             │
│ [Hapus] ← [Batal] [Lanjut]  │ ← Delete hanya saat edit!
└─────────────────────────────┘
    ↓
User Klik "Hapus"
    ↓
Data Dihapus dari Table
```

---

## 2️⃣ BUTTON SYARAT PEMBAYARAN (PaymentTermSelect)

### SEBELUM:
```
┌──────────────────────────────────────────┐
│ Pilih Syarat Pembayaran              ˅  │  ← rounded-lg (terlalu bulat)
└──────────────────────────────────────────┘
```

### SESUDAH:
```
┌──────────────────────────────────────────┐
│ Pilih Syarat Pembayaran              ˅  │  ← rounded (konsisten)
└──────────────────────────────────────────┘
```

### PERUBAHAN:
- ✅ Ganti `rounded-lg` → `rounded`
- ✅ Dropdown menu juga diubah dari `rounded-lg` → `rounded`
- ✅ Konsisten dengan button lainnya di formulir

---

## 3️⃣ BACKDROP MODAL (Z-INDEX)

### SEBELUM:
```
z-[9999]  ← Modal Content
z-[100]   ← Backdrop (RENDAH!)
z-[30]    ← Header

Hasil: Header terlihat di atas backdrop ❌
```

### SESUDAH:
```
z-[9999]  ← Modal Content
z-[9999]  ← Backdrop (TINGGI!)
z-[30]    ← Header

Hasil: Backdrop menutupi header ✅
```

### PERUBAHAN:
- ✅ Ubah z-index backdrop dari `z-[100]` → `z-[9999]`
- ✅ Backdrop sekarang menutupi semua elemen termasuk header
- ✅ Modal muncul di layer paling atas

### VISUAL:
```
SEBELUM (Bug):
┌─────────────────────────────────┐
│ Header (TERLIHAT!)              │  ← z-30
├─────────────────────────────────┤
│ ████ Modal Dialog ████           │
│ ████ (Modal z-100)  ████        │  ← z-100
│ ████ Backdrop di bwh ████       │
└─────────────────────────────────┘

SESUDAH (Fixed):
┌─────────────────────────────────┐
│ ██████ BACKDROP ██████          │  ← z-9999
│ ██ Modal Dialog (z-9999) ██     │
│ ██████████████████████████      │
└─────────────────────────────────┘
   (Header tertutup)
```

---

## 4️⃣ TABEL RINCIAN BARANG (InvoiceItemsView)

### SEBELUM:
```
┌──┬──────────────┬────────┬───────┬───────────┬──────┐
│  │ Barang       │ Catatan│ Kode  │ Kuantitas │ ...  │
├──┼──────────────┼────────┼───────┼───────────┼──────┤
│= │ Barang A     │ ...    │ ITM-1 │ 1         │ ...  │  ← Symbol "="
│= │ Barang B     │ ...    │ ITM-2 │ 2         │ ...  │
└──┴──────────────┴────────┴───────┴───────────┴──────┘
```

### SESUDAH:
```
┌────┬──────────────────┬────────┬───────┬───────────┬──────┐
│ No │ Barang & Jasa    │ Catatan│ Kode  │ Kuantitas │ ...  │
├────┼──────────────────┼────────┼───────┼───────────┼──────┤
│ 1  │ Barang A         │ ...    │ ITM-1 │ 1         │ ...  │  ← Nomor urut
│ 2  │ Barang B         │ ...    │ ITM-2 │ 2         │ ...  │
└────┴──────────────────┴────────┴───────┴───────────┴──────┘
```

### PERUBAHAN:
- ✅ Ubah header dari kosong → "No"
- ✅ Ubah text header "Barang" → "Barang & Jasa"
- ✅ Ubah isi cell dari "=" → nomor urut (1, 2, 3...)
- ✅ Nomor urut menggunakan styling `font-semibold text-warmgray-600`

---

## 📊 RINGKASAN PERUBAHAN FILE

| File | Perubahan | Status |
|------|-----------|--------|
| `InvoiceCostsView.tsx` | Column action → No + row clickable + delete button di modal | ✅ |
| `PaymentTermSelect.tsx` | rounded-lg → rounded | ✅ |
| `InvoiceItemsView.tsx` | Header "Barang" → "Barang & Jasa" + "=" → nomor urut | ✅ |

---

## 🔄 ALUR LOGIKA LENGKAP

### Skenario 1: Edit Biaya Lainnya
```
User Lihat Tabel Biaya
    ↓
User Click Row (No 1, 2, 3...)
    ↓
Modal Edit Terbuka
    ↓
┌──────────────────────────────┐
│ Rincian Biaya                │
│ KODE #: 1105                 │
│ NAMA BIAYA: Aset Lancar ...  │
│ JUMLAH: [input] Rp           │
│ CATATAN: [textarea]          │
├──────────────────────────────┤
│ [Hapus]  [Batal] [Lanjut]    │ ← Delete button (edit mode)
└──────────────────────────────┘
    ↓
User Edit Data atau Klik Hapus
    ↓
Save/Delete → Data Updated
    ↓
Kembali ke Tabel dengan Data Terbaru
```

### Skenario 2: Tambah Biaya Lainnya Baru
```
User Klik Select Akun Perkiraan
    ↓
User Pilih Akun
    ↓
Modal Terbuka (Add Mode)
    ↓
┌──────────────────────────────┐
│ Rincian Biaya                │
│ KODE #: 1105                 │
│ NAMA BIAYA: Aset Lancar ...  │
│ JUMLAH: [input] Rp           │
│ CATATAN: [textarea]          │
├──────────────────────────────┤
│          [Batal] [Lanjut]    │ ← Hapus button TIDAK muncul
└──────────────────────────────┘
    ↓
User Input Data dan Klik Lanjut
    ↓
Data Ditambah ke Tabel
    ↓
Tabel Menampilkan Row Baru dengan No urut
```

---

## 🎨 CODE CHANGES DETAIL

### InvoiceCostsView.tsx
```javascript
// SEBELUM (line 192-194)
<th className="w-12 py-2 text-center border-r border-warmgray-200">
    <MoreHorizontal className="h-3 w-3 mx-auto" />
</th>

// SESUDAH (line 192)
<th className="w-12 py-2 text-center border-r border-warmgray-200">No</th>

// SEBELUM (line 211-219) - action buttons
<td className="py-1.5 px-2 text-center border-r border-warmgray-100">
    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => handleEdit(item)}><Edit2/></button>
        <button onClick={() => handleDelete(item.id)}><Trash2/></button>
    </div>
</td>

// SESUDAH (line 209-211) - nomor urut
<td className="py-1.5 px-2 text-center border-r border-warmgray-100 font-semibold text-warmgray-600">
    {index + 1}
</td>

// Row dibuat clickable
<tr key={item.id} className="hover:bg-blue-50/30 cursor-pointer" onClick={() => handleEdit(item)}>

// SEBELUM (line 300-316) - footer modal
<div className="bg-warmgray-50 px-6 py-3 flex justify-end gap-3 border-t border-warmgray-200">
    <Button>Batal</Button>
    <Button>Lanjut</Button>
</div>

// SESUDAH (line 291-324) - footer dengan delete button
<div className="bg-warmgray-50 px-6 py-3 flex justify-between gap-3 border-t border-warmgray-200">
    {editingId ? (
        <Button>
            <Trash2/> Hapus
        </Button>
    ) : <div></div>}
    <div className="flex gap-3">
        <Button>Batal</Button>
        <Button>Lanjut</Button>
    </div>
</div>
```

### PaymentTermSelect.tsx
```javascript
// SEBELUM (line 55)
"w-full px-3 py-2 border rounded-lg bg-white flex items-center justify-between text-sm..."

// SESUDAH (line 55)
"w-full px-3 py-2 border rounded bg-white flex items-center justify-between text-sm..."

// SEBELUM (line 70)
className="absolute top-full left-0 right-0 mt-1 bg-white border border-warmgray-200 rounded-lg shadow-lg z-20..."

// SESUDAH (line 70)
className="absolute top-full left-0 right-0 mt-1 bg-white border border-warmgray-200 rounded shadow-lg z-20..."
```

### InvoiceItemsView.tsx
```javascript
// SEBELUM (line 354)
<th className="py-2 px-2 w-[30px] text-center font-semibold text-warmgray-600 border-r border-warmgray-200"></th>
<th className="py-2 px-4 w-[250px] text-left font-semibold text-warmgray-600 border-r border-warmgray-200">Barang</th>

// SESUDAH (line 354-355)
<th className="py-2 px-2 w-[30px] text-center font-semibold text-warmgray-600 border-r border-warmgray-200">No</th>
<th className="py-2 px-4 w-[250px] text-left font-semibold text-warmgray-600 border-r border-warmgray-200">Barang & Jasa</th>

// SEBELUM (line 387)
<td className="py-1.5 px-2 text-center text-warmgray-400 border-r border-warmgray-100">=</td>

// SESUDAH (line 387)
<td className="py-1.5 px-2 text-center font-semibold text-warmgray-600 border-r border-warmgray-100">{index + 1}</td>
```

---

## ✨ HASIL AKHIR

✅ Tabel Biaya Lainnya: Column action → No + clickable row + delete button
✅ Button Syarat Pembayaran: Rounded konsisten
✅ Modal Backdrop: Z-index fixed
✅ Tabel Rincian Barang: Header "Barang & Jasa" + nomor urut

**Status: SELESAI & SIAP PRODUCTION** 🚀
