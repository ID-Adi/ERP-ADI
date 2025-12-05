# 📐 BLUEPRINT IMPLEMENTASI - Step by Step

## 🎯 TUJUAN REVISI

Membuat sistem ERP yang:
1. ✅ **Production-ready** - Bisa dipakai real business
2. ✅ **Scalable** - Mudah tambah fitur baru
3. ✅ **Maintainable** - Mudah di-maintain & debug
4. ✅ **Standard-compliant** - Sesuai standar akuntansi
5. ✅ **User-friendly** - UI/UX konsisten & intuitif

---

## 🗺️ ROADMAP IMPLEMENTASI (16 Minggu)

```
Phase 1: FOUNDATION (4 minggu)
  ├─ Week 1-2: Research & Design
  └─ Week 3-4: Architecture Restructure

Phase 2: CORE MODULES (6 minggu)
  ├─ Week 5-6: Master Data & Document System
  ├─ Week 7-8: Sales & AR dengan Line Items
  └─ Week 9-10: Purchase & AP dengan Line Items

Phase 3: INTEGRATION (4 minggu)
  ├─ Week 11-12: GL Posting & Reports
  └─ Week 13-14: Inventory & Costing

Phase 4: POLISH (2 minggu)
  ├─ Week 15: Testing & Bug Fix
  └─ Week 16: Documentation & Deployment
```

---

## 📋 PHASE 1: FOUNDATION (Week 1-4)

### Week 1-2: Research & Design

#### ✅ Task 1.1: Study Reference Systems (3 hari)
**Deliverable:** Document comparison

**Action:**
1. Install trial Accurate Online
2. Praktik flow lengkap:
   ```
   - Setup: Master data (customer, item, COA)
   - Sales: Create invoice → Post → Payment → Allocation
   - Purchase: Create PO → GR → Bill → Payment
   - Inventory: Stock opname, transfer
   - Reports: TB, BS, IS, AR Aging
   ```
3. Screenshot setiap langkah
4. Catat business rules yang diterapkan

**Output:** `/docs/research/accurate-system-analysis.md`

#### ✅ Task 1.2: Complete Database Design (3 hari)
**Deliverable:** ERD lengkap

**Tools:** dbdiagram.io atau draw.io

**Entities to Design:**
```
Core:
- Tenant, Company, Branch, User, Role, Permission

Master Data:
- Contact (Customer/Vendor)
- ContactAddress, ContactTaxInfo, ContactSalesConfig, ContactPurchaseConfig
- Item, ItemCategory, PriceList, PriceListItem
- GLAccount, PaymentTerm, Tax, UnitOfMeasure
- Warehouse, BankAccount

Transactions:
- Document, DocumentSequence
- SalesOrder, SalesOrderLine
- DeliveryOrder, DeliveryOrderLine
- ARInvoice, ARInvoiceLine
- PurchaseOrder, PurchaseOrderLine
- GoodsReceipt, GoodsReceiptLine
- APBill, APBillLine
- Payment, PaymentApplication
- Journal, JournalLine
- InventoryMove

System:
- FiscalPeriod, AuditLog, PostingTemplate, PostingTemplateLine
```

**Output:**
- `/docs/database/ERD.png`
- `/docs/database/schema-explanation.md`

#### ✅ Task 1.3: UI/UX Design (4 hari)
**Deliverable:** Figma mockup

**Pages to Design:**
1. **Authentication**
   - Login
   - Forgot password

2. **Dashboard**
   - Layout (sidebar, header, content)
   - Home dashboard (KPIs, charts)

3. **Master Data** (List + Form pattern)
   - Customers
   - Vendors
   - Items
   - GL Accounts

4. **Sales Module**
   - Invoices list
   - Invoice create/edit form (dengan line items!)
   - Invoice detail view
   - Payments

5. **Purchase Module**
   - Purchase Orders
   - Goods Receipt
   - Bills
   - Payments

6. **Inventory**
   - Stock list
   - Stock movements
   - Stock opname

7. **GL & Reports**
   - Chart of Accounts
   - Journal entries
   - Trial Balance
   - Balance Sheet
   - Income Statement

**Design System:**
```typescript
// Design tokens
colors: {
  primary: '#3B82F6',    // Blue
  success: '#10B981',    // Green
  warning: '#F59E0B',    // Orange
  danger: '#EF4444',     // Red
  neutral: '#6B7280'     // Gray
}

typography: {
  heading1: 'text-2xl font-bold',
  heading2: 'text-xl font-semibold',
  body: 'text-base',
  small: 'text-sm'
}

spacing: {
  page: 'p-6',
  section: 'mb-6',
  card: 'p-4'
}

components: {
  button: {
    primary: 'bg-primary-600 hover:bg-primary-700',
    secondary: 'bg-gray-200 hover:bg-gray-300',
    danger: 'bg-red-600 hover:bg-red-700'
  }
}
```

