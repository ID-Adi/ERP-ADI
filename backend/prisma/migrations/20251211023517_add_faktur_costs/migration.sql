-- CreateTable
CREATE TABLE "FakturCost" (
    "id" TEXT NOT NULL,
    "fakturId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FakturCost_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FakturCost" ADD CONSTRAINT "FakturCost_fakturId_fkey" FOREIGN KEY ("fakturId") REFERENCES "Faktur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FakturCost" ADD CONSTRAINT "FakturCost_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
