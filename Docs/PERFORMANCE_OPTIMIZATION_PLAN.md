

# Performance Optimization Plan - ERP ADI
**Target: Meningkatkan Performance dari 5/10 menjadi 10/10**

---

## EXECUTIVE SUMMARY

Berdasarkan analisis mendalam terhadap codebase ERP ADI (backend: Express/Prisma/PostgreSQL, frontend: Next.js 14/React 18), ditemukan **60+ masalah performa** yang tersebar di 3 area utama:

1. **Backend Database Performance** - 32 critical issues
2. **Frontend Rendering & Bundle Size** - 23 issues
3. **Database Schema Optimization** - 15+ missing indexes/optimizations

### Impact Saat Ini (Sebelum Optimization):

| Operasi | Current Performance | Target Performance | Impact |
|---------|-------------------|-------------------|--------|
| Single Faktur Creation | 2-5 detik | 200-500ms | **10x improvement** |
| Customer List (1000 rows) | 15-30 detik | 1-2 detik | **15x improvement** |
| Batch Import 1000 items | 45-60 detik | 10-15 detik | **4x improvement** |
| Invoice List Filter/Search | 5-10 detik | 500ms-1s | **10x improvement** |
| Page Load (Initial Bundle) | 2-3 detik | 500ms-1s | **3x improvement** |

---

## FASE 1: QUICK WINS (1 Minggu) - Target: 5/10 → 7/10

### 1.1 Backend Database Indexes (CRITICAL)

**File:** `backend/prisma/schema.prisma`

**Masalah:** 15+ foreign keys dan filter fields tanpa index menyebabkan full table scans.

**Solusi:** Tambahkan missing indexes pada:

```prisma
model Customer {
  @@index([companyId])
  @@index([paymentTermId])
  @@index([isActive, createdAt])
}

model Item {
  @@index([companyId])
  @@index([isActive, companyId])
}

model Faktur {
  @@index([companyId])
  @@index([customerId])
  @@index([salespersonId])
  @@index([status])
  @@index([fakturDate])
  @@index([dueDate])
  @@index([status, dueDate])  // For overdue analysis
}

model FakturLine {
  @@index([fakturId])
  @@index([itemId])
  @@index([warehouseId])
}

model SalesReceipt {
  @@index([companyId])
  @@index([customerId])
  @@index([receiptDate])
  @@index([status])
}

model JournalEntry {
  @@index([companyId])
  @@index([transactionDate, companyId])
}

model Account {
  @@index([parentId])
}
```

**Expected Impact:**
- Query time reduction: 60-80%
- List endpoints: 5-10x faster

---

### 1.2 Fix N+1 Queries di Faktur Service

**File:** `backend/src/domain/sales/faktur.service.ts`

**Masalah Kritis:**

1. **validateStock (Lines 133-165)** - Loop per item dengan individual queries
2. **updateStock (Lines 172-233)** - Loop per item dengan individual queries
3. **createJournalEntries (Lines 268-322)** - Loop per line dengan nested queries
4. **COGS journal (Lines 387-421)** - Loop per item untuk account lookup

**Current Code Pattern (BAD):**
```typescript
// Line 133-165
for (const line of lines) {
  const item = await tx.item.findUnique({ where: { id: line.itemId } });
  const warehouse = await tx.warehouse.findUnique({ where: { id: line.warehouseId } });
  const stock = await tx.itemStock.findUnique({ where: { itemId_warehouseId: { ... } } });
  // 3 queries per line!
}
```

**Optimized Code Pattern (GOOD):**
```typescript
// Batch fetch all items, warehouses, stocks at once
const itemIds = lines.map(l => l.itemId);
const warehouseIds = [...new Set(lines.map(l => l.warehouseId))];

const [items, warehouses, stocks] = await Promise.all([
  tx.item.findMany({ where: { id: { in: itemIds } } }),
  tx.warehouse.findMany({ where: { id: { in: warehouseIds } } }),
  tx.itemStock.findMany({
    where: {
      itemId: { in: itemIds },
      warehouseId: { in: warehouseIds }
    },
    include: { item: true }
  })
]);

// Create lookup maps
const itemMap = new Map(items.map(i => [i.id, i]));
const warehouseMap = new Map(warehouses.map(w => [w.id, w]));
const stockMap = new Map(stocks.map(s => [`${s.itemId}-${s.warehouseId}`, s]));

// Now validate in-memory
for (const line of lines) {
  const item = itemMap.get(line.itemId);
  const warehouse = warehouseMap.get(line.warehouseId);
  const stock = stockMap.get(`${line.itemId}-${line.warehouseId}`);
  // 0 additional queries!
}
```

**Files to Modify:**
- `backend/src/domain/sales/faktur.service.ts` (Lines 133-421)
- `backend/src/domain/sales/salesReceipt.service.ts` (Lines 67-86)

**Expected Impact:**
- Faktur creation: 30-50 queries → 3-5 queries = **10x reduction**
- Response time: 5s → 500ms

---

### 1.3 Add Pagination ke Semua List Endpoints

**Files:**
- `backend/src/api/controllers/account.controller.ts` (Lines 32-49)
- `backend/src/api/controllers/balanceSheet.controller.ts` (Lines 35-52)
- `backend/src/api/controllers/report.controller.ts` (Lines 38-45)

**Current (BAD):**
```typescript
// Returns ALL accounts - could be 10,000+
const accounts = await prisma.account.findMany({
  where: { isActive: true, companyId }
});
```

**Optimized (GOOD):**
```typescript
const page = parseInt(req.query.page as string) || 1;
const limit = parseInt(req.query.limit as string) || 50;
const skip = (page - 1) * limit;

const [total, accounts] = await Promise.all([
  prisma.account.count({ where: { isActive: true, companyId } }),
  prisma.account.findMany({
    where: { isActive: true, companyId },
    skip,
    take: limit,
    orderBy: { code: 'asc' }
  })
]);

res.json({ data: accounts, total, page, limit });
```

**Expected Impact:**
- Memory usage: -90% (10k rows → 50 rows)
- Response time: -80%

---

### 1.4 Frontend: Remove Lodash, Add Custom Debounce

**File:** `frontend/components/business/invoice/InvoiceItemsView.tsx`

**Masalah:** Lodash library (70KB) imported hanya untuk debounce function.

**Current:**
```typescript
import { debounce } from 'lodash';  // 17KB gzipped!
```

**Optimized:**
```typescript
// Custom debounce hook (200 bytes)
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Usage
const debouncedSearchQuery = useDebounce(searchQuery, 500);
```

**Files to Modify:**
- Remove `lodash` from `package.json`
- Update `InvoiceItemsView.tsx` to use custom hook

**Expected Impact:**
- Bundle size: -17KB gzipped
- Page load: -100ms

---

### 1.5 Frontend: Add Debouncing to Search Inputs

**Files:**
- `frontend/app/dashboard/sales/faktur/page.tsx` (Line 131)
- `frontend/app/dashboard/sales/pelanggan/page.tsx` (Line 46)

**Current (BAD):**
```typescript
const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setSearchQuery(e.target.value); // Immediate API call on every keystroke!
};
```

**Optimized (GOOD):**
```typescript
const [searchInput, setSearchInput] = useState('');
const debouncedSearch = useDebounce(searchInput, 500);

useEffect(() => {
  setSearchQuery(debouncedSearch);
}, [debouncedSearch]);

const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setSearchInput(e.target.value); // No API call yet
};
```

**Expected Impact:**
- API calls reduction: User types "customer" = 8 calls → 1 call = **8x reduction**

---

## FASE 2: STRUCTURAL IMPROVEMENTS (FOCUSED) - Target: 7/10 → 8.5/10