**Output:** Figma project URL in `/docs/design/figma-link.txt`

#### ✅ Task 1.4: API Contract Design (2 hari)
**Deliverable:** OpenAPI Spec

**Standard Response Format:**
```yaml
# Success Response
{
  "success": true,
  "data": { ... },
  "pagination": {  # Optional, untuk list
    "page": 1,
    "pageSize": 20,
    "total": 150,
    "totalPages": 8
  },
  "meta": { }  # Optional metadata
}

# Error Response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "invoiceDate",
        "message": "Invoice date is required"
      }
    ]
  }
}
```

**Endpoints to Define:**
```
Auth:
  POST /api/auth/login
  POST /api/auth/logout
  POST /api/auth/refresh
  GET  /api/auth/me

Contacts:
  GET    /api/contacts
  POST   /api/contacts
  GET    /api/contacts/:id
  PUT    /api/contacts/:id
  DELETE /api/contacts/:id

Items:
  GET    /api/items
  POST   /api/items
  ... (similar pattern)

Invoices:
  GET    /api/sales/invoices
  POST   /api/sales/invoices
  GET    /api/sales/invoices/:id
  PUT    /api/sales/invoices/:id
  DELETE /api/sales/invoices/:id
  POST   /api/sales/invoices/:id/submit
  POST   /api/sales/invoices/:id/approve
  POST   /api/sales/invoices/:id/post
  POST   /api/sales/invoices/:id/cancel

... (all other modules)
```

**Output:** `/docs/api/openapi.yaml`

---

### Week 3-4: Architecture Restructure

#### ✅ Task 2.1: Backend Folder Restructure (2 hari)
**Deliverable:** New folder structure

**Action:**
```bash
cd backend

# Create new structure
mkdir -p src/{api/{controllers,validators,middleware},domain/{sales,purchases,inventory,gl,ar,ap,shared},infrastructure/{database,cache,storage},config,utils}

# Organize per domain
mkdir -p src/domain/sales/{services,repositories,models,events}
mkdir -p src/domain/purchases/{services,repositories,models,events}
# ... repeat for all domains
```

**Migration Plan:**
```
OLD → NEW

src/routes/sales.js
  → src/api/controllers/sales.controller.js (HTTP handling)
  → src/domain/sales/services/sales.service.js (business logic)
  → src/domain/sales/repositories/invoice.repository.js (data access)

src/routes/customers.js
  → src/api/controllers/contacts.controller.js
  → src/domain/shared/services/contact.service.js
  → src/domain/shared/repositories/contact.repository.js

src/context.js (keep as is, move to middleware)
  → src/api/middleware/context.middleware.js
```

**Task Breakdown:**
1. Create folder structure
2. Create base classes:
   ```javascript
   // src/domain/shared/base.service.js
   class BaseService {
     constructor(repository) {
       this.repository = repository;
     }

     async withTransaction(callback) {
       return await prisma.$transaction(callback);
     }
   }

   // src/domain/shared/base.repository.js
   class BaseRepository {
     constructor(model) {
       this.model = model;
     }

     async findById(tenantId, companyId, id, tx) {
       const prismaClient = tx || prisma;
       return await prismaClient[this.model].findFirst({
         where: { id, tenantId, companyId }
       });
     }
     // ... more base methods
   }
   ```

3. Migrate one module first (Sales) as example
4. Test migration works
5. Migrate other modules

**Output:**
- New folder structure
- Base classes
- One migrated module (Sales)

#### ✅ Task 2.2: Database Schema Migration (3 hari)
**Deliverable:** New Prisma schema + migration scripts

**Steps:**

1. **Backup existing database:**
   ```bash
   pg_dump sistem_erp > backup_$(date +%Y%m%d).sql
   ```

2. **Create new schema file:**
   ```bash
   cp backend/prisma/schema.prisma backend/prisma/schema.old.prisma
   # Edit schema.prisma with new design
   ```

3. **Key Changes:**
   ```prisma
   // 1. Normalize Customer → Contact
   // 2. Add PostingTemplate
   // 3. Add DocumentSequence
   // 4. Add PaymentTerm, PriceList
   // 5. Add FiscalPeriod
   // 6. Enhance Document with workflow fields
   // 7. Add audit fields to all models (createdBy, updatedBy, version)
   // 8. Add soft delete (isDeleted, deletedAt)
   ```

4. **Create migration:**
   ```bash
   pnpm prisma migrate dev --name restructure_v2 --create-only
   ```

