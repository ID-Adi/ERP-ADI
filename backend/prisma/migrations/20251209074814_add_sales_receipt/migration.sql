-- CreateEnum
CREATE TYPE "ReceiptStatus" AS ENUM ('DRAFT', 'POSTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "SalesReceipt" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "receiptDate" TIMESTAMP(3) NOT NULL,
    "customerId" TEXT NOT NULL,
    "bankAccountId" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'TRANSFER',
    "amount" DECIMAL(15,2) NOT NULL,
    "notes" TEXT,
    "status" "ReceiptStatus" NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesReceiptLine" (
    "id" TEXT NOT NULL,
    "salesReceiptId" TEXT NOT NULL,
    "fakturId" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "SalesReceiptLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SalesReceipt_companyId_receiptNumber_key" ON "SalesReceipt"("companyId", "receiptNumber");

-- AddForeignKey
ALTER TABLE "SalesReceipt" ADD CONSTRAINT "SalesReceipt_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReceipt" ADD CONSTRAINT "SalesReceipt_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReceipt" ADD CONSTRAINT "SalesReceipt_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReceiptLine" ADD CONSTRAINT "SalesReceiptLine_fakturId_fkey" FOREIGN KEY ("fakturId") REFERENCES "Faktur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReceiptLine" ADD CONSTRAINT "SalesReceiptLine_salesReceiptId_fkey" FOREIGN KEY ("salesReceiptId") REFERENCES "SalesReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