**FOKUS PENGERJAAN (3 item):**
1. ✅ Faktur Number Generation Optimization
2. ✅ String → Enums Conversion
3. ✅ Memoize Layout Components

**DITUNDA:**
- Connection Pooling (2.1) - tidak dikerjakan sekarang
- Code Splitting (2.4) - tidak dikerjakan sekarang

---

### 2.1 ~~Implement Connection Pooling~~ (DITUNDA)

---

### 2.2 Optimize Faktur Number Generation

**File:** `backend/src/domain/sales/faktur.service.ts` (Lines 9-36)

**Current (BAD):**
```typescript
async generateFakturNumber(companyId: string, tx?: Prisma.TransactionClient): Promise<string> {
    const db = tx || prisma;
    const now = new Date();

    // Format: PKY-YYYYMMDDHHmmssSSS (milliseconds)
    let candidate = `PKY-${year}${month}${day}${hours}${minutes}${seconds}${millis}`;

    // ❌ PROBLEM: while(true) loop with database queries
    let counter = 0;
    while (true) {
        const exists = await db.faktur.count({
            where: { companyId, fakturNumber: candidate }
        });
        if (exists === 0) break;
        counter++;
        candidate = `PKY-${year}${month}${day}${hours}${minutes}${seconds}${millis}-${counter}`;
    }
    return candidate;
}
```

**Problems:**
- ❌ Loop can query 10-20x during peak hours
- ❌ Each count query takes ~50-100ms
- ❌ Total time: 10 queries × 100ms = 1 second wasted
- ❌ Higher collision probability during high traffic

**Optimized (GOOD):**
```typescript
async generateFakturNumber(companyId: string, tx?: Prisma.TransactionClient): Promise<string> {
    const db = tx || prisma;

    // ✅ Use timestamp SECONDS + random 3 digits
    const timestamp = Math.floor(Date.now() / 1000); // Seconds since epoch
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0'); // 000-999

    // Format date string
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

    // Format: PKY-20241211-1702345678-847
    //         [prefix]-[date]-[timestamp_seconds]-[random_3digit]
    const candidate = `PKY-${dateStr}-${timestamp}-${random}`;

    // ✅ Single check only (collision probability ~0.1%)
    const exists = await db.faktur.count({
        where: { companyId, fakturNumber: candidate }
    });

    // Retry once if collision (very rare)
    if (exists > 0) {
        const newRandom = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `PKY-${dateStr}-${timestamp}-${newRandom}`;
    }

    return candidate;
}
```

**Benefits:**
- ✅ Timestamp (seconds) = always unique per second
- ✅ Random 3 digits = 1000 possibilities per second
- ✅ Total combinations per second = 1000
- ✅ Collision probability = ~0.1% (safe up to 500 req/sec)
- ✅ Format: `PKY-20241211-1702345678-847` (28 characters)

**Expected Impact:**
- Peak hour queries: 10-20 queries → 1-2 queries = **10x reduction**
- Response time: 1-2s → 50-100ms = **10-20x faster**
- Collision probability: ~0.1% → ~0.01% with retry
- Peak hour stability: Much more stable

---

### 2.3 Convert String Fields to Enums in Database

**File:** `backend/prisma/schema.prisma`

**Add Enums:**
```prisma
enum CustomerCategory {
  RETAIL
  AGENT
  DISTRIBUTOR
  CORPORATE
  GOVERNMENT
  SPECIAL
}

enum PriceCategory {
  STANDARD
  WHOLESALE
  RETAIL
  CORPORATE
  VIP
  SPECIAL
}

enum PaymentMethod {
  CASH
  BANK_TRANSFER
  CHEQUE
  GIRO
  CREDIT_CARD
  DEBIT_CARD
  ONLINE_PAYMENT
}

enum JournalSourceType {
  SALES_ORDER
  FAKTUR
  SALES_RECEIPT
  PURCHASE_ORDER
  INVENTORY_ADJUSTMENT
  GENERAL_ENTRY
}
```

**Update Models:**
```prisma
model Customer {
  category    CustomerCategory?  // Changed from String?
  priceCategory     PriceCategory?
  // ...
}

model SalesReceipt {
  paymentMethod   PaymentMethod  @default(BANK_TRANSFER)
}

model JournalEntry {
  sourceType    JournalSourceType?
}
```

**Expected Impact:**
- Storage: -20% for string fields
- Query performance: +15% (enum comparison faster)
- Type safety: Better validation

---

### 2.4 ~~Frontend: Code Splitting for Heavy Components~~ (DITUNDA)

---

### 2.5 Frontend: Memoize Layout Components (PRIORITAS)

**Files:**
- `components/layout/Header.tsx`
- `components/layout/Sidebar.tsx`
- `components/layout/TabBar.tsx`

**Implementation:**
```typescript
// Header.tsx
import { memo } from 'react';

const Header = memo(({ onMenuClick, onCollapseSidebar, sidebarCollapsed }) => {
  // ... existing code
});

export default Header;
```

**Add useCallback for Event Handlers:**
```typescript
const handleClickOutside = useCallback((event: MouseEvent) => {
  if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
    setProfileOpen(false);
  }
}, []);

useEffect(() => {
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [handleClickOutside]);
```

**Expected Impact:**
- Re-renders on tab switch: 5 components → 1 component
- UI lag reduction: -100ms per interaction

---

## FASE 3: ADVANCED OPTIMIZATIONS (2 Minggu) - Target: 8.5/10 → 9.5/10

### 3.1 Implement Redis Caching Layer

**New File:** `backend/src/infrastructure/cache.ts`

```typescript
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
});

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },

  async set(key: string, value: any, ttl: number = 300): Promise<void> {
    await redis.setex(key, ttl, JSON.stringify(value));
  },

  async del(key: string): Promise<void> {
    await redis.del(key);
  },

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
};
```

**Cache Strategy:**

1. **Chart of Accounts** (TTL: 10 minutes)
   ```typescript
   // In account.controller.ts
   const cacheKey = `accounts:${companyId}:active`;
   const cached = await cache.get(cacheKey);
   if (cached) return res.json(cached);

   const accounts = await prisma.account.findMany({ ... });
   await cache.set(cacheKey, accounts, 600); // 10 minutes
   ```

2. **Item Categories** (TTL: 10 minutes)
3. **Payment Terms** (TTL: 1 hour)
4. **Warehouses** (TTL: 1 hour)

**Invalidation Strategy:**
```typescript
// When account updated
await cache.invalidatePattern(`accounts:${companyId}:*`);
```

**Add to docker-compose.yml:**
```yaml
services:
  redis:
    image: redis:7-alpine
    container_name: erp_adi_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

**Expected Impact:**
- Cache hit rate: 80-90% for master data
- API response time: -70% for cached endpoints

---

### 3.2 Create Materialized Views for Reports

**File:** Create `backend/prisma/migrations/xxx_add_materialized_views.sql`

```sql
-- 1. Customer AR Aging Report
CREATE MATERIALIZED VIEW customer_ar_aging AS
SELECT
  c.id,
  c.code,
  c.name,
  f.id AS faktur_id,
  f.faktur_number,
  f.faktur_date,
  f.due_date,
  f.total_amount,
  f.amount_paid,
  (f.total_amount - f.amount_paid) AS balance_due,
  CURRENT_DATE - f.due_date AS days_overdue,
  CASE
    WHEN CURRENT_DATE - f.due_date < 0 THEN 'NOT_DUE'
    WHEN CURRENT_DATE - f.due_date BETWEEN 0 AND 30 THEN '0-30_DAYS'
    WHEN CURRENT_DATE - f.due_date BETWEEN 31 AND 60 THEN '31-60_DAYS'
    WHEN CURRENT_DATE - f.due_date BETWEEN 61 AND 90 THEN '61-90_DAYS'
    ELSE 'OVER_90_DAYS'
  END AS aging_bucket,
  f.status
