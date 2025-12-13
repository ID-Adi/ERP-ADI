# 🎨 Design System Reference - ERP ADI
## Referensi Design dari Halaman Faktur (/dashboard/sales/faktur)

> Dokumentasi ini merupakan hasil review menyeluruh terhadap UI/UX halaman Faktur yang dapat dijadikan standar untuk halaman-halaman selanjutnya.

---

## 📐 ARSITEKTUR KOMPONEN

### Layer 1: Route-Level Pages
```
/dashboard/sales/faktur/
├── page.tsx              → List View (thin wrapper ke FakturView)
├── [id]/page.tsx        → Edit Mode (fetch data + render InvoiceForm)
└── new/page.tsx         → Create Mode (default data + render InvoiceForm)
```

**Pattern**: Routing menggunakan Next.js App Router dengan logic minimal di page level, delegate ke View/Form components.

### Layer 2: View Components (Smart)
- **FakturView.tsx**: Hybrid List + Form, state management, data fetching
- **InvoiceForm.tsx**: Form orchestrator, calculations, validations, API integration

### Layer 3: Business Components (Controlled)
- **InvoiceItemsView**: Line items table dengan virtual scrolling
- **InvoiceInfoView**: Metadata form (payment terms, shipping, tax)
- **InvoiceCostsView**: Additional costs management
- **InvoiceHistoryView**: Audit trail display

### Layer 4: Shared UI Components (Dumb)
- Button, Modal, SearchableSelect, DatePicker, Calendar, Toast, Tooltip

---

## 🎨 COLOR SYSTEM

### Primary Palette (Terracotta Warm Theme)
```css
--primary-600: #d95d39  /* Main brand color - buttons, accents */
--primary-700: #c44e2b  /* Hover state */
--primary-500: #D97757  /* Focus rings */
--primary-50:  #fff5f2  /* Light backgrounds */
```

### Neutral Palette (Warmgray)
```css
--warmgray-900: #1C1917  /* Primary text */
--warmgray-700: #44403C  /* Secondary text */
--warmgray-500: #78716C  /* Placeholders */
--warmgray-300: #D6D3D1  /* Borders */
--warmgray-200: #E7E5E4  /* Dividers */
--warmgray-100: #F5F5F4  /* Hover backgrounds */
--warmgray-50:  #FAFAF9  /* Light surfaces */
```

### Surface Colors
```css
--surface-bg:   #f0f2f5  /* Main background */
--surface-card: #ffffff  /* Cards, modals */
--surface-alt:  #fafafb  /* Striped rows */
```

### Semantic Colors
```css
/* Success (LUNAS) */
--success-500: green-500
--success-100: green-100

/* Danger/Error */
--danger-500: red-500
--danger-100: red-100

/* Warning */
--warning-700: yellow-700
--warning-100: yellow-100

/* Info */
--info-600: blue-600
--info-50:  blue-50
```

### Custom Accent Colors
```css
--salmon-light:  #fff5f2  /* Secondary button bg */
--salmon-hover:  #ffeadd  /* Secondary button hover */
--salmon-border: #ffd6c9  /* Secondary button border */
--modal-header:  #1e293b  /* Dark modal header */
```

**Kapan Digunakan**:
- Primary: Action buttons, links, selected states
- Warmgray: Text hierarchy, borders, disabled states
- Surface: Backgrounds, cards, containers
- Semantic: Status indicators, alerts, feedback

---

## 📝 TYPOGRAPHY

### Font Sizes
| Class | Size | Usage |
|-------|------|-------|
| `text-xs` | 12px | Table content, small labels, kode items |
| `text-sm` | 14px | Inputs, dropdowns, body text, buttons |
| `text-base` | 16px | Grand total display |
| `text-lg` | 18px | Section headers (Informasi Faktur) |
| `text-4xl-6xl` | 36-60px | Watermark stamps (LUNAS) |

### Font Weights
| Class | Weight | Usage |
|-------|--------|-------|
| `font-medium` | 500 | Default emphasis, body |
| `font-semibold` | 600 | Table headers, field labels |
| `font-bold` | 700 | Section titles, totals |
| `font-mono` | - | Currency displays (optional) |

