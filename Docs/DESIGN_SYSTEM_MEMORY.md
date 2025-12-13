# 🎨 ERP ADI Design System Memory
## Referensi Design Standard dari Halaman Faktur

> Memori ini berisi ekstraksi design system dari halaman `/dashboard/sales/faktur` yang menjadi standar untuk semua halaman baru.

---

## 🎯 DESIGN PRINCIPLES

### Color Palette Utama
- **Primary**: #d95d39 (terracotta warm) - untuk buttons, actions, selected states
- **Neutral**: warmgray-50 sampai warmgray-900 - untuk text, borders, backgrounds
- **Surface**: #f0f2f5 (main bg), #ffffff (cards), #fafafb (striped rows)
- **Semantic**: green (success/lunas), red (danger), yellow (warning), blue (info)

### Typography Hierarchy
- **text-xs** (12px): Table content, tags, supporting text
- **text-sm** (14px): Body text, inputs, dropdowns - **MOST COMMON**
- **text-base** (16px): Emphasis, totals
- **text-lg** (18px): Section headers
- **Font weights**: medium (default) → semibold (labels) → bold (titles)

### Spacing Standards
- **Compact UI**: p-2, py-1.5 px-2 (tables)
- **Standard**: px-3 py-2 (buttons), px-4 py-2 (table cells)
- **Sections**: p-6 (cards), px-6 py-3 (action bars)
- **Gaps**: gap-2 (icon+text), gap-3 (buttons), gap-6 (form fields)

### Border Radius
- **rounded** (4px): DEFAULT untuk inputs & buttons
- **rounded-lg** (8px): Cards, containers
- **rounded-full**: Pills, radio dots, toggles

### Shadows
- **shadow-sm**: Inputs, subtle lift
- **shadow-md**: Primary buttons
- **shadow-lg**: Dropdowns
- **shadow-xl**: Modals

### Z-Index Hierarchy
- z-0: Background decorations
- z-10-20: Content, sticky headers
- z-30-40: Fixed bars, sidebar
- z-50: Dropdowns (portal)
- z-[9999]: Modals (portal)

---

## 🧩 ARSITEKTUR KOMPONEN STANDARD

### 4-Layer Architecture
1. **Route Pages** (thin): Minimal logic, delegate ke View
2. **View Components** (smart): Data fetching, state management
3. **Business Components** (controlled): Forms, tables, specialized UI
4. **Shared UI** (dumb): Button, Modal, Input, Select

### Layout Pattern Utama
```
Sidebar (60px) + Content (flex-1)
  └─ Header (optional, sticky)
  └─ Scrollable Content (flex-1 overflow-auto)
  └─ Footer Action Bar (sticky)
```

---

## ✨ DESIGN PATTERNS WAJIB

### 1. Portal Pattern
Untuk dropdown, modal, tooltip → gunakan `createPortal(component, document.body)` untuk escape z-index conflicts.

### 2. Click Outside Detection
Semua dropdown/popover harus bisa close saat click outside dengan event listener.

### 3. Striped Tables
`odd:bg-white even:bg-warmgray-50 hover:bg-primary-50` untuk readability.

### 4. Sticky Headers
Table header: `sticky top-0 z-20 bg-warmgray-50`

### 5. Loading States
- **Skeleton**: `animate-shimmer` dengan gradient
- **Spinner**: `<Loader2 className="animate-spin" />`

### 6. Watermark Stamps
Status overlay (LUNAS, DRAFT): opacity-20, rotate-12, z-0, border-4

### 7. Custom Radio/Toggle
Tidak pakai default browser, buat custom dengan Tailwind untuk konsistensi.

### 8. Hover Transitions
Semua interactive element harus punya `hover:` state + `transition-colors/all`.

---

## 🎨 COMPONENT CLASSES TEMPLATE

### Button Classes
```tsx
// Primary
"px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded shadow-md transition-colors"

// Secondary
"px-3 py-2 bg-white hover:bg-warmgray-50 border border-warmgray-300 rounded transition-colors"

// Icon Only
"p-2 hover:bg-warmgray-100 rounded transition-colors"
```