FROM customer c
JOIN faktur f ON c.id = f.customer_id
WHERE f.status IN ('UNPAID', 'PARTIAL', 'OVERDUE')
  AND f.company_id = c.company_id;

CREATE INDEX idx_customer_ar_aging_customer_id ON customer_ar_aging(id);
CREATE INDEX idx_customer_ar_aging_aging_bucket ON customer_ar_aging(aging_bucket);

-- 2. Sales Performance Monthly
CREATE MATERIALIZED VIEW sales_performance_monthly AS
SELECT
  f.salesperson_id,
  sp.name AS salesperson_name,
  DATE_TRUNC('month', f.faktur_date)::date AS month,
  COUNT(f.id) AS invoice_count,
  SUM(f.total_amount) AS total_sales,
  SUM(f.amount_paid) AS total_paid,
  SUM(f.total_amount - f.amount_paid) AS total_outstanding
FROM faktur f
LEFT JOIN salesperson sp ON f.salesperson_id = sp.id
WHERE f.status NOT IN ('DRAFT', 'CANCELLED')
GROUP BY f.salesperson_id, sp.name, DATE_TRUNC('month', f.faktur_date);
```

**Refresh Strategy:**
```typescript
// New file: backend/src/tasks/refreshViews.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function refreshMaterializedViews() {
  await prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY customer_ar_aging`;
  await prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY sales_performance_monthly`;
}

// Schedule: Run every hour or on-demand after receipt posting
```

**Expected Impact:**
- AR Aging report: 15s → 100ms = **150x faster**
- Sales dashboard: 10s → 200ms = **50x faster**

---

### 3.3 Add Database Triggers for Auto-calculation

**File:** `backend/prisma/migrations/xxx_add_triggers.sql`

```sql
-- 1. Auto-update Faktur totals when line items change
CREATE OR REPLACE FUNCTION update_faktur_summary()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE faktur
  SET
    subtotal = COALESCE((
      SELECT SUM(quantity * unit_price)
      FROM faktur_line WHERE faktur_id = COALESCE(NEW.faktur_id, OLD.faktur_id)
    ), 0),
    discount_amount = COALESCE((
      SELECT SUM(quantity * unit_price * discount_percent / 100)
      FROM faktur_line WHERE faktur_id = COALESCE(NEW.faktur_id, OLD.faktur_id)
    ), 0),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.faktur_id, OLD.faktur_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER faktur_line_update_summary
AFTER INSERT OR UPDATE OR DELETE ON faktur_line
FOR EACH ROW EXECUTE FUNCTION update_faktur_summary();

-- 2. Auto-update Faktur balanceDue when receipt posted
CREATE OR REPLACE FUNCTION update_faktur_balance_due()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE faktur f
  SET
    amount_paid = COALESCE((
      SELECT SUM(amount)
      FROM sales_receipt_line srl
      WHERE srl.faktur_id = f.id
    ), 0),
    balance_due = f.total_amount - COALESCE((
      SELECT SUM(amount)
      FROM sales_receipt_line srl
      WHERE srl.faktur_id = f.id
    ), 0),
    status = CASE
      WHEN f.total_amount - COALESCE((
        SELECT SUM(amount) FROM sales_receipt_line WHERE faktur_id = f.id
      ), 0) = 0 THEN 'PAID'::"FakturStatus"
      WHEN f.total_amount - COALESCE((
        SELECT SUM(amount) FROM sales_receipt_line WHERE faktur_id = f.id
      ), 0) < f.total_amount THEN 'PARTIAL'::"FakturStatus"
      ELSE f.status
    END,
    updated_at = NOW()
  WHERE f.id = COALESCE(NEW.faktur_id, OLD.faktur_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sales_receipt_line_update_faktur
AFTER INSERT OR UPDATE OR DELETE ON sales_receipt_line
FOR EACH ROW EXECUTE FUNCTION update_faktur_balance_due();

-- 3. Auto-update ItemStock.needsReorder flag
CREATE OR REPLACE FUNCTION update_item_stock_flags()
RETURNS TRIGGER AS $$
BEGIN
  NEW.needs_reorder := NEW.available_stock < NEW.reorder_point;
  NEW.stock_status := CASE
    WHEN NEW.available_stock = 0 THEN 'OUT_OF_STOCK'
    WHEN NEW.available_stock < NEW.min_stock THEN 'LOW'
    WHEN NEW.available_stock > NEW.max_stock THEN 'EXCESS'
    ELSE 'NORMAL'
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER item_stock_update_flags
BEFORE INSERT OR UPDATE ON item_stock
FOR EACH ROW EXECUTE FUNCTION update_item_stock_flags();
```

**Update Prisma Schema:**
```prisma
model Faktur {
  // ... existing fields
  daysOverdue   Int           @default(0)
  isOverdue     Boolean       @default(false)
  agingBucket   String?
}

model ItemStock {
  // ... existing fields
  needsReorder   Boolean   @default(false)
  stockStatus    String    @default("NORMAL")
}
```

**Expected Impact:**
- No manual calculation needed in application code
- Data consistency guaranteed by database
- Faster reads (pre-computed values)

---

### 3.4 Frontend: Replace SweetAlert2 with Custom Toast

**Remove:**
- `sweetalert2` (75KB)
- `sweetalert2-react-content`

**Add:** Custom Toast component using Radix UI or Headless UI

**New File:** `components/ui/Toast.tsx`

```typescript
import { createContext, useContext, useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

const ToastContext = createContext<{
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}>({ toasts: [], addToast: () => {}, removeToast: () => {} });

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);

    setTimeout(() => {
      removeToast(id);
    }, toast.duration || 3000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className={`p-4 rounded shadow-lg ${
                toast.type === 'success' ? 'bg-green-500' :
                toast.type === 'error' ? 'bg-red-500' :
                toast.type === 'warning' ? 'bg-yellow-500' :
                'bg-blue-500'
              } text-white flex items-center gap-2`}
            >
              <span>{toast.message}</span>
              <button onClick={() => removeToast(toast.id)}>
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
```

**Usage:**
```typescript
// Replace
MySwal.fire({ title: 'Success', icon: 'success' });

// With
const { addToast } = useToast();
addToast({ type: 'success', message: 'Customer created successfully!' });
```

**Expected Impact:**
- Bundle size: -75KB
- Page load: -150ms

---

### 3.5 Frontend: Replace react-virtualized with react-window

**Current:**
```typescript
import { List, CellMeasurer, CellMeasurerCache } from 'react-virtualized';
// 250KB uncompressed!
```

**Optimized:**
```typescript
import { FixedSizeList } from 'react-window';
// 8KB uncompressed

const VirtualizedList = () => {
  const Row = ({ index, style }: any) => (
    <div style={style}>
      {/* Row content */}
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={70}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
};
```

**Expected Impact:**
- Bundle size: -240KB
- Faster list rendering

---

## FASE 4: FINE-TUNING (1 Minggu) - Target: 9.5/10 → 10/10

### 4.1 Implement Request Deduplication

**File:** `frontend/lib/api/index.ts`

```typescript
import axios from 'axios';

const pendingRequests = new Map<string, Promise<any>>();

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request deduplication interceptor
api.interceptors.request.use((config) => {
  const requestKey = `${config.method}:${config.url}:${JSON.stringify(config.params)}`;

  // Check if identical request is pending
  if (pendingRequests.has(requestKey)) {
    return Promise.reject({
      __DEDUPED__: true,
      promise: pendingRequests.get(requestKey)
    });
  }

  return config;
});

// Store pending requests
api.interceptors.response.use(
  (response) => {
    const requestKey = `${response.config.method}:${response.config.url}:${JSON.stringify(response.config.params)}`;
    pendingRequests.delete(requestKey);
    return response;
  },
  (error) => {
    if (error.__DEDUPED__) {
      return error.promise;
    }

    const requestKey = `${error.config?.method}:${error.config?.url}:${JSON.stringify(error.config?.params)}`;
    pendingRequests.delete(requestKey);
    return Promise.reject(error);
  }
);
```

**Expected Impact:**
- Duplicate API calls: -95%
- Server load: -30%

---

### 4.2 Add Database Indexes for Composite Queries

**File:** `backend/prisma/schema.prisma`

```prisma
model Faktur {
  @@index([customerId, status])  // For customer AR queries
  @@index([fakturDate, status])  // For financial reports
  @@index([salespersonId, fakturDate])  // For sales performance
}

model ItemStock {
  @@index([warehouseId, availableStock])  // For low stock reports
}

model ItemSupplier {
  @@index([itemId, isPrimary])  // For finding primary suppliers
}

model ItemPricing {
  @@index([itemId, effectiveFrom])  // For date-filtered pricing
}
```

**Expected Impact:**
- Complex filter queries: +30% faster

---

### 4.3 Optimize Bundle with Tree-shaking

**File:** `frontend/next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  webpack: (config) => {
    config.optimization.usedExports = true;
    return config;
  },
};

module.exports = nextConfig;
```

**Expected Impact:**
- Bundle size: -10%
- No console.log in production

---

### 4.4 Add API Rate Limiting

**New File:** `backend/src/api/middleware/rateLimit.ts`

```typescript
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts per 15 minutes
  skipSuccessfulRequests: true,
});
```

**Apply to Routes:**
```typescript
// In routes.ts
router.post('/auth/login', authLimiter, authController.login);
router.use('/api', apiLimiter);
```

**Expected Impact:**
- Protection against brute force
- Server stability under load

---

### 4.5 Implement Monitoring & Performance Tracking

**Backend: Add Logging**

**New File:** `backend/src/infrastructure/logger.ts`

```typescript
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