### Text Utilities Pattern
```tsx
// Field Labels
<label className="block text-[10px] font-bold text-warmgray-500 uppercase tracking-wider mb-1">
  PELANGGAN <span className="text-red-500">*</span>
</label>

// Primary Text
<span className="text-sm font-medium text-warmgray-900">

// Secondary Text
<span className="text-xs text-warmgray-500">

// Empty States
<p className="py-12 text-center text-warmgray-400 italic">
```

---

## 🔲 SPACING SYSTEM

### Standard Spacing Scale (Tailwind)
```
1 = 0.25rem (4px)
2 = 0.5rem  (8px)
3 = 0.75rem (12px)
4 = 1rem    (16px)
6 = 1.5rem  (24px)
8 = 2rem    (32px)
```

### Component Padding Patterns
```tsx
// Compact (Search bars, toolbar)
<div className="p-2">

// Standard Buttons
<button className="px-3 py-2">

// Table Cells
<td className="px-4 py-2">          // Standard density
<td className="py-1.5 px-2">        // Compact tables

// Cards/Sections
<div className="p-6">

// Bottom Action Bar
<div className="px-6 py-3">
```

### Gap Patterns
```tsx
// Icon + Text
<div className="flex items-center gap-2">
  <Icon className="h-4 w-4" />
  <span>Label</span>
</div>

// Button Groups
<div className="flex gap-3">
  <Button>Batal</Button>
  <Button>Simpan</Button>
</div>

// Form Fields
<div className="space-y-6">
  <Field />
  <Field />
</div>
```

---

## 🔘 BORDER RADIUS

### Hierarchy
| Class | Radius | Usage |
|-------|--------|-------|
| `rounded` | 4px | **Default** - Inputs, small elements |
| `rounded-md` | 6px | Dropdowns, medium cards |
| `rounded-lg` | 8px | Buttons, large cards, containers |
| `rounded-full` | 9999px | Pills, radio dots, toggle switches |

### Directional Radius
```tsx
// Modal
<div className="rounded-t-lg"> // Top only
<div className="rounded-b-lg"> // Bottom only

// Input Groups
<div className="rounded-l-lg"> // Left only
<div className="rounded-r-lg"> // Right only
```

**⚠️ Konsistensi Penting**: Gunakan `rounded` untuk button standar, bukan `rounded-lg` agar seragam.

---

## 🌓 SHADOWS & ELEVATION

### Shadow Scale
```tsx
// Subtle Lift (Inputs, small buttons)
className="shadow-sm"

// Medium Depth (Primary buttons)
className="shadow-md"

// Floating Elements (Dropdowns)
className="shadow-lg"

// Modals
className="shadow-xl"

// Custom Bottom Shadow (Action bar)
className="shadow-[0_-2px_10px_rgba(0,0,0,0.05)]"
```

### Custom Soft Shadows (Tailwind Config)
```js
soft: '0 2px 8px -2px rgba(0,0,0,0.05), 0 4px 16px -4px rgba(0,0,0,0.05)',
'soft-lg': '0 4px 12px -4px rgba(0,0,0,0.08), 0 8px 24px -8px rgba(0,0,0,0.06)',
```

**Kapan Digunakan**:
- No shadow: Flush dengan background
- shadow-sm: Subtle separation
- shadow-md: Interactive elements (buttons)
- shadow-lg: Overlays (dropdowns, tooltips)
- shadow-xl: Dialogs, full modals

---

## 📊 Z-INDEX HIERARCHY

### Strategi Berlapis
```tsx
z-0      // Watermark stamps (background decorations)
z-10     // Table content (relative positioning)
z-20     // Sticky table headers, bottom action bar
z-30     // Top info bar (fixed position)
z-40     // Sidebar navigation
z-50     // Dropdowns, tooltips (portal)
z-[9999] // Modals, global overlays (portal)
```

**Pattern**: Gunakan portal (`createPortal`) untuk dropdowns/modals agar escape dari overflow parent dan z-index conflicts.

---

## ✨ ANIMATION & TRANSITIONS

### Duration Standards
```tsx
duration-150  // Quick (button press)
duration-200  // Standard (hover, fade) ← MOST COMMON
duration-300  // Slow (card hover)
duration-500  // Number animations
```

### Transition Classes
```tsx
// Background/Text Changes
transition-colors

// Multi-property
transition-all

// Transform Only
transition-transform

// Opacity Only
transition-opacity
```

### Custom Animations (globals.css)
```css
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
/* Usage: animate-fade-in */

@keyframes slide-in-right {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}
/* Usage: animate-slide-in-right */

@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}
/* Usage: animate-shimmer (skeleton loading) */
```

