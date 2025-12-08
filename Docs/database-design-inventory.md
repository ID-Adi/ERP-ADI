# Database Design - Inventory Module (Item Management)

## Overview
Design database yang normalized dan scalable untuk module inventory management sistem ERP.

---

## 🎯 Design Philosophy

1. **Normalization**: Hindari data redundancy dengan proper 3NF normalization
2. **Scalability**: Support multi-warehouse, multi-pricing, multi-supplier
3. **Flexibility**: Easy to extend tanpa breaking changes
4. **Performance**: Proper indexing dan relation design
5. **Audit Trail**: Track semua perubahan penting

---

## 📊 Entity Relationship Diagram (ERD)

```
┌─────────────────┐
│    Company      │
└────────┬────────┘
         │
         │ 1:N
         │
┌────────▼────────────────────┐
│         Item                │
├─────────────────────────────┤
│ PK id                       │
│ FK companyId                │
│    code                     │
│    name                     │
│    description              │
│    barcode                  │
│    uom (Unit of Measure)    │
│ FK categoryId               │◄────┐
│    brand                    │     │
│    isStockItem              │     │
│    serialNumberActive       │     │
│    isActive                 │     │
│    createdAt                │     │
│    updatedAt                │     │
└────┬────────────────────────┘     │
     │                              │
     │ 1:N                          │ N:1
     │                              │
┌────▼──────────────────┐    ┌──────┴─────────────┐
│   ItemPricing         │    │  ItemCategory      │
├───────────────────────┤    ├────────────────────┤
│ PK id                 │    │ PK id              │
│ FK itemId             │    │    code            │
│    priceType (ENUM)   │    │    name            │
│    price              │    │    description     │
│    defaultDiscount    │    │ FK parentId        │
│    minimumQuantity    │    │    productType     │
│    isActive           │    │    hppAccountId    │
│    createdAt          │    │    isActive        │
│    updatedAt          │    │    createdAt       │
└───────────────────────┘    │    updatedAt       │
                             └────────────────────┘
┌───────────────────────┐
│   ItemStock           │
├───────────────────────┤
│ PK id                 │
│ FK itemId             │◄────┐
│ FK warehouseId        │     │
│    minStock           │     │
│    maxStock           │     │
│    currentStock       │     │
│    reservedStock      │     │
│    availableStock     │     │ 1:N
│    updatedAt          │     │
└───────────────────────┘     │
                              │
┌───────────────────────┐     │
│   ItemTax             │     │
├───────────────────────┤     │
│ PK id                 │     │
│ FK itemId             │◄────┤
│    taxCode            │     │
│    taxName            │     │
│    taxRate            │     │
│ FK taxAccountId       │     │
│    isActive           │     │
│    createdAt          │     │
└───────────────────────┘     │
                              │
┌───────────────────────┐     │
│   ItemSupplier        │     │
├───────────────────────┤     │
│ PK id                 │     │
│ FK itemId             │◄────┤
│ FK supplierId         │     │
│    isPrimary          │     │
│    purchaseUom        │     │
│    purchasePrice      │     │
│    leadTimeDays       │     │
│    minimumOrder       │     │
│    lastPurchaseDate   │     │
│    isActive           │     │
│    createdAt          │     │
│    updatedAt          │     │
└───────────────────────┘     │
                              │
┌───────────────────────┐     │
│   ItemAccount         │     │
├───────────────────────┤     │
│ PK id                 │     │
│ FK itemId             │◄────┘
│    accountType (ENUM) │
│ FK accountId          │
│    createdAt          │
└───────────────────────┘

┌──────────────────────┐
│   Warehouse          │
├──────────────────────┤
│ PK id                │
│ FK companyId         │
│    code              │
│    name              │
│    address           │
│    isActive          │
│    createdAt         │
│    updatedAt         │
└──────────────────────┘
```

---

## 📋 Table Definitions

### 1. **Item** (Core Entity)