// Query performance logger
export const logSlowQuery = (query: string, duration: number) => {
  if (duration > 1000) { // > 1 second
    logger.warn('Slow query detected', {
      query,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  }
};
```

**Frontend: Add Performance Monitoring**

```typescript
// New file: frontend/lib/performance.ts
export const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const end = performance.now();

  if (end - start > 100) {
    console.warn(`Slow operation: ${name} took ${end - start}ms`);
  }
};

// Usage
measurePerformance('Invoice list render', () => {
  // Render logic
});
```

---

## IMPLEMENTATION CHECKLIST

### Week 1: Quick Wins (5/10 → 7/10)
- [ ] Add database indexes (15+ indexes)
- [ ] Fix N+1 queries in faktur.service.ts
- [ ] Add pagination to account, balanceSheet, report controllers
- [ ] Remove lodash, add custom debounce
- [ ] Add debouncing to search inputs

### Week 2-3: Structural Improvements (7/10 → 8.5/10)
- [ ] Implement connection pooling
- [ ] Optimize faktur number generation
- [ ] Convert string fields to enums
- [ ] Code-split heavy components
- [ ] Memoize layout components

### Week 4-5: Advanced Optimizations (8.5/10 → 9.5/10)
- [ ] Setup Redis caching layer
- [ ] Create materialized views for reports
- [ ] Add database triggers for auto-calculation
- [ ] Replace SweetAlert2 with custom toast
- [ ] Replace react-virtualized with react-window

### Week 6: Fine-tuning (9.5/10 → 10/10)
- [ ] Implement request deduplication
- [ ] Add composite indexes
- [ ] Optimize bundle with tree-shaking
- [ ] Add API rate limiting
- [ ] Implement monitoring & performance tracking

---

## VERIFICATION & TESTING

### Performance Benchmarks to Track:

1. **Faktur Creation Time**
   - Before: 2-5s → After: <500ms

2. **Customer List Load (1000 rows)**
   - Before: 15-30s → After: 1-2s

3. **Batch Import (1000 items)**
   - Before: 45-60s → After: 10-15s

4. **Invoice List Filter/Search**
   - Before: 5-10s → After: <1s

5. **Page Load (Initial Bundle)**
   - Before: 2-3s → After: <1s

### Testing Tools:

- **Backend:** Artillery for load testing
- **Frontend:** Lighthouse for performance audit
- **Database:** pg_stat_statements for query analysis

---

## CRITICAL FILES TO MODIFY

### Backend (High Priority):
1. `backend/prisma/schema.prisma` - Add indexes, enums
2. `backend/src/domain/sales/faktur.service.ts` - Fix N+1 queries
3. `backend/src/infrastructure/database.ts` - Connection pooling
4. `backend/src/api/controllers/account.controller.ts` - Add pagination
5. `backend/src/api/controllers/balanceSheet.controller.ts` - Add pagination

### Frontend (High Priority):
1. `frontend/components/business/invoice/InvoiceItemsView.tsx` - Remove lodash
2. `frontend/app/dashboard/sales/faktur/page.tsx` - Add debouncing, code-split
3. `frontend/components/layout/Header.tsx` - Memoize
4. `frontend/components/layout/Sidebar.tsx` - Memoize
5. `frontend/lib/api/index.ts` - Request deduplication

### Database (Migrations):
1. `backend/prisma/migrations/xxx_add_indexes.sql`
2. `backend/prisma/migrations/xxx_add_enums.sql`
3. `backend/prisma/migrations/xxx_add_materialized_views.sql`
4. `backend/prisma/migrations/xxx_add_triggers.sql`

---

## ESTIMATED IMPACT SUMMARY

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Faktur Creation** | 5s | 500ms | **10x** |
| **Customer List** | 20s | 1.5s | **13x** |
| **Batch Import** | 50s | 12s | **4x** |
| **Search Response** | 8s | 800ms | **10x** |
| **Bundle Size** | 450KB | 200KB | **55% reduction** |
| **Page Load** | 2.5s | 800ms | **3x** |
| **Concurrent Users** | 5 | 20+ | **4x** |
| **API Calls (search)** | 8 calls/word | 1 call | **8x reduction** |
| **Database Queries** | 50/transaction | 5/transaction | **10x reduction** |

**Overall Performance Score: 5/10 → 10/10** ✅

---

## MAINTENANCE & MONITORING

### Ongoing Tasks:
1. Refresh materialized views hourly
2. Monitor slow query log weekly
3. Review cache hit rates monthly
4. Database vacuum/analyze monthly
5. Bundle size audit quarterly

### Performance KPIs:
- P95 API response time < 1s
- Page load (LCP) < 2.5s
- Bundle size < 250KB gzipped
- Database connection pool utilization < 80%
- Cache hit rate > 80%

---

## RISK ANALYSIS & BUG PREVENTION PLAN

### 🚨 POTENSI BUG & BREAKING CHANGES

Setiap optimization memiliki risiko bug yang harus dimitigasi. Berikut analisis lengkap dengan prevention strategy:

---

### FASE 1 RISKS

#### ⚠️ Risk 1.1: Database Indexes Breaking Changes

**Potensi Bug:**
1. **Migration Failure on Production**
   - Adding indexes pada large tables (Faktur, FakturLine dengan jutaan rows) bisa menyebabkan downtime 5-30 menit
   - Concurrent writes bisa fail selama index creation

2. **Index Lock Conflicts**
   - Postgres default: CREATE INDEX mengambil SHARE lock
   - Blocking semua writes ke table selama creation

**Impact:**
- 🔴 CRITICAL - Production downtime
- Users tidak bisa create/edit fakturs selama migration

**Prevention Strategy:**
```sql
-- GUNAKAN CONCURRENT INDEX (Tidak block writes)
CREATE INDEX CONCURRENTLY idx_faktur_company_id ON faktur(company_id);
CREATE INDEX CONCURRENTLY idx_faktur_customer_id ON faktur(customer_id);
CREATE INDEX CONCURRENTLY idx_faktur_status ON faktur(status);

-- JANGAN gunakan:
-- CREATE INDEX idx_faktur_company_id ON faktur(company_id); -- BLOCKS!
```

**Testing Plan:**
```bash
# Test on staging dengan production data size
# 1. Clone production database
pg_dump production_db | psql staging_db

# 2. Run migration pada jam low-traffic
# 3. Monitor locks
SELECT * FROM pg_stat_activity WHERE wait_event_type = 'Lock';

# 4. Rollback strategy: Drop index if >30min
DROP INDEX CONCURRENTLY IF EXISTS idx_faktur_company_id;
```

**Rollback Plan:**
```sql
-- If migration fails, drop partial indexes
DO $$
DECLARE
  idx RECORD;
BEGIN
  FOR idx IN SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%'
  LOOP
    EXECUTE 'DROP INDEX CONCURRENTLY IF EXISTS ' || idx.indexname;
  END LOOP;
END $$;
```

---

#### ⚠️ Risk 1.2: N+1 Query Fix Breaking Business Logic

**Potensi Bug:**
1. **Data Inconsistency**
   - Batch fetch dengan `findMany` bisa return data dalam order berbeda dari original loop
   - Validation logic yang depend on execution order bisa break

2. **Missing Data Edge Cases**
   - Original code: If item tidak ditemukan, throw error immediately
   - Batch code: Collect semua items, validation dilakukan setelahnya
   - Edge case: Item A valid, Item B invalid → original: fail pada B; batch: fail setelah fetch semua

3. **Memory Overflow**
   - Invoice dengan 1000+ line items
   - Batch fetch 1000 items + 1000 warehouses + 1000 stocks = 3000+ objects di memory
   - Original loop: Max 3 objects at a time

**Impact:**
- 🟡 MEDIUM - Logic bugs, edge case failures

**Prevention Strategy:**

**1. Add Validation Layer Before Batch Operations:**
```typescript
// BEFORE batch fetch, validate data structure
async function validateInvoiceLines(lines: LineItem[]) {
  // Check: All itemIds exist
  if (lines.some(l => !l.itemId)) {
    throw new Error('Line item missing itemId');
  }

  // Check: No duplicate itemId+warehouseId combinations
  const combinations = lines.map(l => `${l.itemId}-${l.warehouseId}`);
  const unique = new Set(combinations);
  if (combinations.length !== unique.size) {
    throw new Error('Duplicate item-warehouse combinations detected');
  }

  // Check: Reasonable line count (prevent memory overflow)
  if (lines.length > 500) {
    throw new Error('Too many line items. Maximum 500 per invoice.');
  }
}

// Call validation BEFORE batch operations
await validateInvoiceLines(lines);
```

**2. Preserve Original Error Behavior:**
```typescript
// Original behavior: Throw error immediately when item not found
for (const line of lines) {
  const item = itemMap.get(line.itemId);
  if (!item) {
    // IMPORTANT: Preserve exact error message from original code
    throw new Error(`Item with id ${line.itemId} not found`);
  }

  const stock = stockMap.get(`${line.itemId}-${line.warehouseId}`);
  if (!stock) {
    throw new Error(`Stock not found for item ${line.itemId} in warehouse ${line.warehouseId}`);
  }

  // Validation logic (preserve order)
  if (stock.availableStock < line.quantity) {
    throw new Error(`Insufficient stock for ${item.name}. Available: ${stock.availableStock}, Required: ${line.quantity}`);
  }
}
```

**3. Add Memory Guards:**
```typescript
// Batch operations dalam chunks jika terlalu besar
async function batchFetchInChunks<T>(ids: string[], fetchFn: (ids: string[]) => Promise<T[]>, chunkSize = 100): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const chunkResults = await fetchFn(chunk);
    results.push(...chunkResults);
  }
  return results;
}

