-- AlterTable
ALTER TABLE "FakturLine" ADD COLUMN     "discountAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "unit" TEXT;