### Framer Motion Pattern (Dropdowns)
```tsx
import { motion, AnimatePresence } from 'framer-motion';

<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      {/* Dropdown content */}
    </motion.div>
  )}
</AnimatePresence>
```

### Hover Effects Pattern
```tsx
// Table Rows
className="hover:bg-primary-50 transition-colors"

// Buttons
className="hover:bg-warmgray-50 transition-colors"

// Cards
className="hover:-translate-y-1 hover:shadow-lg transition-all duration-300"

// Icons
className="hover:text-primary-600 transition-colors"
```

---

## 📱 RESPONSIVE DESIGN

### Breakpoint Strategy
```tsx
// Mobile First Approach
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// Container Max Width
<div className="w-full max-w-xl mx-auto">

// Adaptive Margin
<div className="ml-auto lg:ml-0">
```

### Layout Patterns
```tsx
// Vertical Stack (Mobile First)
<div className="flex flex-col h-full">

// 12-Column Grid (Desktop Forms)
<div className="grid grid-cols-12 gap-4">
  <label className="col-span-4">Label</label>
  <input className="col-span-8" />
</div>

// Flexible Container
<div className="flex-1 min-w-0 overflow-auto">
```

### Density Control
```tsx
// Compact Table (Desktop)
<table className="text-xs">
  <td className="py-1.5 px-2">

// Touch-Friendly (Mobile consideration)
<button className="h-10 px-4"> // Minimal 40px height untuk touch
```

---

## 🧩 DESIGN PATTERNS

### 1. Portal Pattern (Z-Index Escape)
```tsx
import { createPortal } from 'react-dom';

function Dropdown() {
  return createPortal(
    <div className="fixed z-50" style={{ top: coords.top, left: coords.left }}>
      {/* Content */}
    </div>,
    document.body
  );
}
```

**Digunakan di**: Modal, SearchableSelect, DatePicker, Tooltip

---

### 2. Click Outside Detection
```tsx
const dropdownRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);
```

---

### 3. Striped Table Rows
```tsx
<tbody>
  {items.map((item, index) => (
    <tr className="odd:bg-white even:bg-warmgray-50 hover:bg-primary-50">
      {/* Cells */}
    </tr>
  ))}
</tbody>
```

---

### 4. Sticky Headers Pattern
```tsx
<div className="flex-1 overflow-auto">
  <table>
    <thead className="sticky top-0 z-20 bg-warmgray-50">
      <tr>{/* Headers */}</tr>
    </thead>
    <tbody>{/* Rows */}</tbody>
  </table>
</div>
```

---

### 5. Loading States

#### Skeleton Loading
```tsx
{loading && (
  [...Array(5)].map((_, i) => (
    <div key={i} className="h-4 w-full rounded animate-shimmer bg-gradient-to-r from-warmgray-100 via-warmgray-200 to-warmgray-100" />
  ))
)}
```

#### Spinner
```tsx
import { Loader2 } from 'lucide-react';

{loading && (
  <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
)}
```

---

### 6. Watermark Stamp Pattern
```tsx
<div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-20 z-0">
  <div className="border-4 border-green-500 text-green-500 font-bold text-6xl px-8 py-2 transform -rotate-12 rounded-lg tracking-widest">
    LUNAS
  </div>
</div>
```

**Usage**: Status indicators yang tidak mengganggu content (LUNAS, DRAFT, VOID)

---

### 7. Custom Radio Buttons
```tsx
<label className={cn(
  "flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all",
  isSelected && "border-primary-500 bg-primary-50 ring-1 ring-primary-500"
)}>
  <div className="relative w-4 h-4 rounded-full border-2 border-warmgray-300">
    {isSelected && (
      <div className="absolute inset-0 m-auto w-2 h-2 rounded-full bg-primary-600" />
    )}
  </div>
  <span className={cn("text-sm", isSelected && "font-medium text-primary-700")}>
    {label}
  </span>
</label>
```

---

### 8. Toggle Switch
```tsx
const [isOn, setIsOn] = useState(false);

<div
  onClick={() => setIsOn(!isOn)}
  className={cn(
    "w-9 h-5 rounded-full relative transition-colors cursor-pointer",
    isOn ? "bg-primary-500" : "bg-warmgray-300"
  )}
>
  <div
    className="absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm"
    style={{ transform: isOn ? 'translateX(18px)' : 'translateX(2px)' }}
  />
</div>
```