**Purpose**: Master data untuk barang/jasa

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid() | Primary key |
| companyId | UUID | NO | - | FK to Company |
| code | VARCHAR(50) | NO | - | Item code (unique per company) |
| name | VARCHAR(255) | NO | - | Item name |
| description | TEXT | YES | NULL | Item description |
| barcode | VARCHAR(100) | YES | NULL | UPC/Barcode |
| uom | VARCHAR(20) | NO | 'PCS' | Unit of measure |
| categoryId | UUID | YES | NULL | FK to ItemCategory |
| brand | VARCHAR(100) | YES | NULL | Brand name |
| isStockItem | BOOLEAN | NO | true | Persediaan (true) or Jasa (false) |
| serialNumberActive | BOOLEAN | NO | false | Enable serial number tracking |
| isActive | BOOLEAN | NO | true | Active status |
| createdAt | TIMESTAMP | NO | now() | Created timestamp |
| updatedAt | TIMESTAMP | NO | now() | Updated timestamp |

**Indexes**:
- PRIMARY KEY (id)
- UNIQUE (companyId, code)
- INDEX (categoryId)
- INDEX (barcode)

**Business Rules**:
- Code must be unique per company
- Barcode must be unique if provided
- If serialNumberActive = true, must track serial numbers in separate table

---

### 2. **ItemCategory** (Category Hierarchy)

**Purpose**: Hierarchical category management untuk items

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid() | Primary key |
| companyId | UUID | NO | - | FK to Company |
| code | VARCHAR(50) | NO | - | Category code |
| name | VARCHAR(100) | NO | - | Category name |
| description | TEXT | YES | NULL | Description |
| parentId | UUID | YES | NULL | Self-referencing FK for hierarchy |
| productType | VARCHAR(50) | YES | NULL | Product type classification |
| hppAccountId | UUID | YES | NULL | HPP (Cost of Goods Sold) account ID |
| isActive | BOOLEAN | NO | true | Active status |
| createdAt | TIMESTAMP | NO | now() | Created timestamp |
| updatedAt | TIMESTAMP | NO | now() | Updated timestamp |

**Indexes**:
- PRIMARY KEY (id)
- UNIQUE (companyId, code)
- INDEX (parentId)

**Business Rules**:
- Support unlimited hierarchy levels
- Parent category must exist (if not null)
- Cannot delete category with active items

---

### 3. **ItemPricing** (Multi-level Pricing)

**Purpose**: Support multiple price levels (sell, purchase, wholesale, retail, etc.)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid() | Primary key |
| itemId | UUID | NO | - | FK to Item |
| priceType | ENUM | NO | - | SELL, PURCHASE, WHOLESALE, RETAIL, SPECIAL |
| price | DECIMAL(15,2) | NO | 0 | Price amount |
| defaultDiscount | DECIMAL(5,2) | NO | 0 | Default discount percentage |
| minimumQuantity | DECIMAL(10,2) | NO | 0 | Minimum qty for this price |
| currency | VARCHAR(3) | NO | 'IDR' | Currency code |
| isActive | BOOLEAN | NO | true | Active status |
| effectiveFrom | DATE | YES | NULL | Price effective from date |
| effectiveTo | DATE | YES | NULL | Price effective to date |
| createdAt | TIMESTAMP | NO | now() | Created timestamp |
| updatedAt | TIMESTAMP | NO | now() | Updated timestamp |

**Indexes**:
- PRIMARY KEY (id)
- INDEX (itemId, priceType)
- INDEX (effectiveFrom, effectiveTo)

**ENUM PriceType**:
- SELL (Default selling price)
- PURCHASE (Default purchase price)
- WHOLESALE (Harga grosir)
- RETAIL (Harga retail)
- SPECIAL (Harga khusus)

**Business Rules**:
- Each item can have multiple price types
- Minimum quantity for tiered pricing
- Support date-based pricing (seasonal, promotion)

---

### 4. **ItemStock** (Multi-warehouse Stock)

**Purpose**: Track stock per item per warehouse

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid() | Primary key |
| itemId | UUID | NO | - | FK to Item |
| warehouseId | UUID | NO | - | FK to Warehouse |
| minStock | DECIMAL(10,2) | NO | 0 | Minimum stock level |
| maxStock | DECIMAL(10,2) | NO | 0 | Maximum stock level |
| currentStock | DECIMAL(10,2) | NO | 0 | Current physical stock |
| reservedStock | DECIMAL(10,2) | NO | 0 | Reserved for orders |
| availableStock | DECIMAL(10,2) | NO | 0 | Available = current - reserved |
| reorderPoint | DECIMAL(10,2) | NO | 0 | Reorder trigger point |
| lastStockCount | TIMESTAMP | YES | NULL | Last physical count date |
| updatedAt | TIMESTAMP | NO | now() | Last update timestamp |