5. **Write data migration script:**
   ```javascript
   // backend/prisma/migrations/data-migration.js
   async function migrateCustomersToContacts() {
     const customers = await prisma.customer.findMany();

     for (const customer of customers) {
       // Create Contact
       const contact = await prisma.contact.create({
         data: {
           tenantId: customer.tenantId,
           companyId: customer.companyId,
           code: customer.code,
           name: customer.name,
           type: customer.type,
           // ... basic fields
         }
       });

       // Create Address (if exists)
       if (customer.billingAddress) {
         await prisma.contactAddress.create({
           data: {
             contactId: contact.id,
             addressType: 'BILLING',
             street: customer.billingAddress,
             city: customer.billingCity,
             // ...
           }
         });
       }

       // Create TaxInfo (if exists)
       if (customer.npwp) {
         await prisma.contactTaxInfo.create({
           data: {
             contactId: contact.id,
             npwp: customer.npwp,
             // ...
           }
         });
       }

       // Create SalesConfig
       await prisma.contactSalesConfig.create({
         data: {
           contactId: contact.id,
           creditLimit: customer.creditLimit,
           arAccountId: customer.arAccountId,
           // ...
         }
       });
     }
   }
   ```

6. **Run migration:**
   ```bash
   pnpm prisma migrate deploy
   node backend/prisma/migrations/data-migration.js
   ```

7. **Verify:**
   ```bash
   # Check data migrated correctly
   psql sistem_erp -c "SELECT COUNT(*) FROM contacts;"
   psql sistem_erp -c "SELECT COUNT(*) FROM contact_addresses;"
   ```

**Output:**
- `backend/prisma/schema.prisma` (new)
- Migration SQL files
- Data migration script
- Verification report

#### ✅ Task 2.3: Frontend Folder Restructure (2 hari)
**Deliverable:** New component organization

**New Structure:**
```
/frontend
├── /app                      # Next.js routes
│   ├── /(auth)
│   │   └── /login
│   └── /dashboard
│       ├── layout.tsx        # Dashboard layout
│       ├── page.tsx          # Dashboard home
│       ├── /sales
│       │   ├── /invoices
│       │   │   ├── page.tsx              # List
│       │   │   ├── /new/page.tsx         # Create
│       │   │   └── /[id]
│       │   │       ├── page.tsx          # View
│       │   │       └── /edit/page.tsx    # Edit
│       │   └── /payments
│       ├── /purchases
│       │   ├── /orders
│       │   ├── /receipts
│       │   └── /bills
│       ├── /inventory
│       ├── /gl
│       ├── /reports
│       └── /masters
│           ├── /contacts
│           ├── /items
│           └── /accounts
│
├── /components
│   ├── /ui                   # Base components
│   │   ├── /button
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   └── Button.stories.tsx
│   │   ├── /input
│   │   ├── /modal
│   │   ├── /table
│   │   └── /form
│   │
│   ├── /patterns             # Composite patterns
│   │   ├── ListPage.tsx
│   │   ├── FormPage.tsx
│   │   └── DetailPage.tsx
│   │
│   ├── /business             # Business components
│   │   ├── /invoice
│   │   ├── /contact
│   │   └── /item
│   │
│   └── /layout               # Layout components
│       ├── DashboardLayout.tsx
│       ├── Sidebar.tsx
│       └── Header.tsx
│
├── /lib
│   ├── /api
│   │   ├── client.ts
│   │   └── /services
│   │       ├── contacts.service.ts
│   │       ├── invoices.service.ts
│   │       └── ...
│   │
│   ├── /hooks
│   │   ├── useContact.ts
│   │   ├── useInvoice.ts
│   │   └── ...
│   │
│   ├── /store
│   │   ├── auth.store.ts
│   │   └── ui.store.ts
│   │
│   ├── /utils
│   │   ├── format.ts
│   │   ├── validation.ts
│   │   └── calculation.ts
│   │
│   └── /types
│       ├── api.types.ts
│       ├── invoice.types.ts
│       └── ...
│
└── /styles
    └── globals.css           # Minimal! Most via Tailwind
```

**Migration:**
1. Move existing components to new structure
2. Consolidate duplicate components
3. Standardize naming (English only!)
4. Create base UI component library
5. Create pattern components (ListPage, FormPage)

**Output:** Restructured frontend

#### ✅ Task 2.4: Implement Core Services (3 hari)
**Deliverable:** Foundation services working

**Services to Implement:**

1. **DocumentNumberingService**
   ```javascript
   // src/domain/shared/services/document-numbering.service.js
   class DocumentNumberingService {
     async getNext(tenantId, companyId, branchId, docType, tx) {
       // Implementation with atomic increment
     }

     async reset(sequenceId, tx) {
       // For yearly/monthly reset
     }
   }
   ```

