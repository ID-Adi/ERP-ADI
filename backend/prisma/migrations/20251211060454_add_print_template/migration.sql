-- CreateEnum
CREATE TYPE "PrintTemplateType" AS ENUM ('ANGGARAN', 'FAKTUR_PEMBELIAN', 'FAKTUR_PENJUALAN', 'JURNAL_UMUM', 'PEKERJAAN_PESANAN', 'PEMBAYARAN', 'PEMBAYARAN_PEMBELIAN', 'PEMINDAHAN_BARANG', 'PENAMBAHAN_BAHAN_BAKU', 'PENAWARAN_PENJUALAN', 'PENCATATAN_BEBAN', 'PENERIMAAN', 'PENERIMAAN_BARANG', 'PENERIMAAN_PENJUALAN', 'PENGIRIMAN_PESANAN', 'PENYELESAIAN_PESANAN', 'PENYESUAIAN_PERSEDIAAN', 'PERINTAH_STOK_OPNAME', 'PERMINTAAN_BARANG', 'PESANAN_PEMBELIAN', 'PESANAN_PENJUALAN', 'PINDAH_ASET', 'RETUR_PEMBELIAN', 'RETUR_PENJUALAN', 'SLIP_GAJI', 'TARGET_PENJUALAN', 'TRANSFER_BANK', 'UANG_MUKA_PEMBELIAN', 'UANG_MUKA_PENJUALAN');

-- CreateTable
CREATE TABLE "PrintTemplate" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PrintTemplateType" NOT NULL,
    "content" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrintTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PrintTemplate_companyId_idx" ON "PrintTemplate"("companyId");

-- CreateIndex
CREATE INDEX "PrintTemplate_type_idx" ON "PrintTemplate"("type");

-- CreateIndex
CREATE INDEX "Account_companyId_idx" ON "Account"("companyId");

-- CreateIndex
CREATE INDEX "Account_parentId_idx" ON "Account"("parentId");

-- CreateIndex
CREATE INDEX "Account_type_idx" ON "Account"("type");

-- CreateIndex
CREATE INDEX "Account_isActive_companyId_idx" ON "Account"("isActive", "companyId");

-- CreateIndex
CREATE INDEX "Account_isHeader_companyId_idx" ON "Account"("isHeader", "companyId");

-- CreateIndex
CREATE INDEX "AccountBalance_accountId_idx" ON "AccountBalance"("accountId");

-- CreateIndex
CREATE INDEX "AccountBalance_period_idx" ON "AccountBalance"("period");

-- CreateIndex
CREATE INDEX "Employee_isActive_companyId_idx" ON "Employee"("isActive", "companyId");

-- CreateIndex
CREATE INDEX "Faktur_companyId_idx" ON "Faktur"("companyId");

-- CreateIndex
CREATE INDEX "Faktur_customerId_idx" ON "Faktur"("customerId");

-- CreateIndex
CREATE INDEX "Faktur_salespersonId_idx" ON "Faktur"("salespersonId");

-- CreateIndex
CREATE INDEX "Faktur_status_idx" ON "Faktur"("status");

-- CreateIndex
CREATE INDEX "Faktur_fakturDate_idx" ON "Faktur"("fakturDate");

-- CreateIndex
CREATE INDEX "Faktur_dueDate_idx" ON "Faktur"("dueDate");

-- CreateIndex
CREATE INDEX "Faktur_status_dueDate_idx" ON "Faktur"("status", "dueDate");

-- CreateIndex
CREATE INDEX "Faktur_customerId_status_idx" ON "Faktur"("customerId", "status");

-- CreateIndex
CREATE INDEX "Faktur_fakturDate_status_idx" ON "Faktur"("fakturDate", "status");

-- CreateIndex
CREATE INDEX "Faktur_salespersonId_fakturDate_idx" ON "Faktur"("salespersonId", "fakturDate");

-- CreateIndex
CREATE INDEX "Faktur_salesOrderId_idx" ON "Faktur"("salesOrderId");

-- CreateIndex
CREATE INDEX "Faktur_paymentTermId_idx" ON "Faktur"("paymentTermId");

-- CreateIndex
CREATE INDEX "FakturCost_fakturId_idx" ON "FakturCost"("fakturId");

-- CreateIndex
CREATE INDEX "FakturCost_accountId_idx" ON "FakturCost"("accountId");

-- CreateIndex
CREATE INDEX "FakturLine_fakturId_idx" ON "FakturLine"("fakturId");

-- CreateIndex
CREATE INDEX "FakturLine_itemId_idx" ON "FakturLine"("itemId");

-- CreateIndex
CREATE INDEX "FakturLine_warehouseId_idx" ON "FakturLine"("warehouseId");

-- CreateIndex
CREATE INDEX "Item_companyId_idx" ON "Item"("companyId");

-- CreateIndex
CREATE INDEX "Item_isActive_companyId_idx" ON "Item"("isActive", "companyId");