**Indexes**:
- PRIMARY KEY (id)
- UNIQUE (itemId, warehouseId)
- INDEX (availableStock) - for low stock alerts

**Business Rules**:
- availableStock = currentStock - reservedStock (computed or trigger)
- Alert when availableStock <= reorderPoint
- Cannot sell if availableStock < quantity

---

### 5. **ItemSupplier** (Supplier Relations)

**Purpose**: Track supplier information per item

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid() | Primary key |
| itemId | UUID | NO | - | FK to Item |
| supplierId | UUID | NO | - | FK to Contact (VENDOR) |
| isPrimary | BOOLEAN | NO | false | Is primary supplier |
| purchaseUom | VARCHAR(20) | NO | - | Purchase unit of measure |
| purchasePrice | DECIMAL(15,2) | NO | 0 | Purchase price from supplier |
| leadTimeDays | INTEGER | NO | 0 | Lead time in days |
| minimumOrder | DECIMAL(10,2) | NO | 0 | Minimum order quantity |
| lastPurchaseDate | DATE | YES | NULL | Last purchase date |
| lastPurchasePrice | DECIMAL(15,2) | YES | NULL | Last purchase price |
| isActive | BOOLEAN | NO | true | Active status |
| createdAt | TIMESTAMP | NO | now() | Created timestamp |
| updatedAt | TIMESTAMP | NO | now() | Updated timestamp |

**Indexes**:
- PRIMARY KEY (id)
- UNIQUE (itemId, supplierId)
- INDEX (isPrimary)

**Business Rules**:
- Each item can have multiple suppliers
- Only one isPrimary = true per item
- supplierId must be Contact with type VENDOR or BOTH

---

### 6. **ItemTax** (Tax Configuration)

**Purpose**: Tax configuration per item

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid() | Primary key |
| itemId | UUID | NO | - | FK to Item |
| taxCode | VARCHAR(20) | NO | - | Tax code (PPN, PPh, etc) |
| taxName | VARCHAR(100) | NO | - | Tax name |
| taxRate | DECIMAL(5,2) | NO | 0 | Tax rate percentage |
| taxAccountId | UUID | YES | NULL | FK to Account for tax |
| isActive | BOOLEAN | NO | true | Active status |
| createdAt | TIMESTAMP | NO | now() | Created timestamp |

**Indexes**:
- PRIMARY KEY (id)
- INDEX (itemId, taxCode)

**Business Rules**:
- Multiple tax types can be applied to one item
- Tax rate in percentage (e.g., 11 for PPN 11%)

---

### 7. **ItemAccount** (Account Mapping)

**Purpose**: Map items to accounting accounts

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid() | Primary key |
| itemId | UUID | NO | - | FK to Item |
| accountType | ENUM | NO | - | Type of account mapping |
| accountId | UUID | NO | - | FK to Account/ChartOfAccounts |
| createdAt | TIMESTAMP | NO | now() | Created timestamp |

**ENUM AccountType**:
- INVENTORY (Persediaan)
- SALES (Penjualan)
- SALES_RETURN (Retur Penjualan)
- SALES_DISCOUNT (Diskon Penjualan)
- GOODS_SHIPPED (Barang Terkirim)
- COGS (Beban Pokok Penjualan)
- PURCHASE_RETURN (Retur Pembelian)
- PURCHASE_ACCRUAL (Pembelian Belum Tertagih)

**Indexes**:
- PRIMARY KEY (id)
- UNIQUE (itemId, accountType)

**Business Rules**:
- Each item must have account mappings for all required types
- Account must exist in ChartOfAccounts

---

### 8. **Warehouse** (Supporting Table)

**Purpose**: Warehouse/location master

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid() | Primary key |
| companyId | UUID | NO | - | FK to Company |
| code | VARCHAR(50) | NO | - | Warehouse code |
| name | VARCHAR(100) | NO | - | Warehouse name |
| address | TEXT | YES | NULL | Address |
| city | VARCHAR(100) | YES | NULL | City |
| isActive | BOOLEAN | NO | true | Active status |
| createdAt | TIMESTAMP | NO | now() | Created timestamp |
| updatedAt | TIMESTAMP | NO | now() | Updated timestamp |

**Indexes**:
- PRIMARY KEY (id)
- UNIQUE (companyId, code)

---

## 🔄 Migration from Current Schema