2. **AuditService**
   ```javascript
   // src/domain/shared/services/audit.service.js
   class AuditService {
     async log(params, tx) {
       // Log to AuditLog table
     }

     async getHistory(entityType, entityId) {
       // Get audit trail
     }
   }
   ```

3. **ValidationService**
   ```javascript
   // src/domain/shared/services/validation.service.js
   class ValidationService {
     async validatePeriod(tenantId, companyId, date) {
       // Check period is OPEN
     }

     async validateContact(tenantId, companyId, code, type) {
       // Check contact exists and is active
     }
   }
   ```

4. **PermissionService**
   ```javascript
   // src/domain/shared/services/permission.service.js
   class PermissionService {
     async checkPermission(userId, permission) {
       // Check user has permission
     }

     async getUserPermissions(userId) {
       // Get all permissions for user
     }
   }
   ```

**Test Each Service:**
```javascript
// __tests__/services/document-numbering.test.js
describe('DocumentNumberingService', () => {
  it('should generate sequential numbers', async () => {
    const num1 = await service.getNext('t1', 'c1', null, 'AR_INVOICE');
    const num2 = await service.getNext('t1', 'c1', null, 'AR_INVOICE');

    expect(num1).toBe('INV-00001');
    expect(num2).toBe('INV-00002');
  });

  it('should handle concurrent requests', async () => {
    const promises = Array(10).fill(null).map(() =>
      service.getNext('t1', 'c1', null, 'AR_INVOICE')
    );

    const results = await Promise.all(promises);
    const uniqueNumbers = new Set(results);

    expect(uniqueNumbers.size).toBe(10); // No duplicates!
  });
});
```

**Output:**
- 4 core services implemented & tested
- Integration with transaction management

---

## 📋 PHASE 2: CORE MODULES (Week 5-10)

### Week 5-6: Master Data & Document System

#### ✅ Task 3.1: Contact Management (Complete) (3 hari)

**Backend:**
```javascript
// src/domain/shared/services/contact.service.js
class ContactService extends BaseService {
  async create(tenantId, companyId, userId, data) {
    return await this.withTransaction(async (tx) => {
      // 1. Generate code if not provided
      const code = data.code || await this.generateCode(tenantId, companyId, tx);

      // 2. Create contact
      const contact = await this.repository.create({
        tenantId,
        companyId,
        code,
        name: data.name,
        type: data.type,
        email: data.email,
        phone: data.phone,
        isActive: true,
        createdBy: userId,
        version: 0
      }, tx);

      // 3. Create addresses
      if (data.addresses?.length > 0) {
        for (const addr of data.addresses) {
          await tx.contactAddress.create({
            data: {
              contactId: contact.id,
              ...addr
            }
          });
        }
      }

      // 4. Create tax info
      if (data.taxInfo) {
        await tx.contactTaxInfo.create({
          data: {
            contactId: contact.id,
            ...data.taxInfo
          }
        });
      }

      // 5. Create sales/purchase config
      if (data.type === 'CUSTOMER' || data.type === 'BOTH') {
        await tx.contactSalesConfig.create({
          data: {
            contactId: contact.id,
            paymentTermId: data.paymentTermId,
            creditLimit: data.creditLimit,
            arAccountId: data.arAccountId,
            // ...
          }
        });
      }

      if (data.type === 'VENDOR' || data.type === 'BOTH') {
        await tx.contactPurchaseConfig.create({
          data: {
            contactId: contact.id,
            paymentTermId: data.paymentTermId,
            apAccountId: data.apAccountId,
            // ...
          }
        });
      }

      // 6. Audit log
      await this.auditService.log({
        tenantId,
        companyId,
        entityType: 'Contact',
        entityId: contact.id,
        action: 'CREATE',
        userId,
        newValues: contact
      }, tx);

      return contact;
    });
  }

  async update(tenantId, companyId, userId, id, data) {
    return await this.withTransaction(async (tx) => {
      // 1. Get existing (with version check)
      const existing = await this.repository.findById(tenantId, companyId, id, tx);
      if (!existing) {
        throw new NotFoundError('Contact not found');
      }

      // 2. Optimistic locking check
      if (data.version !== existing.version) {
        throw new ConcurrencyError('Contact has been modified by another user');
      }

      // 3. Update contact
      const updated = await this.repository.update(id, {
        ...data,
        updatedBy: userId,
        version: existing.version + 1
      }, tx);

      // 4. Update child records (addresses, taxInfo, configs)
      // ...

      // 5. Audit log
      await this.auditService.log({
        tenantId,
        companyId,
        entityType: 'Contact',
        entityId: id,
        action: 'UPDATE',
        userId,
        oldValues: existing,
        newValues: updated
      }, tx);

      return updated;
    });
  }

  async delete(tenantId, companyId, userId, id) {
    return await this.withTransaction(async (tx) => {
      // 1. Check usage (has transactions?)
      const hasInvoices = await tx.aRInvoice.count({
        where: { contactId: id }
      });
      const hasBills = await tx.aPBill.count({
        where: { contactId: id }
      });

      if (hasInvoices > 0 || hasBills > 0) {
        throw new BusinessError(
          'Cannot delete contact with existing transactions. ' +
          'Set as inactive instead.'
        );
      }

      // 2. Soft delete
      await this.repository.update(id, {
        isDeleted: true,
        deletedAt: new Date(),
        updatedBy: userId
      }, tx);

      // 3. Audit log
      await this.auditService.log({
        tenantId,
        companyId,
        entityType: 'Contact',
        entityId: id,
        action: 'DELETE',
        userId
      }, tx);
    });
  }
}
```