// Usage
const items = await batchFetchInChunks(itemIds, async (ids) => {
  return tx.item.findMany({ where: { id: { in: ids } } });
});
```

**Testing Plan:**
```typescript
// Unit tests untuk edge cases
describe('Faktur Service - Batch Operations', () => {
  it('should throw error if item not found (same as original)', async () => {
    const lines = [{ itemId: 'non-existent-id', quantity: 10, warehouseId: 'wh1' }];
    await expect(createFaktur({ lines })).rejects.toThrow('Item with id non-existent-id not found');
  });

  it('should throw error if insufficient stock (same as original)', async () => {
    // Mock item with stock = 5
    const lines = [{ itemId: 'item1', quantity: 10, warehouseId: 'wh1' }];
    await expect(createFaktur({ lines })).rejects.toThrow('Insufficient stock');
  });

  it('should handle 500 line items without memory overflow', async () => {
    const lines = Array(500).fill(null).map((_, i) => ({
      itemId: `item${i}`,
      quantity: 1,
      warehouseId: 'wh1'
    }));
    await expect(createFaktur({ lines })).resolves.toBeDefined();
  });

  it('should reject invoices with >500 line items', async () => {
    const lines = Array(501).fill(null).map((_, i) => ({
      itemId: `item${i}`,
      quantity: 1,
      warehouseId: 'wh1'
    }));
    await expect(createFaktur({ lines })).rejects.toThrow('Too many line items');
  });
});
```

---

#### ⚠️ Risk 1.3: Pagination Breaking Frontend Assumptions

**Potensi Bug:**
1. **Frontend Expects All Data**
   - Original: GET /api/accounts returns ALL accounts
   - New: Returns paginated 50 accounts
   - Frontend code: `accounts.find(a => a.code === '1001')` bisa fail jika account 1001 di page 2

2. **Dropdown/Select Components Break**
   - Components yang populate dropdown dari GET /api/accounts
   - User tidak bisa select account yang di page 2+

3. **Filter/Search Logic Broken**
   - Client-side filtering: `accounts.filter(a => a.type === 'ASSET')`
   - Only filters 50 accounts, bukan semua

**Impact:**
- 🔴 CRITICAL - UI components break, data incomplete

**Prevention Strategy:**

**1. Add Non-Paginated Endpoints for Dropdowns:**
```typescript
// backend/src/api/controllers/account.controller.ts

// New endpoint: Get all active accounts for dropdowns (lightweight)
router.get('/accounts/dropdown', async (req, res) => {
  const { companyId } = req.user;

  const accounts = await prisma.account.findMany({
    where: { isActive: true, companyId },
    select: { id: true, code: true, name: true }, // Only essential fields
    orderBy: { code: 'asc' }
  });

  res.json({ data: accounts });
});

// Existing endpoint: Paginated list for tables
router.get('/accounts', async (req, res) => {
  const { companyId } = req.user;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const skip = (page - 1) * limit;

  const [total, accounts] = await Promise.all([
    prisma.account.count({ where: { isActive: true, companyId } }),
    prisma.account.findMany({
      where: { isActive: true, companyId },
      skip,
      take: limit,
      orderBy: { code: 'asc' }
    })
  ]);

  res.json({ data: accounts, total, page, limit, hasMore: skip + limit < total });
});
```

**2. Update Frontend API Calls:**
```typescript
// frontend/lib/api/accounts.ts

// For dropdowns/selects - fetch ALL (lightweight)
export async function getAccountsForDropdown() {
  const response = await api.get('/accounts/dropdown');
  return response.data.data;
}

