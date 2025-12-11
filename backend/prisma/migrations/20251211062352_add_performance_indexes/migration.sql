-- Performance Indexes Migration
-- Note: In production with large tables, run these indexes outside of transaction with CONCURRENTLY

-- User indexes
CREATE INDEX IF NOT EXISTS "User_companyId_idx" ON "User"("companyId");
CREATE INDEX IF NOT EXISTS "User_isActive_companyId_idx" ON "User"("isActive", "companyId");

-- Customer indexes
CREATE INDEX IF NOT EXISTS "customer_companyId_idx" ON "customer"("companyId");
CREATE INDEX IF NOT EXISTS "customer_paymentTermId_idx" ON "customer"("paymentTermId");
CREATE INDEX IF NOT EXISTS "customer_isActive_companyId_idx" ON "customer"("isActive", "companyId");

-- Item indexes
CREATE INDEX IF NOT EXISTS "Item_companyId_idx" ON "Item"("companyId");
CREATE INDEX IF NOT EXISTS "Item_isActive_companyId_idx" ON "Item"("isActive", "companyId");

-- ItemCategory indexes
CREATE INDEX IF NOT EXISTS "ItemCategory_companyId_idx" ON "ItemCategory"("companyId");

-- PaymentTerm indexes
CREATE INDEX IF NOT EXISTS "PaymentTerm_companyId_idx" ON "PaymentTerm"("companyId");

-- Salesperson indexes
CREATE INDEX IF NOT EXISTS "Salesperson_companyId_idx" ON "Salesperson"("companyId");

-- Employee indexes
CREATE INDEX IF NOT EXISTS "Employee_isActive_companyId_idx" ON "Employee"("isActive", "companyId");

-- Warehouse indexes
CREATE INDEX IF NOT EXISTS "Warehouse_companyId_idx" ON "Warehouse"("companyId");
CREATE INDEX IF NOT EXISTS "Warehouse_isActive_companyId_idx" ON "Warehouse"("isActive", "companyId");

-- ItemStock indexes
CREATE INDEX IF NOT EXISTS "ItemStock_itemId_idx" ON "ItemStock"("itemId");
CREATE INDEX IF NOT EXISTS "ItemStock_warehouseId_idx" ON "ItemStock"("warehouseId");
CREATE INDEX IF NOT EXISTS "ItemStock_warehouseId_availableStock_idx" ON "ItemStock"("warehouseId", "availableStock");

-- ItemSupplier indexes
CREATE INDEX IF NOT EXISTS "ItemSupplier_itemId_idx" ON "ItemSupplier"("itemId");
CREATE INDEX IF NOT EXISTS "ItemSupplier_itemId_isPrimary_idx" ON "ItemSupplier"("itemId", "isPrimary");

-- SalesOrder indexes
CREATE INDEX IF NOT EXISTS "SalesOrder_companyId_idx" ON "SalesOrder"("companyId");
CREATE INDEX IF NOT EXISTS "SalesOrder_customerId_idx" ON "SalesOrder"("customerId");
CREATE INDEX IF NOT EXISTS "SalesOrder_status_idx" ON "SalesOrder"("status");
CREATE INDEX IF NOT EXISTS "SalesOrder_orderDate_idx" ON "SalesOrder"("orderDate");
CREATE INDEX IF NOT EXISTS "SalesOrder_companyId_status_idx" ON "SalesOrder"("companyId", "status");

-- SalesOrderLine indexes
CREATE INDEX IF NOT EXISTS "SalesOrderLine_salesOrderId_idx" ON "SalesOrderLine"("salesOrderId");
CREATE INDEX IF NOT EXISTS "SalesOrderLine_itemId_idx" ON "SalesOrderLine"("itemId");