### Input Classes
```tsx
"w-full px-3 py-2 border border-warmgray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
```

### Card Classes
```tsx
"bg-white rounded-lg shadow-sm border border-warmgray-200 overflow-hidden"
```

### Modal Classes
```tsx
// Backdrop
"fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"

// Modal Content
"bg-white rounded-lg shadow-xl w-full max-w-md"

// Modal Header
"bg-[#1e293b] px-4 py-3 text-white flex justify-between items-center"

// Modal Footer
"bg-warmgray-50 px-6 py-3 border-t flex justify-end gap-3"
```

### Table Classes
```tsx
// Table
"w-full text-xs"

// Header
"bg-warmgray-50 sticky top-0 z-20 border-b border-warmgray-200"

// Header Cell
"py-2 px-4 text-left font-semibold text-warmgray-600 border-r border-warmgray-200"

// Row
"odd:bg-white even:bg-warmgray-50 hover:bg-primary-50 cursor-pointer transition-colors"

// Cell
"py-1.5 px-3 text-warmgray-900 border-r border-warmgray-100"
```

### Field Label
```tsx
"block text-[10px] font-bold text-warmgray-500 uppercase tracking-wider mb-1"
```

---

## 🚀 BEST PRACTICES CHECKLIST

Saat buat halaman/komponen baru:

✅ **Warna**: Gunakan warmgray (bukan gray), primary #d95d39
✅ **Spacing**: Kelipatan 4px, konsisten gap-2/3/6
✅ **Radius**: `rounded` untuk standard, bukan `rounded-lg`
✅ **Typography**: text-sm untuk body, text-xs untuk table
✅ **Hover**: Semua clickable punya hover state + transition
✅ **Portal**: Dropdown/modal pakai createPortal
✅ **Z-Index**: Ikuti hierarchy, jangan random nilai
✅ **Loading**: Skeleton untuk list, spinner untuk action
✅ **Empty State**: italic text-warmgray-400
✅ **Validation**: text-red-500 untuk error
✅ **Focus**: focus:ring-1 focus:ring-primary-500
✅ **Responsive**: Mobile-first, grid-cols-1 md:grid-cols-2

---

## 🚫 ANTI-PATTERNS (HINDARI!)

❌ Mixing `rounded` dan `rounded-lg` pada elemen sejenis
❌ Random z-index values (z-[147])
❌ Inline styles untuk theme colors
❌ Missing transition pada hover states
❌ Hardcoded colors, gunakan Tailwind classes
❌ Div untuk button, pakai semantic `<button>`
❌ Label tanpa `for` attribute

---

## 📚 UTILITY FUNCTIONS

### cn() - Classname Merger
```tsx
import { cn } from '@/lib/utils';
className={cn("base", condition && "conditional")}
```

### formatCurrency()
```tsx
import { formatCurrency } from '@/lib/utils';
formatCurrency(10000) // "Rp 10.000"
```

### Debounce
```tsx
import { debounce } from '@/hooks/useDebounce';
const debouncedFn = useRef(debounce(fn, 500)).current;
```

---

## 🔗 FILE REFERENCES

**Live Examples**:
- Form: `frontend/components/business/InvoiceForm.tsx`
- View: `frontend/components/views/sales/FakturView.tsx`
- UI Components: `frontend/components/ui/*.tsx`
- Utils: `frontend/lib/utils.ts`

**Full Documentation**:
- `Docs/DESIGN_SYSTEM_REFERENCE.md` - Dokumentasi lengkap 100+ halaman
- `Docs/PERBAIKAN_UI_UX.md` - Changelog recent improvements

---

## 🎯 PENGGUNAAN MEMORI INI

Ketika user meminta buat halaman/komponen baru:
1. Cek memori ini untuk pattern reference
2. Gunakan class templates yang sudah defined
3. Ikuti checklist best practices
4. Hindari anti-patterns
5. Maintain konsistensi dengan Faktur page

**Status**: ✅ Active Design System Memory - Berlaku untuk semua halaman baru ERP ADI