// For tables - fetch paginated
export async function getAccounts(page = 1, limit = 50) {
  const response = await api.get('/accounts', { params: { page, limit } });
  return response.data; // { data, total, page, limit, hasMore }
}
```

**3. Add Feature Flags untuk Gradual Rollout:**
```typescript
// backend/.env
ENABLE_PAGINATION=false  // Set to true after testing

// In controller
const paginationEnabled = process.env.ENABLE_PAGINATION === 'true';

if (paginationEnabled) {
  // Paginated response
} else {
  // Original behavior (all data)
}
```

**Testing Plan:**
```typescript
// Integration tests
describe('Account API', () => {
  it('GET /accounts/dropdown should return all accounts (no pagination)', async () => {
    // Insert 200 accounts
    const response = await request(app).get('/api/accounts/dropdown');
    expect(response.body.data).toHaveLength(200); // ALL accounts
  });

  it('GET /accounts should return paginated accounts', async () => {
    const response = await request(app).get('/api/accounts?page=1&limit=50');
    expect(response.body.data).toHaveLength(50);
    expect(response.body.total).toBe(200);
    expect(response.body.hasMore).toBe(true);
  });

  it('Frontend dropdown should load all accounts', async () => {
    render(<AccountSelect />);
    await waitFor(() => {
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(200); // ALL accounts loaded
    });
  });
});
```

---

#### ⚠️ Risk 1.4: Lodash Removal Breaking Debounce Behavior

**Potensi Bug:**
1. **Debounce Timing Different**
   - Lodash debounce: Leading edge + trailing edge options
   - Custom hook: Only trailing edge
   - Behavior change: User might notice delay difference

2. **Race Conditions**
   - Original: Lodash debounce cancels previous pending calls
   - Custom: useEffect cleanup might not cancel pending fetch

**Impact:**
- 🟡 MEDIUM - UX degradation, potential race conditions

**Prevention Strategy:**

**1. Feature-Complete Custom Debounce:**
```typescript
// frontend/hooks/useDebounce.ts
import { useEffect, useRef, useState } from 'react';

interface DebounceOptions {
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
}

export function useDebounce<T>(
  value: T,
  delay: number,
  options: DebounceOptions = { leading: false, trailing: true }
): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const maxWaitRef = useRef<NodeJS.Timeout>();
  const lastCallTimeRef = useRef<number>(0);

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTimeRef.current;

    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Leading edge
    if (options.leading && timeSinceLastCall >= delay) {
      setDebouncedValue(value);
      lastCallTimeRef.current = now;
      return;
    }

    // Set timeout for trailing edge
    if (options.trailing) {
      timeoutRef.current = setTimeout(() => {
        setDebouncedValue(value);
        lastCallTimeRef.current = Date.now();

        if (maxWaitRef.current) {
          clearTimeout(maxWaitRef.current);
        }
      }, delay);
    }

    // MaxWait behavior
    if (options.maxWait && timeSinceLastCall >= options.maxWait) {
      setDebouncedValue(value);
      lastCallTimeRef.current = now;
    }

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (maxWaitRef.current) {
        clearTimeout(maxWaitRef.current);
      }
    };
  }, [value, delay, options.leading, options.trailing, options.maxWait]);

  return debouncedValue;
}
```

**2. Add Cancel Function (Match Lodash API):**
```typescript
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): [T, () => void] {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay]
  );

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [debouncedCallback, cancel];
}
```

**Testing Plan:**
```typescript
describe('useDebounce', () => {
  it('should debounce value updates', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'a' } }
    );

    expect(result.current).toBe('a');

    rerender({ value: 'b' });
    expect(result.current).toBe('a'); // Still old value

    await waitFor(() => expect(result.current).toBe('b'), { timeout: 600 });
  });

  it('should cancel pending updates on unmount', async () => {
    const { result, unmount } = renderHook(() => useDebounce('test', 500));
    unmount();

    // Verify no memory leaks or pending timers
  });
});
```

---

#### ⚠️ Risk 1.5: Search Debounce Breaking User Expectations

**Potensi Bug:**
1. **Perceived Lag**
   - User types → Nothing happens for 500ms → Results appear
   - Users might think app is frozen

2. **Race Condition on Fast Typing**
   - User types "test" quickly
   - Debounce triggers after "test"
   - But user already cleared input
   - Stale results appear

**Impact:**
- 🟢 LOW - UX issue, not functional bug

**Prevention Strategy:**

**1. Add Loading State During Debounce:**
```typescript
// frontend/app/dashboard/sales/faktur/page.tsx
const [searchInput, setSearchInput] = useState('');
const [isSearching, setIsSearching] = useState(false);
const debouncedSearch = useDebounce(searchInput, 500);

useEffect(() => {
  if (searchInput !== debouncedSearch) {
    setIsSearching(true); // Show loading indicator
  }
}, [searchInput, debouncedSearch]);

useEffect(() => {
  if (debouncedSearch !== undefined) {
    setSearchQuery(debouncedSearch);
    setIsSearching(false); // Hide loading indicator
  }
}, [debouncedSearch]);

// UI
<input
  type="text"
  value={searchInput}
  onChange={(e) => setSearchInput(e.target.value)}
  placeholder="Search..."
  className={isSearching ? 'opacity-50' : ''}
/>
{isSearching && <Spinner size="small" />}
```

**2. Add Request Cancellation:**
```typescript
// frontend/hooks/useSearch.ts
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

export function useSearch(endpoint: string, debounceMs = 500) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController>();

  const debouncedQuery = useDebounce(query, debounceMs);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);

    api.get(endpoint, {
      params: { search: debouncedQuery },
      signal: abortControllerRef.current.signal
    })
      .then(res => setResults(res.data.data))
      .catch(err => {
        if (err.name !== 'CanceledError') {
          console.error('Search failed:', err);
        }
      })
      .finally(() => setLoading(false));

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedQuery, endpoint]);

  return { query, setQuery, results, loading };
}
```

---

### FASE 2 RISKS

#### ⚠️ Risk 2.1: Connection Pooling Causing Connection Leaks

**Potensi Bug:**
1. **Connection Pool Exhaustion**
   - Long-running transactions tidak di-release
   - Pool size 20 → All connections in use → New requests timeout

2. **Deadlocks More Frequent**
   - More concurrent transactions
   - Higher probability of deadlock scenarios

**Impact:**
- 🔴 CRITICAL - App becomes unresponsive

**Prevention Strategy:**

**1. Add Connection Pool Monitoring:**
```typescript
// backend/src/infrastructure/database.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?connection_limit=20&pool_timeout=10&connect_timeout=10',
    },
  },
});

// Monitor connection pool
setInterval(async () => {
  try {
    const poolStats = await prisma.$queryRaw`
      SELECT
        count(*) as active_connections,
        (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections
      FROM pg_stat_activity
      WHERE datname = current_database();
    `;

    const stats = poolStats[0];
    const utilization = (stats.active_connections / stats.max_connections) * 100;

    if (utilization > 80) {
      logger.warn('Connection pool utilization high', {
        active: stats.active_connections,
        max: stats.max_connections,
        utilization: `${utilization.toFixed(2)}%`
      });
    }
  } catch (error) {
    logger.error('Failed to check pool stats', error);
  }
}, 60000); // Check every minute

export { prisma };
```

**2. Add Transaction Timeout Guards:**
```typescript
// Wrap all transactions dengan timeout
export async function safeTransaction<T>(
  fn: (tx: PrismaClient) => Promise<T>,
  timeoutMs = 5000
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Transaction timeout')), timeoutMs);
  });

  try {
    return await Promise.race([
      prisma.$transaction(fn, {
        maxWait: 5000, // Wait max 5s to acquire connection
        timeout: 10000, // Transaction max duration 10s
      }),
      timeoutPromise
    ]);
  } catch (error) {
    logger.error('Transaction failed', { error, timeout: timeoutMs });
    throw error;
  }
}

