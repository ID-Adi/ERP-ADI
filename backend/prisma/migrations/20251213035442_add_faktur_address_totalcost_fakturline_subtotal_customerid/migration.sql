-- AlterTable
ALTER TABLE "Faktur" ADD COLUMN     "address" TEXT,
ADD COLUMN     "totalCost" DECIMAL(15,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "FakturLine" ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "subtotalBeforeDiscount" DECIMAL(15,2) NOT NULL DEFAULT 0;
