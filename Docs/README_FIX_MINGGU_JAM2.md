# Fix Bug - Minggu, Jam 14:00

## Penyebab Error
File `salesReturn.service.ts` tidak ditemukan di `backend/src/domain/sales/`, padahal di-import oleh `salesReturn.controller.ts`.

```
error TS2307: Cannot find module '../../domain/sales/salesReturn.service'
```

## Perbaikan
Membuat file baru `salesReturn.service.ts` dengan:
- `create()` - Membuat sales return dengan auto-generate nomor (RET/YYYY/MM/XXXX)
- `getByFakturId()` - Mengambil data return berdasarkan ID faktur

## Dampak Setelah Fix

**Backend:**
- Build berhasil tanpa error
- API endpoint `/sales-return` bisa digunakan (POST & GET)

**Frontend:**
- Fitur Sales Return bisa memanggil API create & get
- Data return bisa ditampilkan per faktur

---

# Fix Frontend Build Errors - Minggu, Jam 14:00 (Part 2)

## Penyebab Error

| Error | File | Penyebab |
|-------|------|----------|
| `'Calendar' is not defined` | `items-per-warehouse/page.tsx` | Icon Calendar dipakai tapi tidak di-import |
| `missing dependency: fetchReport` | `balance-sheet/page.tsx`, `income-statement/page.tsx` | useEffect memanggil fungsi tanpa dependency |
| `missing dependency: formData.*` | `ProductDetailModal.tsx`, `InvoiceForm.tsx`, `ReceiptForm.tsx` | State dipakai tapi tidak di dependencies |

## Perbaikan

1. **items-per-warehouse/page.tsx** - Tambah import `Calendar` dari lucide-react
2. **balance-sheet & income-statement** - Wrap `fetchReport` dengan `useCallback` + fix dependencies
3. **Modal & Form components** - Tambah `eslint-disable-next-line` (mencegah infinite loop)

## Dampak

**Frontend:** Build production berhasil, 32 halaman ter-generate tanpa error

**Backend:** Tidak ada perubahan