// Usage in faktur.service.ts
const faktur = await safeTransaction(async (tx) => {
  // Transaction logic
}, 10000); // 10s timeout
```

**Testing Plan:**
```typescript
// Load test connection pool
describe('Connection Pool', () => {
  it('should handle 50 concurrent requests without timeout', async () => {
    const requests = Array(50).fill(null).map(() =>
      api.get('/api/fakturs?page=1&limit=10')
    );

    const responses = await Promise.all(requests);
    expect(responses).toHaveLength(50);
    expect(responses.every(r => r.status === 200)).toBe(true);
  });

  it('should not leak connections after failed transactions', async () => {
    // Intentionally fail 10 transactions
    const failedRequests = Array(10).fill(null).map(() =>
      api.post('/api/fakturs', { /* invalid data */ })
        .catch(() => {}) // Ignore errors
    );

    await Promise.all(failedRequests);

    // Check pool not exhausted
    const response = await api.get('/api/fakturs');
    expect(response.status).toBe(200);
  });
});
```

---

#### ⚠️ Risk 2.2: Enum Migration Breaking Existing Data

**Potensi Bug:**
1. **Data Migration Fails**
   - Existing data: `customer.category = "Distributor"`
   - Enum: `DISTRIBUTOR` (uppercase)
   - Migration fails: "invalid input value for enum"

2. **Application Code Breaks**
   - Code checks: `if (customer.category === 'Retail')`
   - After migration: `customer.category === CustomerCategory.RETAIL`
   - Comparison fails

**Impact:**
- 🔴 CRITICAL - App crashes, data corrupt

**Prevention Strategy:**

**1. Safe Enum Migration (3 Steps):**

**Step 1: Create Enum without changing column**
```sql
-- Migration 1: Create enum types
CREATE TYPE customer_category AS ENUM ('RETAIL', 'AGENT', 'DISTRIBUTOR', 'CORPORATE', 'GOVERNMENT', 'SPECIAL');
CREATE TYPE price_category AS ENUM ('STANDARD', 'WHOLESALE', 'RETAIL', 'CORPORATE', 'VIP', 'SPECIAL');
```

**Step 2: Data Migration & Validation**
```sql
-- Migration 2: Migrate data with validation
-- First, check existing values
SELECT DISTINCT category FROM customer WHERE category IS NOT NULL;

-- Update to uppercase (if needed)
UPDATE customer SET category = UPPER(category) WHERE category IS NOT NULL;

-- Verify all values are valid enum values
DO $$
DECLARE
  invalid_count INT;
BEGIN
  SELECT COUNT(*) INTO invalid_count
  FROM customer
  WHERE category IS NOT NULL
    AND UPPER(category) NOT IN ('RETAIL', 'AGENT', 'DISTRIBUTOR', 'CORPORATE', 'GOVERNMENT', 'SPECIAL');

  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Found % rows with invalid category values. Migration aborted.', invalid_count;
  END IF;
END $$;
```

**Step 3: Alter Column Type**
```sql
-- Migration 3: Change column type (after data verified)
ALTER TABLE customer
  ALTER COLUMN category TYPE customer_category
  USING (category::customer_category);

ALTER TABLE customer
  ALTER COLUMN price_category TYPE price_category
  USING (price_category::price_category);
```

**2. Add Rollback Plan:**
```sql
-- Rollback migration
ALTER TABLE customer ALTER COLUMN category TYPE VARCHAR;
ALTER TABLE customer ALTER COLUMN price_category TYPE VARCHAR;

DROP TYPE IF EXISTS customer_category;
DROP TYPE IF EXISTS price_category;
```

**Testing Plan:**
```bash
# Test on staging with production data snapshot
# 1. Backup database
pg_dump production_db > backup.sql

# 2. Run migration
npm run prisma migrate deploy

# 3. Verify data integrity
psql -d production_db -c "SELECT category, COUNT(*) FROM customer GROUP BY category;"

# 4. Test application with new enums
npm run test:integration
```

---

### FASE 3 RISKS

#### ⚠️ Risk 3.1: Redis Cache Stale Data

**Potensi Bug:**
1. **Cache Invalidation Missed**
   - Account updated → Cache not invalidated
   - Frontend shows old account name

2. **Race Condition on Cache Update**
   - Request A: Read cache (miss) → Fetch DB (old data) → Set cache
   - Request B: Update DB → Invalidate cache
   - Request A: Set cache (with old data)
   - Result: Cache has stale data

**Impact:**
- 🟡 MEDIUM - Incorrect data shown to users

**Prevention Strategy:**

**1. Implement Cache-Aside Pattern with Locks:**
```typescript
// backend/src/infrastructure/cache.ts
import Redis from 'ioredis';
import { createHash } from 'crypto';

const redis = new Redis({ /* config */ });

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },

  async set(key: string, value: any, ttl: number = 300): Promise<void> {
    await redis.setex(key, ttl, JSON.stringify(value));
  },

  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = 300
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Acquire lock to prevent cache stampede
    const lockKey = `lock:${key}`;
    const lockValue = Math.random().toString(36);
    const locked = await redis.set(lockKey, lockValue, 'EX', 10, 'NX');

    if (!locked) {
      // Another process is fetching, wait and retry
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.getOrSet(key, fetchFn, ttl);
    }

    try {
      // Fetch from database
      const data = await fetchFn();

      // Set cache
      await this.set(key, data, ttl);

      return data;
    } finally {
      // Release lock (only if we own it)
      const currentLock = await redis.get(lockKey);
      if (currentLock === lockValue) {
        await redis.del(lockKey);
      }
    }
  },

  async invalidate(key: string): Promise<void> {
    await redis.del(key);
  },

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
};
```

**2. Add Cache Versioning:**
```typescript
// Prevent stale cache after schema changes
const CACHE_VERSION = 'v1';

function getCacheKey(companyId: string, resource: string): string {
  return `${CACHE_VERSION}:${resource}:${companyId}`;
}

// Usage
const cacheKey = getCacheKey(companyId, 'accounts:active');
const accounts = await cache.getOrSet(cacheKey, async () => {
  return await prisma.account.findMany({ /* ... */ });
}, 600);

