/*
  Warnings:

  - Added the required column `itemName` to the `FakturLine` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FakturLine" ADD COLUMN     "itemName" TEXT NOT NULL,
ADD COLUMN     "salespersonId" TEXT,
ALTER COLUMN "description" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "FakturLine_salespersonId_idx" ON "FakturLine"("salespersonId");

-- AddForeignKey
ALTER TABLE "FakturLine" ADD CONSTRAINT "FakturLine_salespersonId_fkey" FOREIGN KEY ("salespersonId") REFERENCES "Salesperson"("id") ON DELETE SET NULL ON UPDATE CASCADE;