---

### 9. Search Input Pattern
```tsx
<div className="relative">
  <input
    type="text"
    placeholder="Cari..."
    className="w-full pl-3 pr-8 py-1.5 border border-warmgray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
  />
  <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-warmgray-400 pointer-events-none" />
</div>
```

---

### 10. Button Variants
```tsx
// Primary
<button className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded shadow-md transition-colors">

// Secondary (Outline)
<button className="px-3 py-2 bg-white hover:bg-warmgray-50 text-warmgray-700 border border-warmgray-300 rounded transition-colors">

// Tertiary (Ghost)
<button className="px-3 py-2 text-primary-600 hover:bg-primary-50 rounded transition-colors">

// Danger
<button className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded shadow-md transition-colors">

// Icon Only
<button className="p-2 hover:bg-warmgray-100 rounded transition-colors">
  <Icon className="h-5 w-5" />
</button>
```

---

## 📐 LAYOUT PATTERNS

### 1. Sidebar + Content Layout
```tsx
<div className="flex h-full">
  {/* Sidebar */}
  <div className="w-[60px] flex-shrink-0 bg-white border-r">
    {/* Sidebar buttons */}
  </div>

  {/* Main Content */}
  <div className="flex-1 flex flex-col min-w-0">
    {/* Header (optional) */}
    <div className="flex-shrink-0 bg-white border-b px-6 py-4">

    {/* Scrollable Content */}
    <div className="flex-1 overflow-auto p-6">

    {/* Footer (sticky) */}
    <div className="flex-shrink-0 bg-white border-t px-6 py-3">
  </div>
</div>
```

### 2. Card Pattern
```tsx
<div className="bg-white rounded-lg shadow-sm border border-warmgray-200 overflow-hidden">
  {/* Card Header */}
  <div className="px-6 py-4 border-b border-warmgray-200 bg-warmgray-50">
    <h3 className="font-semibold text-warmgray-900">Title</h3>
  </div>

  {/* Card Body */}
  <div className="p-6">
    {/* Content */}
  </div>

  {/* Card Footer (optional) */}
  <div className="px-6 py-3 border-t border-warmgray-200 bg-warmgray-50">
    {/* Actions */}
  </div>
</div>
```

### 3. Modal Pattern
```tsx
{isOpen && createPortal(
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
      {/* Modal Header */}
      <div className="flex justify-between items-center bg-[#1e293b] px-4 py-3 text-white">
        <h3 className="font-semibold">Modal Title</h3>
        <button onClick={onClose}>
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Modal Body */}
      <div className="p-6">
        {/* Content */}
      </div>

      {/* Modal Footer */}
      <div className="bg-warmgray-50 px-6 py-3 flex justify-end gap-3 border-t">
        <Button variant="secondary">Batal</Button>
        <Button variant="primary">Simpan</Button>
      </div>
    </div>
  </div>,
  document.body
)}
```

### 4. Form Grid Pattern
```tsx
<div className="grid grid-cols-12 gap-4 items-center">
  <label className="col-span-4 text-sm font-semibold text-warmgray-700">
    Field Label
  </label>
  <div className="col-span-8">
    <input className="w-full px-3 py-2 border rounded" />
  </div>
</div>
```

---

## 🛠️ COMPONENT UTILITIES

### cn() - Class Name Merger
```tsx
import { cn } from '@/lib/utils';

<div className={cn(
  "base-classes",
  condition && "conditional-classes",
  dynamicValue === 'foo' ? "foo-classes" : "bar-classes"
)} />
```

### formatCurrency()
```tsx
import { formatCurrency } from '@/lib/utils';

formatCurrency(10000)     // "Rp 10.000"
formatCurrency(1500000)   // "Rp 1.500.000"
```

### Debounce Pattern
```tsx
import { debounce } from '@/hooks/useDebounce';

const debouncedSearch = useRef(
  debounce((query: string) => {
    performSearch(query);
  }, 500)
).current;
```

---

## ✅ BEST PRACTICES

