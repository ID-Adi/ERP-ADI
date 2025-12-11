-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INITIAL', 'ADJ_IN', 'ADJ_OUT', 'PURCHASE', 'SALE', 'TRANSFER_IN', 'TRANSFER_OUT', 'STOCK_OPNAME');

-- CreateTable
CREATE TABLE "InventoryTransaction" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "transactionType" "TransactionType" NOT NULL,
    "referenceNo" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "costPerUnit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "InventoryTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InventoryTransaction_companyId_idx" ON "InventoryTransaction"("companyId");

-- CreateIndex
CREATE INDEX "InventoryTransaction_itemId_idx" ON "InventoryTransaction"("itemId");

-- CreateIndex
CREATE INDEX "InventoryTransaction_warehouseId_idx" ON "InventoryTransaction"("warehouseId");

-- CreateIndex
CREATE INDEX "InventoryTransaction_transactionDate_idx" ON "InventoryTransaction"("transactionDate");

-- AddForeignKey
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