**Frontend:**
```typescript
// app/dashboard/masters/contacts/page.tsx
export default function ContactsPage() {
  return (
    <ListPage
      title="Contacts"
      apiService={contactsApi}
      columns={contactColumns}
      filters={contactFilters}
      onNew={() => router.push('/dashboard/masters/contacts/new')}
    />
  );
}

// app/dashboard/masters/contacts/new/page.tsx
export default function NewContactPage() {
  const createMutation = useCreateContact();

  return (
    <FormPage
      title="New Contact"
      onSave={(data) => createMutation.mutate(data)}
      onCancel={() => router.back()}
    >
      <ContactForm />
    </FormPage>
  );
}

// components/business/contact/ContactForm.tsx
export function ContactForm() {
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema)
  });

  return (
    <Form {...form}>
      <Tabs>
        <TabList>
          <Tab>General</Tab>
          <Tab>Addresses</Tab>
          <Tab>Tax Info</Tab>
          <Tab>Sales Config</Tab>
          <Tab>Purchase Config</Tab>
        </TabList>

        <TabPanel>
          <FormField name="code" label="Code" />
          <FormField name="name" label="Name" required />
          <FormField name="type" label="Type" type="select" options={typeOptions} />
          {/* ... more fields */}
        </TabPanel>

        <TabPanel>
          <AddressList name="addresses" />
        </TabPanel>

        {/* ... more tabs */}
      </Tabs>
    </Form>
  );
}
```

**Testing:**
```javascript
describe('Contact Management', () => {
  it('should create contact with all related data', async () => {
    const contactData = {
      name: 'PT Test',
      type: 'CUSTOMER',
      addresses: [
        { addressType: 'BILLING', city: 'Jakarta' }
      ],
      taxInfo: { npwp: '123456' },
      creditLimit: 10000000
    };

    const contact = await contactService.create('t1', 'c1', 'u1', contactData);

    expect(contact.code).toMatch(/CUST-\d{5}/);
    expect(contact.addresses).toHaveLength(1);
    expect(contact.taxInfo.npwp).toBe('123456');
    expect(contact.salesConfig.creditLimit).toBe(10000000);
  });

  it('should prevent delete if contact has transactions', async () => {
    // Create contact with invoice
    const contact = await createTestContact();
    await createTestInvoice({ contactId: contact.id });

    // Try to delete
    await expect(
      contactService.delete('t1', 'c1', 'u1', contact.id)
    ).rejects.toThrow('Cannot delete contact with existing transactions');
  });
});
```

#### ✅ Task 3.2: Item Master (2 hari)

Similar pattern dengan Contact:
- Service layer dengan transaction
- Repository untuk data access
- Validation business rules
- Audit trail
- Frontend dengan standard pattern (ListPage + FormPage)

**Khusus untuk Item, tambahkan:**
- Item variants (size, color, dll)
- Multiple units (base unit + conversion)
- Multiple prices per price list
- Stock tracking (optional for service items)

#### ✅ Task 3.3: Document Sequence Setup (1 hari)

**Seed Data:**
```javascript
// backend/prisma/seed.js
async function seedDocumentSequences() {
  const sequences = [
    { docType: 'AR_INVOICE', prefix: 'INV-', length: 5 },
    { docType: 'AR_CREDIT_MEMO', prefix: 'CM-', length: 5 },
    { docType: 'AP_BILL', prefix: 'BILL-', length: 5 },
    { docType: 'AP_DEBIT_MEMO', prefix: 'DM-', length: 5 },
    { docType: 'PURCHASE_ORDER', prefix: 'PO-', length: 5 },
    { docType: 'SALES_ORDER', prefix: 'SO-', length: 5 },
    { docType: 'GOODS_RECEIPT', prefix: 'GR-', length: 5 },
    { docType: 'DELIVERY_ORDER', prefix: 'DO-', length: 5 },
    { docType: 'PAYMENT', prefix: 'PAY-', length: 5 },
    { docType: 'JOURNAL_ENTRY', prefix: 'JE-', length: 5 }
  ];

  for (const seq of sequences) {
    await prisma.documentSequence.create({
      data: {
        tenantId: 'default-tenant',
        companyId: 'default-company',
        ...seq,
        lastNumber: 0
      }
    });
  }
}
```