### 1. Konsistensi Warna
- ✅ Gunakan warmgray untuk text/borders, bukan gray
- ✅ Primary color (#d95d39) untuk semua action buttons
- ✅ Semantic colors untuk status (success, warning, danger)

### 2. Spacing Consistency
- ✅ Gunakan kelipatan 4px (Tailwind scale)
- ✅ Gap 2-3 untuk inline elements, 4-6 untuk sections
- ✅ Padding 6 untuk card bodies, 3 untuk headers/footers

### 3. Typography Hierarchy
- ✅ `text-xs` untuk supporting text (table, tags)
- ✅ `text-sm` untuk body text & inputs
- ✅ `text-base` untuk emphasis
- ✅ `uppercase tracking-wider` untuk field labels

### 4. Interactive States
- ✅ Selalu tambahkan hover state untuk clickable elements
- ✅ Gunakan `transition-colors` untuk smooth changes
- ✅ Cursor pointer untuk interactive elements
- ✅ Disabled state dengan opacity-50 dan cursor-not-allowed

### 5. Accessibility
- ✅ Label untuk semua form inputs
- ✅ Placeholder sebagai hint, bukan replacement untuk label
- ✅ Focus ring dengan `focus:ring-1 focus:ring-primary-500`
- ✅ Semantic HTML (button untuk actions, tidak div)

### 6. Performance
- ✅ Virtual scrolling untuk list panjang (react-virtualized)
- ✅ Debounce untuk search inputs (500ms)
- ✅ Lazy load untuk heavy components
- ✅ Memo untuk expensive calculations

---

## 🚫 ANTI-PATTERNS (HINDARI)

### ❌ Inkonsistensi Rounded
```tsx
// SALAH - Mixing radius sizes
<button className="rounded-lg">
<input className="rounded">

// BENAR - Consistent radius
<button className="rounded">
<input className="rounded">
```

### ❌ Z-Index Chaos
```tsx
// SALAH - Random z-index values
<div className="z-[147]">

// BENAR - Documented hierarchy
<div className="z-50"> // Dropdown (as per hierarchy)
```

### ❌ Inline Styles untuk Theme Values
```tsx
// SALAH - Hardcoded colors
<div style={{ color: '#d95d39' }}>

// BENAR - Tailwind classes
<div className="text-primary-600">
```

### ❌ Missing Transitions
```tsx
// SALAH - Jarring state change
<button className="bg-primary-600 hover:bg-primary-700">

// BENAR - Smooth transition
<button className="bg-primary-600 hover:bg-primary-700 transition-colors">
```

---

## 📚 QUICK REFERENCE CHEATSHEET

### Button Classes
```tsx
// Primary Button
"px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded shadow-md transition-colors"

// Secondary Button
"px-3 py-2 bg-white hover:bg-warmgray-50 text-warmgray-700 border border-warmgray-300 rounded transition-colors"

// Icon Button
"p-2 hover:bg-warmgray-100 rounded transition-colors"
```

### Input Classes
```tsx
"w-full px-3 py-2 border border-warmgray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
```

### Card Classes
```tsx
"bg-white rounded-lg shadow-sm border border-warmgray-200"
```

### Table Classes
```tsx
// Table
"w-full text-xs"

// Header
"bg-warmgray-50 sticky top-0 z-20"

// Row
"odd:bg-white even:bg-warmgray-50 hover:bg-primary-50 transition-colors"

// Cell
"px-4 py-2 text-left"
```

---

## 🎯 IMPLEMENTASI CHECKLIST

Saat membuat halaman baru, pastikan:

- [ ] Gunakan warmgray palette untuk neutrals
- [ ] Primary color (#d95d39) untuk actions
- [ ] Consistent border-radius (`rounded` untuk standard)
- [ ] Spacing kelipatan 4px
- [ ] Hover states untuk interactive elements
- [ ] Transition classes untuk smooth animations
- [ ] Portal pattern untuk dropdowns/modals
- [ ] Z-index sesuai hierarchy
- [ ] Typography hierarchy (xs/sm/base)
- [ ] Loading states (skeleton/spinner)
- [ ] Empty states dengan italic warmgray-400
- [ ] Form validation dengan red-500
- [ ] Responsive grid (mobile-first)
- [ ] Focus rings untuk accessibility

---

**File Paths Penting untuk Referensi**:
- Main Form: `frontend/components/business/InvoiceForm.tsx`
- View Logic: `frontend/components/views/sales/FakturView.tsx`
- UI Components: `frontend/components/ui/*.tsx`
- Utils: `frontend/lib/utils.ts`
- Globals CSS: `frontend/app/globals.css`

**Status**: ✅ Dokumentasi Lengkap - Siap Dijadikan Referensi