-- CreateIndex
CREATE INDEX "ItemCategory_companyId_idx" ON "ItemCategory"("companyId");

-- CreateIndex
CREATE INDEX "ItemStock_itemId_idx" ON "ItemStock"("itemId");

-- CreateIndex
CREATE INDEX "ItemStock_warehouseId_idx" ON "ItemStock"("warehouseId");

-- CreateIndex
CREATE INDEX "ItemStock_warehouseId_availableStock_idx" ON "ItemStock"("warehouseId", "availableStock");

-- CreateIndex
CREATE INDEX "ItemSupplier_itemId_idx" ON "ItemSupplier"("itemId");

-- CreateIndex
CREATE INDEX "ItemSupplier_itemId_isPrimary_idx" ON "ItemSupplier"("itemId", "isPrimary");

-- CreateIndex
CREATE INDEX "JournalEntry_companyId_idx" ON "JournalEntry"("companyId");

-- CreateIndex
CREATE INDEX "JournalEntry_transactionDate_companyId_idx" ON "JournalEntry"("transactionDate", "companyId");

-- CreateIndex
CREATE INDEX "JournalEntry_sourceType_idx" ON "JournalEntry"("sourceType");

-- CreateIndex
CREATE INDEX "JournalEntry_sourceId_idx" ON "JournalEntry"("sourceId");

-- CreateIndex
CREATE INDEX "JournalLine_journalId_idx" ON "JournalLine"("journalId");

-- CreateIndex
CREATE INDEX "JournalLine_accountId_idx" ON "JournalLine"("accountId");

-- CreateIndex
CREATE INDEX "PaymentTerm_companyId_idx" ON "PaymentTerm"("companyId");

-- CreateIndex
CREATE INDEX "SalesOrder_companyId_idx" ON "SalesOrder"("companyId");

-- CreateIndex
CREATE INDEX "SalesOrder_customerId_idx" ON "SalesOrder"("customerId");

-- CreateIndex
CREATE INDEX "SalesOrder_status_idx" ON "SalesOrder"("status");

-- CreateIndex
CREATE INDEX "SalesOrder_orderDate_idx" ON "SalesOrder"("orderDate");

-- CreateIndex
CREATE INDEX "SalesOrder_companyId_status_idx" ON "SalesOrder"("companyId", "status");

-- CreateIndex
CREATE INDEX "SalesOrderLine_salesOrderId_idx" ON "SalesOrderLine"("salesOrderId");

-- CreateIndex
CREATE INDEX "SalesOrderLine_itemId_idx" ON "SalesOrderLine"("itemId");

-- CreateIndex
CREATE INDEX "SalesReceipt_companyId_idx" ON "SalesReceipt"("companyId");

-- CreateIndex
CREATE INDEX "SalesReceipt_customerId_idx" ON "SalesReceipt"("customerId");

-- CreateIndex
CREATE INDEX "SalesReceipt_receiptDate_idx" ON "SalesReceipt"("receiptDate");

-- CreateIndex
CREATE INDEX "SalesReceipt_status_idx" ON "SalesReceipt"("status");

-- CreateIndex
CREATE INDEX "SalesReceipt_bankAccountId_idx" ON "SalesReceipt"("bankAccountId");

-- CreateIndex
CREATE INDEX "SalesReceipt_companyId_status_idx" ON "SalesReceipt"("companyId", "status");

-- CreateIndex
CREATE INDEX "SalesReceipt_customerId_receiptDate_idx" ON "SalesReceipt"("customerId", "receiptDate");

-- CreateIndex
CREATE INDEX "SalesReceiptLine_salesReceiptId_idx" ON "SalesReceiptLine"("salesReceiptId");

-- CreateIndex
CREATE INDEX "SalesReceiptLine_fakturId_idx" ON "SalesReceiptLine"("fakturId");

-- CreateIndex
CREATE INDEX "Salesperson_companyId_idx" ON "Salesperson"("companyId");

-- CreateIndex
CREATE INDEX "User_companyId_idx" ON "User"("companyId");

-- CreateIndex
CREATE INDEX "User_isActive_companyId_idx" ON "User"("isActive", "companyId");

-- CreateIndex
CREATE INDEX "Warehouse_companyId_idx" ON "Warehouse"("companyId");

-- CreateIndex
CREATE INDEX "Warehouse_isActive_companyId_idx" ON "Warehouse"("isActive", "companyId");

-- CreateIndex
CREATE INDEX "customer_companyId_idx" ON "customer"("companyId");

-- CreateIndex
CREATE INDEX "customer_paymentTermId_idx" ON "customer"("paymentTermId");

-- CreateIndex
CREATE INDEX "customer_isActive_companyId_idx" ON "customer"("isActive", "companyId");

-- AddForeignKey
ALTER TABLE "PrintTemplate" ADD CONSTRAINT "PrintTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
