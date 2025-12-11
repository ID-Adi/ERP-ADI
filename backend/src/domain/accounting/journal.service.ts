import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export interface JournalLineInput {
    accountId: string;
    description?: string;
    debit: number;
    credit: number;
}

export interface CreateJournalInput {
    companyId: string;
    transactionDate: Date;
    transactionNo: string;
    reference?: string;
    description?: string;
    sourceType?: string;
    sourceId?: string;
    lines: JournalLineInput[];
}

export class JournalService {
    /**
     * Create a new Journal Entry with multiple lines.
     * Validates that total Debit equals total Credit.
     */
    async createJournalEntry(data: CreateJournalInput) {
        const {
            companyId,
            transactionDate,
            transactionNo,
            reference,
            description,
            sourceType,
            sourceId,
            lines,
        } = data;

        // 1. Validate Balance
        const totalDebit = lines.reduce((sum, line) => sum + line.debit, 0);
        const totalCredit = lines.reduce((sum, line) => sum + line.credit, 0);

        // Allow small floating point diff
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            throw new Error(
                `Journal Entry is not balanced. Debit: ${totalDebit}, Credit: ${totalCredit}`
            );
        }

        // 2. Create Transaction
        const journalEntry = await prisma.journalEntry.create({
            data: {
                companyId,
                transactionDate,
                transactionNo,
                reference,
                description,
                sourceType,
                sourceId,
                lines: {
                    create: lines.map((line) => ({
                        accountId: line.accountId,
                        description: line.description,
                        debit: line.debit,
                        credit: line.credit,
                    })),
                },
            },
            include: {
                lines: true,
            },
        });