-- Faktur indexes (CRITICAL for performance)
CREATE INDEX IF NOT EXISTS "Faktur_companyId_idx" ON "Faktur"("companyId");
CREATE INDEX IF NOT EXISTS "Faktur_customerId_idx" ON "Faktur"("customerId");
CREATE INDEX IF NOT EXISTS "Faktur_salespersonId_idx" ON "Faktur"("salespersonId");
CREATE INDEX IF NOT EXISTS "Faktur_status_idx" ON "Faktur"("status");
CREATE INDEX IF NOT EXISTS "Faktur_fakturDate_idx" ON "Faktur"("fakturDate");
CREATE INDEX IF NOT EXISTS "Faktur_dueDate_idx" ON "Faktur"("dueDate");
CREATE INDEX IF NOT EXISTS "Faktur_status_dueDate_idx" ON "Faktur"("status", "dueDate");
CREATE INDEX IF NOT EXISTS "Faktur_customerId_status_idx" ON "Faktur"("customerId", "status");
CREATE INDEX IF NOT EXISTS "Faktur_fakturDate_status_idx" ON "Faktur"("fakturDate", "status");
CREATE INDEX IF NOT EXISTS "Faktur_salespersonId_fakturDate_idx" ON "Faktur"("salespersonId", "fakturDate");
CREATE INDEX IF NOT EXISTS "Faktur_salesOrderId_idx" ON "Faktur"("salesOrderId");
CREATE INDEX IF NOT EXISTS "Faktur_paymentTermId_idx" ON "Faktur"("paymentTermId");

-- FakturLine indexes
CREATE INDEX IF NOT EXISTS "FakturLine_fakturId_idx" ON "FakturLine"("fakturId");
CREATE INDEX IF NOT EXISTS "FakturLine_itemId_idx" ON "FakturLine"("itemId");
CREATE INDEX IF NOT EXISTS "FakturLine_warehouseId_idx" ON "FakturLine"("warehouseId");

-- FakturCost indexes
CREATE INDEX IF NOT EXISTS "FakturCost_fakturId_idx" ON "FakturCost"("fakturId");
CREATE INDEX IF NOT EXISTS "FakturCost_accountId_idx" ON "FakturCost"("accountId");

-- SalesReceipt indexes
CREATE INDEX IF NOT EXISTS "SalesReceipt_companyId_idx" ON "SalesReceipt"("companyId");
CREATE INDEX IF NOT EXISTS "SalesReceipt_customerId_idx" ON "SalesReceipt"("customerId");
CREATE INDEX IF NOT EXISTS "SalesReceipt_receiptDate_idx" ON "SalesReceipt"("receiptDate");
CREATE INDEX IF NOT EXISTS "SalesReceipt_status_idx" ON "SalesReceipt"("status");
CREATE INDEX IF NOT EXISTS "SalesReceipt_bankAccountId_idx" ON "SalesReceipt"("bankAccountId");
CREATE INDEX IF NOT EXISTS "SalesReceipt_companyId_status_idx" ON "SalesReceipt"("companyId", "status");
CREATE INDEX IF NOT EXISTS "SalesReceipt_customerId_receiptDate_idx" ON "SalesReceipt"("customerId", "receiptDate");

-- SalesReceiptLine indexes
CREATE INDEX IF NOT EXISTS "SalesReceiptLine_salesReceiptId_idx" ON "SalesReceiptLine"("salesReceiptId");
CREATE INDEX IF NOT EXISTS "SalesReceiptLine_fakturId_idx" ON "SalesReceiptLine"("fakturId");

-- Account indexes
CREATE INDEX IF NOT EXISTS "Account_companyId_idx" ON "Account"("companyId");
CREATE INDEX IF NOT EXISTS "Account_parentId_idx" ON "Account"("parentId");
CREATE INDEX IF NOT EXISTS "Account_type_idx" ON "Account"("type");
CREATE INDEX IF NOT EXISTS "Account_isActive_companyId_idx" ON "Account"("isActive", "companyId");
CREATE INDEX IF NOT EXISTS "Account_isHeader_companyId_idx" ON "Account"("isHeader", "companyId");

-- JournalEntry indexes
CREATE INDEX IF NOT EXISTS "JournalEntry_companyId_idx" ON "JournalEntry"("companyId");
CREATE INDEX IF NOT EXISTS "JournalEntry_transactionDate_companyId_idx" ON "JournalEntry"("transactionDate", "companyId");
CREATE INDEX IF NOT EXISTS "JournalEntry_sourceType_idx" ON "JournalEntry"("sourceType");
CREATE INDEX IF NOT EXISTS "JournalEntry_sourceId_idx" ON "JournalEntry"("sourceId");

-- JournalLine indexes
CREATE INDEX IF NOT EXISTS "JournalLine_journalId_idx" ON "JournalLine"("journalId");
CREATE INDEX IF NOT EXISTS "JournalLine_accountId_idx" ON "JournalLine"("accountId");

-- AccountBalance indexes
CREATE INDEX IF NOT EXISTS "AccountBalance_accountId_idx" ON "AccountBalance"("accountId");
CREATE INDEX IF NOT EXISTS "AccountBalance_period_idx" ON "AccountBalance"("period");