**UI untuk Manage Sequences:**
```typescript
// app/dashboard/settings/sequences/page.tsx
function SequencesPage() {
  const { data: sequences } = useSequences();

  return (
    <div>
      <h1>Document Sequences</h1>
      <table>
        <thead>
          <tr>
            <th>Document Type</th>
            <th>Prefix</th>
            <th>Last Number</th>
            <th>Next Number</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sequences?.map(seq => (
            <tr key={seq.id}>
              <td>{seq.docType}</td>
              <td>{seq.prefix}</td>
              <td>{seq.lastNumber}</td>
              <td>{formatDocNumber(seq)}</td>
              <td>
                <Button onClick={() => editSequence(seq)}>Edit</Button>
                <Button onClick={() => resetSequence(seq)}>Reset</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

### Week 7-8: Sales & AR dengan Line Items

#### ✅ Task 4.1: AR Invoice with Line Items (4 hari)

**Backend Service:**
```javascript
// src/domain/sales/services/sales.service.js
class SalesService extends BaseService {
  async createInvoice(tenantId, companyId, userId, data) {
    // 1. Validate business rules
    await this.validator.validateInvoiceCreation(tenantId, companyId, data);

    return await this.withTransaction(async (tx) => {
      // 2. Get contact
      const contact = await this.contactRepository.findByCode(
        tenantId,
        companyId,
        data.customerCode,
        tx
      );

      if (!contact) {
        throw new BusinessError('Customer not found');
      }

      if (contact.type !== 'CUSTOMER' && contact.type !== 'BOTH') {
        throw new BusinessError('Contact is not a customer');
      }

      // 3. Generate document number
      const docNumber = await this.docNumberingService.getNext(
        tenantId,
        companyId,
        data.branchId,
        'AR_INVOICE',
        tx
      );

      // 4. Create document header
      const document = await tx.document.create({
        data: {
          tenantId,
          companyId,
          branchId: data.branchId,
          docNumber,
          docType: 'AR_INVOICE',
          docDate: data.invoiceDate,
          status: 'DRAFT',
          createdBy: userId
        }
      });

      // 5. Calculate line items
      const calculatedLines = await this.calculateLineItems(
        tenantId,
        companyId,
        data.lines,
        tx
      );

      // 6. Calculate invoice totals
      const totals = this.calculateInvoiceTotals(calculatedLines);

      // 7. Check credit limit
      await this.checkCreditLimit(contact, totals.total, tx);

      // 8. Create invoice
      const invoice = await tx.aRInvoice.create({
        data: {
          tenantId,
          companyId,
          branchId: data.branchId,
          documentId: document.id,
          contactId: contact.id,
          billingAddressId: data.billingAddressId,
          invoiceDate: data.invoiceDate,
          dueDate: data.dueDate,
          currencyId: data.currencyId,
          exchangeRate: data.exchangeRate || 1,
          subtotal: totals.subtotal,
          discountAmount: totals.discountAmount,
          taxAmount: totals.taxAmount,
          total: totals.total,
          memo: data.memo,
          lines: {
            create: calculatedLines
          }
        },
        include: {
          document: true,
          contact: true,
          lines: {
            include: {
              item: true,
              uom: true,
              tax: true
            }
          }
        }
      });

      // 9. Update credit limit used
      await tx.contactSalesConfig.update({
        where: { contactId: contact.id },
        data: {
          creditLimitUsed: {
            increment: totals.total
          }
        }
      });

      // 10. Audit log
      await this.auditService.log({
        tenantId,
        companyId,
        entityType: 'ARInvoice',
        entityId: invoice.id,
        action: 'CREATE',
        userId,
        newValues: invoice
      }, tx);

      return invoice;
    });
  }