        return journalEntry;
    }

    /**
     * Generate a Transaction Number (e.g., JE-202312-0001)
     * This is a simple implementation, ideally should be improved for concurrency.
     */
    async generateTransactionNumber(companyId: string, date: Date): Promise<string> {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const prefix = `JV-${year}${month}`;

        const lastEntry = await prisma.journalEntry.findFirst({
            where: {
                companyId,
                transactionNo: {
                    startsWith: prefix,
                },
            },
            orderBy: {
                transactionNo: "desc",
            },
        });

        let sequence = 1;
        if (lastEntry) {
            const parts = lastEntry.transactionNo.split("-");
            const lastSeq = parseInt(parts[parts.length - 1]);
            if (!isNaN(lastSeq)) {
                sequence = lastSeq + 1;
            }
        }

        return `${prefix}-${String(sequence).padStart(4, "0")}`;
    }

    // ==========================================================================
    // SPECIFIC JOURNAL CREATORS
    // ==========================================================================

    /**
     * Create Sales Journal (AR vs Sales + Tax)
     */
    async createSalesJournal(tx: Prisma.TransactionClient, faktur: any, lines: any[]) {
        const { companyId, customer, fakturNumber, fakturDate, totalAmount, taxAmount, id } = faktur;

        if (!customer) throw new Error("Customer data is missing for Journal Creation");

        // 1. Resolve Accounts
        const arAccount = customer.receivableAccountId;
        if (!arAccount) throw new Error(`Customer ${customer.name} missing Receivable Account setting.`);

        // Group Sales by Account
        // We need 'lines' to have 'item' with 'accounts' included
        const validLines = lines.filter((l) => l.itemId);
        const journalLines: JournalLineInput[] = [];

        // DEBIT: AR
        journalLines.push({
            accountId: arAccount,
            description: `Piutang Usaha - ${fakturNumber}`,
            debit: Number(totalAmount),
            credit: 0,
        });

        // CREDIT: Sales (Grouped by Account)
        const salesByAccount: Record<string, number> = {};

        for (const line of validLines) {
            if (!line.item) continue;

            // Priority: Item Specific -> Customer Default -> Default Sales Account?
            let salesAccountId = line.item.accounts?.find((a: any) => a.accountType === 'SALES')?.accountId;
            if (!salesAccountId) salesAccountId = customer.salesAccountId;

            if (!salesAccountId) {
                // Fallback or Error? For now Error to ensure data quality
                throw new Error(`No Sales Account found for item ${line.itemName} (${line.item.code})`);
            }

            const amount = Number(line.amount);
            salesByAccount[salesAccountId] = (salesByAccount[salesAccountId] || 0) + amount;
        }

        for (const [accId, amount] of Object.entries(salesByAccount)) {
            journalLines.push({
                accountId: accId,
                description: `Penjualan - ${fakturNumber}`,
                debit: 0,
                credit: amount,
            });
        }

        // CREDIT: Tax (If any)
        if (Number(taxAmount) > 0) {
            const taxAccount = await tx.account.findFirst({
                where: {
                    companyId,
                    OR: [
                        { name: { contains: 'Pajak', mode: 'insensitive' } },
                        { name: { contains: 'PPN', mode: 'insensitive' } }
                    ],
                    type: 'OTHER_CURRENT_LIABILITIES', // Liabilitas Lancar Lainnya
                    isActive: true
                }
            });

            // Fallback if no specific Tax Account found? 
            // Ideally should be configured in Settings, but for now dynamic lookup
            if (!taxAccount) {
                // Try finding ANY tax account to avoid blocking? No, better explicit error.
                throw new Error("Tax Account (PPN/Pajak) not found in COA.");
            }

            journalLines.push({
                accountId: taxAccount.id,
                description: `Utang Pajak - ${fakturNumber}`,
                debit: 0,
                credit: Number(taxAmount),
            });
        }

        // Create Entry
        // We use generic createJournalEntry logic but adapted for TransactionClient if possible?
        // The generic method uses `prisma.journalEntry` which is global.
        // We should allow passing `tx` to generic method or inline it.
        // Refactoring generic method to accept tx.

        // For now inline creation to support `tx`
        const transactionNo = await this.generateTransactionNumber(companyId, new Date(fakturDate));

        await tx.journalEntry.create({
            data: {
                companyId,
                transactionDate: new Date(fakturDate),
                transactionNo,
                reference: fakturNumber,
                sourceType: 'SALES_INVOICE',
                sourceId: id,
                description: `Invoice ${fakturNumber}`,
                lines: {
                    create: journalLines.map(l => ({
                        accountId: l.accountId,
                        description: l.description,
                        debit: l.debit,
                        credit: l.credit
                    }))
                }
            }
        });
    }

    /**
     * Create COGS Journal (COGS vs Inventory) - Perpetual Method
     */
    async createCOGSJournal(tx: Prisma.TransactionClient, faktur: any, lines: any[]) {
        const { companyId, customer, fakturNumber, fakturDate, id } = faktur;

        const journalLines: JournalLineInput[] = [];
        const validLines = lines.filter((l) => l.itemId && l.quantity > 0 && l.item?.isStockItem);

        for (const line of validLines) {
            const item = line.item;
            if (!item) continue;

            // Calculate Cost
            // Priority: 
            // 1. Moving Average Cost (from InventoryTransaction history? Or Item field?)
            // 2. Purchase Price (Standard Cost)

            // Based on User Request, they want "Refrensi".
            // Ideally we should have a `averageCost` field on Item or ItemStock. 
            // Currently schema doesn't have `averageCost` on Item. 
            // It has `ItemPricing` (PURCHASE).

            // Let's use PRE-FETCHED pricing data if passed, or we look it up.
            // To avoid N+1, caller should pass enriched lines.

            let cost = 0;
            const purchasePricing = item.pricing?.find((p: any) => p.priceType === 'PURCHASE');
            if (purchasePricing) {
                cost = Number(purchasePricing.price);
            } else {
                // Fallback: Check Supplier Price
                const supplier = item.suppliers?.find((s: any) => s.isPrimary);
                if (supplier) cost = Number(supplier.purchasePrice);
            }

            const totalCost = Number(line.quantity) * cost;
            if (totalCost <= 0) continue;

            // Accounts
            let cogsAccountId = item.accounts?.find((a: any) => a.accountType === 'COGS')?.accountId;
            if (!cogsAccountId) cogsAccountId = item.category?.hppAccountId;
            if (!cogsAccountId) cogsAccountId = customer.cogsAccountId;

            let inventoryAccountId = item.accounts?.find((a: any) => a.accountType === 'INVENTORY')?.accountId;
            // If no Item Inventory Account, maybe Category Asset Account?
            // Or fallback to generic Inventory Account?

            if (cogsAccountId && inventoryAccountId) {
                // DEBIT COGS
                journalLines.push({
                    accountId: cogsAccountId,
                    description: `HPP - ${item.name}`,
                    debit: totalCost,
                    credit: 0
                });
                // CREDIT Inventory
                journalLines.push({
                    accountId: inventoryAccountId,
                    description: `Persediaan - ${item.name}`,
                    debit: 0,
                    credit: totalCost
                });
            }
        }

        if (journalLines.length > 0) {
            const transactionNo = (await this.generateTransactionNumber(companyId, new Date(fakturDate))) + "-COGS";

            await tx.journalEntry.create({
                data: {
                    companyId,
                    transactionDate: new Date(fakturDate),
                    transactionNo,
                    reference: fakturNumber,
                    sourceType: 'SALES_COGS',
                    sourceId: id,
                    description: `HPP Invoice ${fakturNumber}`,
                    lines: {
                        create: journalLines.map(l => ({
                            accountId: l.accountId,
                            description: l.description,
                            debit: l.debit,
                            credit: l.credit
                        }))
                    }
                }
            });
        }
    }

    /**
     * Limit implementation of voiding to specific sourceId
     */
    async voidJournal(tx: Prisma.TransactionClient, sourceId: string) {
        const journals = await tx.journalEntry.findMany({
            where: { sourceId }
        });

        for (const j of journals) {
            await tx.journalLine.deleteMany({ where: { journalId: j.id } });
            await tx.journalEntry.delete({ where: { id: j.id } });
        }
    }
}