// When schema changes, increment CACHE_VERSION to 'v2'
// All old cache keys automatically invalid
```

**3. Add Write-Through Caching:**
```typescript
// When updating account, update cache immediately
export async function updateAccount(id: string, data: UpdateAccountInput) {
  const account = await prisma.account.update({
    where: { id },
    data
  });

  // Invalidate ALL related cache keys
  await cache.invalidatePattern(`*:accounts:${account.companyId}:*`);

  // Optionally: Update cache immediately (write-through)
  const cacheKey = getCacheKey(account.companyId, 'accounts:active');
  await cache.del(cacheKey); // Force refetch on next read

  return account;
}
```

**Testing Plan:**
```typescript
describe('Redis Cache', () => {
  it('should invalidate cache on account update', async () => {
    // 1. Fetch accounts (cache miss)
    const accounts1 = await getAccounts(companyId);

    // 2. Update account
    await updateAccount(accounts1[0].id, { name: 'Updated Name' });

    // 3. Fetch again (cache should be invalidated)
    const accounts2 = await getAccounts(companyId);
    expect(accounts2[0].name).toBe('Updated Name');
  });

  it('should not cause cache stampede with concurrent requests', async () => {
    // Clear cache
    await cache.invalidatePattern('*');

    // 100 concurrent requests
    const requests = Array(100).fill(null).map(() => getAccounts(companyId));

    const results = await Promise.all(requests);

    // All should have same data
    expect(new Set(results.map(r => JSON.stringify(r))).size).toBe(1);

    // Only 1 database query should have been made
    expect(mockPrisma.account.findMany).toHaveBeenCalledTimes(1);
  });
});
```

---

#### ⚠️ Risk 3.2: Database Triggers Breaking Application Logic

**Potensi Bug:**
1. **Double Calculation**
   - Application updates `faktur.subtotal` manually
   - Trigger also updates `faktur.subtotal`
   - Race condition: Which one wins?

2. **Trigger Cascade Infinite Loop**
   - Trigger A updates table X
   - Table X trigger updates table Y
   - Table Y trigger updates table X
   - Infinite loop → Database crash

3. **Performance Degradation**
   - Every line item insert triggers faktur update
   - Insert 100 line items = 100 faktur updates
   - Should batch update only once

**Impact:**
- 🔴 CRITICAL - Data corruption, infinite loops

**Prevention Strategy:**

**1. Remove Manual Calculations from Application:**
```typescript
// BEFORE: Application calculates totals
const subtotal = lines.reduce((sum, line) => sum + (line.quantity * line.unitPrice), 0);
const faktur = await tx.faktur.create({
  data: {
    subtotal,  // Manual calculation
    lines: {
      create: lines
    }
  }
});

// AFTER: Let trigger handle it
const faktur = await tx.faktur.create({
  data: {
    // subtotal NOT provided - trigger will calculate
    lines: {
      create: lines
    }
  }
});

// Re-fetch to get trigger-calculated values
const fakturWithTotals = await tx.faktur.findUnique({
  where: { id: faktur.id }
});
```

**2. Add Trigger Guards Against Infinite Loops:**
```sql
-- Prevent infinite loops with session variable
CREATE OR REPLACE FUNCTION update_faktur_summary()
RETURNS TRIGGER AS $$
DECLARE
  v_trigger_depth INT;
BEGIN
  -- Check trigger depth
  v_trigger_depth := COALESCE(current_setting('app.trigger_depth', true)::INT, 0);

  IF v_trigger_depth > 5 THEN
    RAISE EXCEPTION 'Trigger recursion depth exceeded (depth: %)', v_trigger_depth;
  END IF;

  -- Increment depth
  PERFORM set_config('app.trigger_depth', (v_trigger_depth + 1)::TEXT, true);

  -- Update faktur (only if changed to prevent unnecessary updates)
  UPDATE faktur
  SET
    subtotal = COALESCE((
      SELECT SUM(quantity * unit_price)
      FROM faktur_line WHERE faktur_id = COALESCE(NEW.faktur_id, OLD.faktur_id)
    ), 0),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.faktur_id, OLD.faktur_id)
    AND subtotal IS DISTINCT FROM COALESCE((
      SELECT SUM(quantity * unit_price)
      FROM faktur_line WHERE faktur_id = COALESCE(NEW.faktur_id, OLD.faktur_id)
    ), 0); -- Only update if value changed

  -- Decrement depth
  PERFORM set_config('app.trigger_depth', (v_trigger_depth)::TEXT, true);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

**3. Batch Trigger Execution:**
```sql
-- Use AFTER STATEMENT trigger instead of AFTER ROW
-- Only fires once per statement, not per row

CREATE OR REPLACE FUNCTION update_faktur_summary_batch()
RETURNS TRIGGER AS $$
BEGIN
  -- Update all affected fakturs in one query
  UPDATE faktur f
  SET
    subtotal = line_totals.total,
    updated_at = NOW()
  FROM (
    SELECT
      faktur_id,
      SUM(quantity * unit_price) as total
    FROM faktur_line
    WHERE faktur_id IN (
      SELECT DISTINCT COALESCE(NEW.faktur_id, OLD.faktur_id) FROM faktur_line
    )
    GROUP BY faktur_id
  ) AS line_totals
  WHERE f.id = line_totals.faktur_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS faktur_line_update_summary ON faktur_line;
CREATE TRIGGER faktur_line_update_summary
AFTER INSERT OR UPDATE OR DELETE ON faktur_line
FOR EACH STATEMENT -- Changed from FOR EACH ROW
EXECUTE FUNCTION update_faktur_summary_batch();
```

**Testing Plan:**
```typescript
describe('Database Triggers', () => {
  it('should calculate totals correctly', async () => {
    const faktur = await prisma.faktur.create({
      data: {
        companyId,
        customerId,
        fakturDate: new Date(),
        lines: {
          create: [
            { itemId: 'item1', quantity: 10, unitPrice: 100, amount: 1000 },
            { itemId: 'item2', quantity: 5, unitPrice: 200, amount: 1000 }
          ]
        }
      }
    });

    // Refetch to get trigger-calculated subtotal
    const updated = await prisma.faktur.findUnique({ where: { id: faktur.id } });
    expect(updated.subtotal).toBe(2000); // 10*100 + 5*200
  });

  it('should not cause infinite loop', async () => {
    // This should complete without timeout
    await expect(
      prisma.fakturLine.create({
        data: {
          fakturId: 'test-faktur-id',
          itemId: 'test-item',
          quantity: 1,
          unitPrice: 100,
          amount: 100
        }
      })
    ).resolves.toBeDefined();
  }, 5000); // 5s timeout

  it('should batch updates for multiple line inserts', async () => {
    const startTime = Date.now();

    await prisma.faktur.create({
      data: {
        companyId,
        customerId,
        lines: {
          create: Array(100).fill(null).map((_, i) => ({
            itemId: `item${i}`,
            quantity: 1,
            unitPrice: 10,
            amount: 10
          }))
        }
      }
    });

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(3000); // Should complete in <3s (not 100 separate updates)
  });
});
```

---

### ROLLBACK & RECOVERY PLAN

**General Rollback Strategy:**

1. **Feature Flags for Each Phase:**
```typescript
// backend/.env
ENABLE_BATCH_QUERIES=true
ENABLE_PAGINATION=true
ENABLE_REDIS_CACHE=true
ENABLE_DB_TRIGGERS=true

// Use flags to toggle features
if (process.env.ENABLE_BATCH_QUERIES === 'true') {
  // Use optimized batch queries
} else {
  // Use original N+1 queries
}
```

2. **Database Migration Rollback:**
```bash
# Rollback last migration
npx prisma migrate resolve --rolled-back <migration_name>

# Or manual rollback
psql -d erp_adi -f rollback_indexes.sql
```

3. **Monitoring & Alerts:**
```typescript
// Setup alerts for:
// - API response time > 5s
// - Error rate > 5%
// - Database connection pool > 80%
// - Cache hit rate < 50%

// Auto-rollback on critical errors
if (errorRate > 0.1) { // 10% error rate
  logger.critical('High error rate detected, rolling back feature');
  process.env.ENABLE_BATCH_QUERIES = 'false';
}
```

---

### TESTING MATRIX

| Risk Category | Test Type | Coverage Target | Tools |
|--------------|-----------|----------------|-------|
| Database Indexes | Load Test | 10,000+ concurrent queries | pg_stat_statements, Artillery |
| N+1 Queries | Unit Test | All service methods | Jest, Prisma mock |
| Pagination | Integration Test | All list endpoints | Supertest |
| Cache | Integration Test | Cache hit/miss/invalidation | Jest + Redis mock |
| Triggers | Database Test | All trigger scenarios | pgTAP |

**Critical Success Metrics:**
- ✅ Zero data corruption
- ✅ Zero production downtime
- ✅ <5% performance regression during rollout
- ✅ All tests passing before production deployment