  async calculateLineItems(tenantId, companyId, lines, tx) {
    const calculated = [];

    for (const [idx, line] of lines.entries()) {
      // Get item if specified
      let item = null;
      if (line.itemCode) {
        item = await this.itemRepository.findByCode(
          tenantId,
          companyId,
          line.itemCode,
          tx
        );

        if (!item) {
          throw new BusinessError(`Item ${line.itemCode} not found`);
        }
      }

      // Calculate amounts
      const lineAmount = line.quantity * line.unitPrice;

      const discountAmount = line.discountPercentage
        ? (lineAmount * line.discountPercentage / 100)
        : 0;

      const taxableAmount = lineAmount - discountAmount;

      let taxAmount = 0;
      let taxId = null;
      if (line.taxCode) {
        const tax = await this.taxRepository.findByCode(
          tenantId,
          companyId,
          line.taxCode,
          tx
        );

        if (tax) {
          taxAmount = taxableAmount * tax.rate / 100;
          taxId = tax.id;
        }
      }

      const totalAmount = taxableAmount + taxAmount;

      calculated.push({
        lineNumber: idx + 1,
        itemId: item?.id,
        description: line.description || item?.name,
        quantity: line.quantity,
        uomId: line.uomId || item?.baseUomId,
        unitPrice: line.unitPrice,
        lineAmount,
        discountPercentage: line.discountPercentage,
        discountAmount,
        taxId,
        taxAmount,
        totalAmount,
        projectId: line.projectId,
        departmentId: line.departmentId
      });
    }

    return calculated;
  }

  calculateInvoiceTotals(lines) {
    const subtotal = lines.reduce((sum, line) => sum + line.lineAmount, 0);
    const discountAmount = lines.reduce((sum, line) => sum + line.discountAmount, 0);
    const taxAmount = lines.reduce((sum, line) => sum + line.taxAmount, 0);
    const total = subtotal - discountAmount + taxAmount;

    return {
      subtotal,
      discountAmount,
      taxAmount,
      total
    };
  }

  async checkCreditLimit(contact, newInvoiceAmount, tx) {
    if (!contact.salesConfig?.creditLimit) {
      return; // No limit set
    }

    const creditUsed = contact.salesConfig.creditLimitUsed || 0;
    const creditLimit = contact.salesConfig.creditLimit;

    if (creditUsed + newInvoiceAmount > creditLimit) {
      throw new BusinessError(
        `Credit limit exceeded. ` +
        `Limit: ${creditLimit}, Used: ${creditUsed}, New: ${newInvoiceAmount}`
      );
    }
  }