### Step 1: Create new tables
```sql
-- Create new supporting tables first
CREATE TABLE ItemCategory, Warehouse, ItemPricing, ItemStock, ItemSupplier, ItemTax, ItemAccount
```

### Step 2: Migrate existing Item data
```sql
-- Existing Item table stays mostly the same
-- Add categoryId, brand, serialNumberActive if not exists
ALTER TABLE Item ADD COLUMN IF NOT EXISTS brand VARCHAR(100);
ALTER TABLE Item ADD COLUMN IF NOT EXISTS serialNumberActive BOOLEAN DEFAULT false;
```

### Step 3: Migrate pricing data
```sql
-- Move purchasePrice and sellPrice to ItemPricing
INSERT INTO ItemPricing (itemId, priceType, price)
SELECT id, 'SELL', sellPrice FROM Item WHERE sellPrice > 0;

INSERT INTO ItemPricing (itemId, priceType, price)
SELECT id, 'PURCHASE', purchasePrice FROM Item WHERE purchasePrice > 0;
```

### Step 4: Migrate stock data
```sql
-- Move minStock to ItemStock (default warehouse)
INSERT INTO ItemStock (itemId, warehouseId, minStock, currentStock)
SELECT id, (SELECT id FROM Warehouse LIMIT 1), minStock, 0 FROM Item;
```

---

## 🎯 Key Benefits of This Design

### 1. **Scalability**
- ✅ Support multi-warehouse tanpa alter table
- ✅ Support unlimited price levels
- ✅ Support multiple suppliers per item
- ✅ Easy to add new warehouses, price types, etc.

### 2. **Flexibility**
- ✅ Hierarchical category (unlimited levels)
- ✅ Date-based pricing (seasonal, promotion)
- ✅ Multi-currency ready
- ✅ Easy to extend for new features

### 3. **Performance**
- ✅ Proper indexing on FK and query columns
- ✅ Computed columns for performance (availableStock)
- ✅ Separate tables = smaller table scans

### 4. **Data Integrity**
- ✅ FK constraints ensure referential integrity
- ✅ Unique constraints prevent duplicates
- ✅ ENUM types enforce valid values
- ✅ Business rules at database level

### 5. **Reporting & Analytics**
- ✅ Easy to query stock by warehouse
- ✅ Easy to analyze pricing trends
- ✅ Easy to track supplier performance
- ✅ Support for inventory valuation

---

## 📈 Example Queries

### Get Item with All Related Data
```sql
SELECT
    i.*,
    c.name as categoryName,
    json_agg(DISTINCT jsonb_build_object(
        'priceType', ip.priceType,
        'price', ip.price,
        'discount', ip.defaultDiscount
    )) as prices,
    json_agg(DISTINCT jsonb_build_object(
        'warehouse', w.name,
        'stock', ist.currentStock,
        'available', ist.availableStock
    )) as stocks
FROM Item i
LEFT JOIN ItemCategory c ON i.categoryId = c.id
LEFT JOIN ItemPricing ip ON i.id = ip.itemId AND ip.isActive = true
LEFT JOIN ItemStock ist ON i.id = ist.itemId
LEFT JOIN Warehouse w ON ist.warehouseId = w.id
WHERE i.id = $1
GROUP BY i.id, c.name;
```

### Low Stock Alert
```sql
SELECT
    i.code,
    i.name,
    w.name as warehouse,
    ist.availableStock,
    ist.minStock
FROM ItemStock ist
JOIN Item i ON ist.itemId = i.id
JOIN Warehouse w ON ist.warehouseId = w.id
WHERE ist.availableStock <= ist.reorderPoint
  AND i.isActive = true
  AND i.isStockItem = true
ORDER BY ist.availableStock ASC;
```

### Item with Primary Supplier
```sql
SELECT
    i.*,
    c.name as supplierName,
    isp.purchasePrice,
    isp.leadTimeDays
FROM Item i
LEFT JOIN ItemSupplier isp ON i.id = isp.itemId AND isp.isPrimary = true
LEFT JOIN Contact c ON isp.supplierId = c.id
WHERE i.isActive = true;
```

---

## 🚀 Next Steps

1. Review dan approval design ini
2. Buat Prisma schema berdasarkan design
3. Generate migration files
4. Update API controllers untuk handle relational data
5. Update frontend untuk display/edit relational data
6. Create seed data untuk testing

---

**Created**: 2025-12-08
**Author**: Database Design for ERP-ADI Inventory Module
**Version**: 1.0