  async postInvoice(tenantId, companyId, userId, invoiceId) {
    return await this.withTransaction(async (tx) => {
      // 1. Get invoice
      const invoice = await this.repository.findById(
        tenantId,
        companyId,
        invoiceId,
        tx
      );

      if (!invoice) {
        throw new NotFoundError('Invoice not found');
      }

      if (invoice.document.status !== 'DRAFT' && invoice.document.status !== 'APPROVED') {
        throw new BusinessError(`Cannot post invoice with status ${invoice.document.status}`);
      }

      // 2. Validate period is open
      await this.validationService.validatePeriod(
        tenantId,
        companyId,
        invoice.invoiceDate,
        tx
      );

      // 3. Auto-post to GL
      const journal = await this.glPostingService.postARInvoice(invoice, tx);

      // 4. Update invoice
      await tx.aRInvoice.update({
        where: { id: invoiceId },
        data: {
          journalId: journal.id
        }
      });

      // 5. Update document status
      await tx.document.update({
        where: { id: invoice.documentId },
        data: {
          status: 'POSTED',
          postedAt: new Date(),
          postedBy: userId
        }
      });

      // 6. Audit log
      await this.auditService.log({
        tenantId,
        companyId,
        entityType: 'ARInvoice',
        entityId: invoiceId,
        action: 'POST',
        userId,
        oldValues: { status: invoice.document.status },
        newValues: { status: 'POSTED' }
      }, tx);

      return this.repository.findById(tenantId, companyId, invoiceId, tx);
    });
  }
}
```

**Frontend:**
```typescript
// components/business/invoice/InvoiceForm.tsx
export function InvoiceForm({ invoice, onSave }: InvoiceFormProps) {
  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: invoice || {
      lines: [{ quantity: 1, unitPrice: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lines'
  });

  // Watch lines untuk auto-calculate
  const lines = form.watch('lines');

  useEffect(() => {
    // Recalculate totals when lines change
    const totals = calculateInvoiceTotals(lines);
    form.setValue('subtotal', totals.subtotal);
    form.setValue('discountAmount', totals.discountAmount);
    form.setValue('taxAmount', totals.taxAmount);
    form.setValue('total', totals.total);
  }, [lines]);

  return (
    <Form {...form} onSubmit={form.handleSubmit(onSave)}>
      {/* Header Section */}
      <section className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Invoice Header</h2>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            name="customerCode"
            label="Customer"
            render={({ field }) => (
              <ContactSelector
                {...field}
                type="CUSTOMER"
                onSelect={(contact) => {
                  field.onChange(contact.code);
                  // Auto-fill data dari customer
                  form.setValue('billingAddressId', contact.addresses[0]?.id);
                  form.setValue('paymentTermId', contact.salesConfig?.paymentTermId);
                }}
              />
            )}
          />

          <FormField
            name="invoiceDate"
            label="Invoice Date"
            type="date"
            required
          />

          <FormField
            name="dueDate"
            label="Due Date"
            type="date"
            required
          />

          <FormField
            name="currencyId"
            label="Currency"
            type="select"
            options={currencyOptions}
          />
        </div>
      </section>

      {/* Line Items Section */}
      <section className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Line Items</h2>
          <Button
            type="button"
            variant="outline"
            onClick={() => append({ quantity: 1, unitPrice: 0 })}
          >
            + Add Line
          </Button>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">#</th>
              <th className="text-left py-2">Item / Description</th>
              <th className="text-right py-2">Qty</th>
              <th className="text-left py-2">UoM</th>
              <th className="text-right py-2">Unit Price</th>
              <th className="text-right py-2">Disc %</th>
              <th className="text-left py-2">Tax</th>
              <th className="text-right py-2">Amount</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => (
              <tr key={field.id} className="border-b">
                <td className="py-2">{index + 1}</td>
                <td className="py-2">
                  <FormField
                    name={`lines.${index}.itemCode`}
                    render={({ field }) => (
                      <ItemSelector
                        {...field}
                        onSelect={(item) => {
                          field.onChange(item.code);
                          form.setValue(`lines.${index}.description`, item.name);
                          form.setValue(`lines.${index}.unitPrice`, item.salePrice);
                          form.setValue(`lines.${index}.uomId`, item.baseUomId);
                        }}
                      />
                    )}
                  />
                  <FormField
                    name={`lines.${index}.description`}
                    placeholder="Description"
                    className="mt-1"
                  />
                </td>
                <td className="py-2">
                  <FormField
                    name={`lines.${index}.quantity`}
                    type="number"
                    className="text-right"
                    min={0}
                    step={0.01}
                  />
                </td>
                <td className="py-2">
                  <FormField
                    name={`lines.${index}.uomId`}
                    type="select"
                    options={uomOptions}
                  />
                </td>
                <td className="py-2">
                  <FormField
                    name={`lines.${index}.unitPrice`}
                    type="number"
                    className="text-right"
                    min={0}
                    step={0.01}
                  />
                </td>
                <td className="py-2">
                  <FormField
                    name={`lines.${index}.discountPercentage`}
                    type="number"
                    className="text-right"
                    min={0}
                    max={100}
                    step={0.01}
                  />
                </td>
                <td className="py-2">
                  <FormField
                    name={`lines.${index}.taxCode`}
                    type="select"
                    options={taxOptions}
                  />
                </td>
                <td className="py-2 text-right font-medium">
                  {formatCurrency(lines[index]?.totalAmount || 0)}
                </td>
                <td className="py-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                  >
                    ×
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {fields.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No line items. Click "Add Line" to add items.
          </div>
        )}
      </section>

      {/* Totals Section */}
      <section className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="max-w-md ml-auto space-y-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="font-medium">
              {formatCurrency(form.watch('subtotal') || 0)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Discount:</span>
            <span className="font-medium text-red-600">
              ({formatCurrency(form.watch('discountAmount') || 0)})
            </span>
          </div>
          <div className="flex justify-between">
            <span>Tax:</span>
            <span className="font-medium">
              {formatCurrency(form.watch('taxAmount') || 0)}
            </span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>Total:</span>
            <span>{formatCurrency(form.watch('total') || 0)}</span>
          </div>
        </div>
      </section>

      {/* Memo Section */}
      <section className="bg-white p-6 rounded-lg shadow mb-6">
        <FormField
          name="memo"
          label="Memo / Notes"
          type="textarea"
          rows={3}
        />
      </section>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </Form>
  );
}
```

---

*Catatan: Dokumen ini sangat panjang (16 minggu implementasi). Ini adalah Week 1-8. Apakah Anda ingin saya lanjutkan dengan Week 9-16 (Purchase, Inventory, GL Posting, Reports, Testing)?*

*Atau lebih baik saya buat dokumen terpisah untuk setiap fase?*

---

## 📊 PROGRESS TRACKING

Gunakan GitHub Projects atau Notion untuk tracking:

```
Kanban Board:
├── Backlog
├── To Do
├── In Progress
├── In Review
├── Done

Labels:
- Priority: High/Medium/Low
- Type: Feature/Bug/Refactor/Docs
- Module: Sales/Purchase/Inventory/GL/UI

Milestones:
- Phase 1: Foundation (Week 4)
- Phase 2: Core Modules (Week 10)
- Phase 3: Integration (Week 14)
- Phase 4: Polish (Week 16)
```

---

**File ini akan terus di-update seiring progress implementasi.**
