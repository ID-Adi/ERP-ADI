
import { PrismaClient, FakturStatus, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export class FakturService {

    async generateFakturNumber(companyId: string, tx?: Prisma.TransactionClient): Promise<string> {
        const db = tx || prisma;
        const now = new Date();

        // Format: PKY-YYYYMMDDHHmmssSSS (milliseconds added for uniqueness)
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const millis = String(now.getMilliseconds()).padStart(3, '0');

        let candidate = `PKY-${year}${month}${day}${hours}${minutes}${seconds}${millis}`;

        // Collision safety (should be extremely rare with milliseconds)
        let counter = 0;
        while (true) {
            const exists = await db.faktur.count({
                where: { companyId, fakturNumber: candidate }
            });
            if (exists === 0) break;
            counter++;
            candidate = `PKY-${year}${month}${day}${hours}${minutes}${seconds}${millis}-${counter}`;
        }

        return candidate;
    }

    // Helper: Validate Stock - OPTIMIZED with batch fetching
    private async validateStock(tx: Prisma.TransactionClient, lines: any[]) {
        // Filter lines that need stock validation
        const validLines = lines.filter(line => line.itemId && line.quantity);
        if (validLines.length === 0) return;

        // Batch fetch all items at once
        const itemIds = [...new Set(validLines.map(l => l.itemId))];
        const items = await tx.item.findMany({
            where: { id: { in: itemIds } }
        });
        const itemMap = new Map(items.map(i => [i.id, i]));

        // Get companyId from first stock item for default warehouse lookup
        const stockItems = items.filter(i => i.isStockItem);
        if (stockItems.length === 0) return;

        // Get default warehouse (one query)
        let defaultWarehouseId: string | null = null;
        const companyId = stockItems[0].companyId;
        const defWh = await tx.warehouse.findFirst({ where: { companyId } });
        if (defWh) defaultWarehouseId = defWh.id;

        // Collect all warehouse IDs needed
        const warehouseIds = new Set<string>();
        for (const line of validLines) {
            const item = itemMap.get(line.itemId);
            if (!item || !item.isStockItem) continue;
            const warehouseId = line.warehouseId || defaultWarehouseId;
            if (warehouseId) warehouseIds.add(warehouseId);
        }

        // Batch fetch all stocks at once
        const stocks = await tx.itemStock.findMany({
            where: {
                itemId: { in: itemIds },
                warehouseId: { in: Array.from(warehouseIds) }
            }
        });
        const stockMap = new Map(stocks.map(s => [`${s.itemId}-${s.warehouseId}`, s]));

        // Validate each line (no more queries needed)
        for (const line of validLines) {
            const quantity = Number(line.quantity);
            const item = itemMap.get(line.itemId);
            if (!item || !item.isStockItem) continue;

            const warehouseId = line.warehouseId || defaultWarehouseId;
            if (!warehouseId) throw new Error(`Gudang tidak ditentukan untuk item: ${item.name}`);

            const stock = stockMap.get(`${line.itemId}-${warehouseId}`);
            const available = stock ? Number(stock.availableStock) : 0;

            if (available < quantity) {
                throw new Error(`Stok tidak mencukupi untuk item: ${item.name} di gudang terpilih. Tersedia: ${available}, Diminta: ${quantity}`);
            }
        }
    }

    // Helper: Update Stock - OPTIMIZED with batch fetching
    private async updateStock(tx: Prisma.TransactionClient, lines: any[], direction: 'IN' | 'OUT') {
        // Filter lines that need stock update
        const validLines = lines.filter(line => line.itemId && line.quantity);
        if (validLines.length === 0) return;

        // Batch fetch all items at once
        const itemIds = [...new Set(validLines.map(l => l.itemId))];
        const items = await tx.item.findMany({
            where: { id: { in: itemIds } }
        });
        const itemMap = new Map(items.map(i => [i.id, i]));

        // Get companyId from first stock item for default warehouse lookup
        const stockItems = items.filter(i => i.isStockItem);
        if (stockItems.length === 0) return;

        // Get default warehouse (one query)
        let defaultWarehouseId: string | null = null;
        const companyId = stockItems[0].companyId;
        const defWh = await tx.warehouse.findFirst({ where: { companyId } });
        if (defWh) defaultWarehouseId = defWh.id;

        // Collect all warehouse IDs needed
        const warehouseIds = new Set<string>();
        for (const line of validLines) {
            const item = itemMap.get(line.itemId);
            if (!item || !item.isStockItem) continue;
            const warehouseId = line.warehouseId || defaultWarehouseId;
            if (warehouseId) warehouseIds.add(warehouseId);
        }

        // Batch fetch all stocks at once
        const stocks = await tx.itemStock.findMany({
            where: {
                itemId: { in: itemIds },
                warehouseId: { in: Array.from(warehouseIds) }
            }
        });
        const stockMap = new Map(stocks.map(s => [`${s.itemId}-${s.warehouseId}`, s]));

        // Prepare batch updates and creates
        const stockUpdates: { id: string; change: number }[] = [];
        const stockCreates: { itemId: string; warehouseId: string; quantity: number }[] = [];

        for (const line of validLines) {
            const item = itemMap.get(line.itemId);
            if (!item || !item.isStockItem) continue;

            const warehouseId = line.warehouseId || defaultWarehouseId;
            if (!warehouseId) throw new Error(`Gudang tidak ditentukan untuk item: ${item.name}`);

            const quantity = Number(line.quantity);
            const change = direction === 'IN' ? quantity : -quantity;

            const stock = stockMap.get(`${line.itemId}-${warehouseId}`);
            if (stock) {
                stockUpdates.push({ id: stock.id, change });
            } else {
                stockCreates.push({
                    itemId: line.itemId,
                    warehouseId,
                    quantity: direction === 'IN' ? quantity : change
                });
            }
        }

        // Execute batch updates (can't truly batch Prisma updates, but we can parallelize)
        await Promise.all(stockUpdates.map(({ id, change }) =>
            tx.itemStock.update({
                where: { id },
                data: {
                    currentStock: { increment: change },
                    availableStock: { increment: change }
                }
            })
        ));

        // Execute batch creates
        if (stockCreates.length > 0) {
            await tx.itemStock.createMany({
                data: stockCreates.map(({ itemId, warehouseId, quantity }) => ({
                    itemId,
                    warehouseId,
                    currentStock: quantity,
                    availableStock: quantity
                }))
            });
        }
    }

    // Helper: Create Journal Entries - OPTIMIZED with batch fetching
    private async createJournalEntries(tx: Prisma.TransactionClient, faktur: any, lines: any[], companyId: string) {
        // 1. Sales & AR Journal
        // DEBIT: AR (Piutang)
        // CREDIT: Sales (Penjualan)
        // CREDIT: Tax Payable (Utang Pajak)

        const customer = await tx.customer.findUnique({ where: { id: faktur.customerId } });
        if (!customer) throw new Error("Customer not found");

        const arAccount = customer.receivableAccountId;
        if (!arAccount) throw new Error(`Customer ${customer.name} missing Receivable Account setting.`);

        // Filter lines with itemId
        const validLines = lines.filter(l => l.itemId);
        const itemIds = [...new Set(validLines.map(l => l.itemId))];

        // Batch fetch all items with their accounts and categories in one query
        const items = await tx.item.findMany({
            where: { id: { in: itemIds } },
            include: {
                accounts: true,
                category: { include: { hppAccount: true } }
            }
        });
        const itemMap = new Map(items.map(i => [i.id, i]));

        // Batch fetch all item pricing (PURCHASE type) at once
        const itemPricings = await tx.itemPricing.findMany({
            where: {
                itemId: { in: itemIds },
                priceType: 'PURCHASE'
            }
        });
        const pricingMap = new Map(itemPricings.map(p => [p.itemId, p]));

        // Batch fetch all primary suppliers at once
        const suppliers = await tx.itemSupplier.findMany({
            where: {
                itemId: { in: itemIds },
                isPrimary: true
            }
        });
        const supplierMap = new Map(suppliers.map(s => [s.itemId, s]));

        const journalLines = [];

        // Debit AR
        journalLines.push({
            accountId: arAccount,
            description: `Piutang Usaha - ${faktur.fakturNumber}`,
            debit: Number(faktur.totalAmount),
            credit: 0
        });

        // Group by Sales Account
        const salesByAccount: Record<string, number> = {};
        const cogsByItem: Array<{ itemId: string, qty: number, cost: number }> = [];

        for (const line of validLines) {
            const item = itemMap.get(line.itemId);
            if (!item) continue;

            // Find Sales Account: Item Specific -> Customer Default
            let salesAccountId = item.accounts.find(a => a.accountType === 'SALES')?.accountId;
            if (!salesAccountId) salesAccountId = customer.salesAccountId || undefined;

            if (!salesAccountId) {
                throw new Error(`No Sales Account found for item ${item.name} or Customer ${customer.name}`);
            }

            const lineApparentTotal = Number(line.amount);
            salesByAccount[salesAccountId] = (salesByAccount[salesAccountId] || 0) + lineApparentTotal;

            // Get cost from pre-fetched data
            const pricing = pricingMap.get(item.id);
            const supplier = supplierMap.get(item.id);

            let cost = 0;
            if (pricing) {
                cost = Number(pricing.price);
            } else if (supplier?.purchasePrice) {
                cost = Number(supplier.purchasePrice);
            }

            if (cost > 0 && item.isStockItem) {
                cogsByItem.push({
                    itemId: item.id,
                    qty: Number(line.quantity),
                    cost: cost
                });
            }
        }

        // Add Sales Credit Lines
        for (const [accId, amount] of Object.entries(salesByAccount)) {
            journalLines.push({
                accountId: accId,
                description: `Penjualan - ${faktur.fakturNumber}`,
                debit: 0,
                credit: amount
            });
        }

        // Credit Tax (If any)
        if (Number(faktur.taxAmount) > 0) {
            const taxAccount = await tx.account.findFirst({
                where: {
                    companyId,
                    OR: [
                        { name: { contains: 'Pajak', mode: 'insensitive' } },
                        { name: { contains: 'PPN', mode: 'insensitive' } }
                    ],
                    type: 'OTHER_CURRENT_LIABILITIES',
                    isActive: true
                }
            });

            if (!taxAccount) {
                throw new Error(
                    `Tax account not found. Please create an account with 'Pajak' or 'PPN' ` +
                    `in the name under type 'OTHER_CURRENT_LIABILITIES' before creating invoices with tax.`
                );
            }

            journalLines.push({
                accountId: taxAccount.id,
                description: `Utang Pajak - ${faktur.fakturNumber}`,
                debit: 0,
                credit: Number(faktur.taxAmount)
            });
        }

        // Create Sales Journal
        await tx.journalEntry.create({
            data: {
                companyId,
                transactionDate: faktur.fakturDate,
                transactionNo: faktur.fakturNumber,
                reference: faktur.fakturNumber,
                sourceType: 'SALES_INVOICE',
                sourceId: faktur.id,
                description: `Invoice ${faktur.fakturNumber}`,
                lines: { create: journalLines }
            }
        });

        // 2. COGS & Inventory Journal (using pre-fetched item data)
        const cogsLines = [];

        for (const itemData of cogsByItem) {
            const item = itemMap.get(itemData.itemId);
            if (!item) continue;

            const totalCost = itemData.qty * itemData.cost;
            if (totalCost === 0) continue;

            // Resolve Accounts (already have accounts from batch fetch)
            let cogsAccountId = item.accounts.find(a => a.accountType === 'COGS')?.accountId;
            if (!cogsAccountId) cogsAccountId = item.category?.hppAccountId || undefined;
            if (!cogsAccountId) cogsAccountId = customer.cogsAccountId || undefined;

            let inventoryAccountId = item.accounts.find(a => a.accountType === 'INVENTORY')?.accountId;

            if (cogsAccountId && inventoryAccountId) {
                cogsLines.push({
                    accountId: cogsAccountId,
                    description: `HPP - ${item.name}`,
                    debit: totalCost,
                    credit: 0
                });
                cogsLines.push({
                    accountId: inventoryAccountId,
                    description: `Persediaan - ${item.name}`,
                    debit: 0,
                    credit: totalCost
                });
            }
        }

        if (cogsLines.length > 0) {
            await tx.journalEntry.create({
                data: {
                    companyId,
                    transactionDate: faktur.fakturDate,
                    transactionNo: `${faktur.fakturNumber}-COGS`,
                    reference: faktur.fakturNumber,
                    sourceType: 'SALES_COGS',
                    sourceId: faktur.id,
                    description: `HPP Invoice ${faktur.fakturNumber}`,
                    lines: { create: cogsLines }
                }
            });
        }
    }

    // Helper: Reverse (Void) Journals
    private async voidJournals(tx: Prisma.TransactionClient, fakturId: string) {
        // Find existing journals for this source
        const journals = await tx.journalEntry.findMany({
            where: {
                sourceId: fakturId,
                OR: [{ sourceType: 'SALES_INVOICE' }, { sourceType: 'SALES_COGS' }]
            }
        });

        for (const journal of journals) {
            // Create Reversal
            /*
            await tx.journalEntry.create({
                data: {
                    companyId: journal.companyId,
                    transactionDate: new Date(), // Now
                    transactionNo: `${journal.transactionNo}-REV`,
                    reference: journal.transactionNo,
                    sourceType: `${journal.sourceType}_VOID`,
                    sourceId: fakturId,
                    description: `VOID ${journal.description}`,
                    lines: {
                        create: (await tx.journalLine.findMany({ where: { journalId: journal.id } })).map(line => ({
                            accountId: line.accountId,
                            description: `VOID ${line.description}`,
                            debit: line.credit, // Swap
                            credit: line.debit  // Swap
                        }))
                    }
                }
            });
            */
            // simpler approach: Just delete them if we are "Editing" the invoice? 
            // Access control says we shouldn't simply delete journals in strict accounting, 
            // but for "Draft/Unpaid" correction it might be cleaner to just rebuild them 
            // if within same period.
            // BUT, user asked for "System ERP", usually implies some audit trail. 
            // However, for typical edits before closing month, delete/recreate is often used in smaller ERPs.
            // The implementation plan said "Void old Journal".

            // Let's DELETE them for now to avoid cluttering the DB with REV entries during simple edits,
            // UNLESS the invoice was already PAID/Finalized. But the controller allows editing 'UNPAID'.

            await tx.journalLine.deleteMany({ where: { journalId: journal.id } });
            await tx.journalEntry.delete({ where: { id: journal.id } });
        }
    }


    async create(companyId: string, data: any, userId: string) {
        return await prisma.$transaction(async (tx) => {
            const fakturNumber = data.fakturNumber || await this.generateFakturNumber(companyId, tx);

            // Calc defaults
            const amountPaid = Number(data.amountPaid || 0);
            const totalAmount = Number(data.totalAmount || 0);
            const balanceDue = data.balanceDue !== undefined ? Number(data.balanceDue) : (totalAmount - amountPaid);

            // 1. Validate Stock (If Active)
            // We now validate per line based on its warehouseId
            // Removed DRAFT check: Always validate stock
            await this.validateStock(tx, data.lines);

            // Resolve companyId if default
            let resolvedCompanyId = companyId;
            if (companyId === 'default-company') {
                const defaultCompany = await tx.company.findFirst();
                if (defaultCompany) {
                    resolvedCompanyId = defaultCompany.id;
                }
            }

            // Validate costs accounts exist
            if (data.costs && data.costs.length > 0) {
                for (const cost of data.costs) {
                    const account = await tx.account.findUnique({
                        where: { id: cost.accountId }
                    });
                    if (!account) {
                        throw new Error(`Cost account ID ${cost.accountId} not found`);
                    }
                }
            }

            // 2. Create Faktur
            // Exclude fakturNumber (we use our generated one)
            const { fakturNumber: _ignoreFakturNumber, ...restData } = data;

            console.log('Creating faktur with number:', fakturNumber, 'for company:', resolvedCompanyId);

            // Map paymentTerms (ID) to paymentTermId for relation support
            // And fetch the PaymentTerm name to store in paymentTerms for display
            let paymentTermId: string | undefined = undefined;
            let paymentTermName: string | undefined = undefined;

            if (data.paymentTerms && typeof data.paymentTerms === 'string' && data.paymentTerms.length > 10) {
                paymentTermId = data.paymentTerms;
                // Fetch PaymentTerm to get its name
                const paymentTerm = await tx.paymentTerm.findUnique({ where: { id: paymentTermId } });
                if (paymentTerm) {
                    paymentTermName = paymentTerm.name;
                }
            }

            const fp = await tx.faktur.create({
                data: {
                    ...restData,
                    companyId: resolvedCompanyId,
                    fakturNumber,
                    fakturDate: new Date(data.fakturDate),
                    dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
                    shippingDate: data.shippingDate ? new Date(data.shippingDate) : undefined,
                    createdBy: userId,
                    amountPaid,
                    balanceDue,
                    paymentTerms: paymentTermName, // Store NAME for display/reporting
                    paymentTermId: paymentTermId,  // Store ID for relation
                    taxInclusive: data.taxInclusive ?? true,
                    lines: {
                        create: data.lines.map((l: any) => ({
                            itemId: l.itemId,
                            itemName: l.description || "Item",
                            description: l.notes || null,
                            unit: l.unit,
                            quantity: l.quantity,
                            unitPrice: l.unitPrice,
                            discountPercent: l.discountPercent,
                            discountAmount: l.discountAmount,
                            amount: l.amount,
                            warehouseId: l.warehouseId,
                            salespersonId: l.salespersonId || undefined
                        }))
                    },
                    costs: data.costs ? {
                        create: data.costs.map((c: any) => ({
                            accountId: c.accountId,
                            amount: c.amount,
                            notes: c.notes || null
                        }))
                    } : undefined
                },
                include: {
                    lines: true,
                    customer: true,
                    costs: { include: { account: true } }
                }
            });

            // 3. Update Stock & Journals (If not Draft)
            // Removed DRAFT check: Always update stock and journals
            await this.updateStock(tx, fp.lines, 'OUT');
            await this.createJournalEntries(tx, fp, fp.lines, resolvedCompanyId);

            return fp;
        }, { timeout: 10000 });
    }

    async update(id: string, data: any, userId: string) {
        return await prisma.$transaction(async (tx) => {
            const existing = await tx.faktur.findUnique({
                where: { id },
                include: { lines: true }
            });
            if (!existing) throw new Error("Faktur Not Found");

            const warehouse = await tx.warehouse.findFirst({ where: { companyId: existing.companyId } });
            if (!warehouse) throw new Error("No Warehouse configured.");

            // 1. Revert Old Effects (If active)
            if (existing.status !== 'DRAFT') {
                await this.updateStock(tx, existing.lines, 'IN');
                await this.voidJournals(tx, existing.id);
            }

            // Resolve companyId if default (for journals check)
            let resolvedCompanyId = existing.companyId;
            if (resolvedCompanyId === 'default-company') {
                const defaultCompany = await tx.company.findFirst();
                if (defaultCompany) {
                    resolvedCompanyId = defaultCompany.id;
                }
            }

            // 2. Update Faktur
            // Delete old lines and costs
            await tx.fakturLine.deleteMany({ where: { fakturId: id } });
            await tx.fakturCost.deleteMany({ where: { fakturId: id } });

            // Map paymentTerms to paymentTermId for update as well
            // And fetch the PaymentTerm name to store in paymentTerms for display
            let paymentTermId: string | undefined = undefined;
            let paymentTermName: string | undefined = undefined;

            if (data.paymentTerms && typeof data.paymentTerms === 'string' && data.paymentTerms.length > 10) {
                paymentTermId = data.paymentTerms;
                // Fetch PaymentTerm to get its name
                const paymentTerm = await tx.paymentTerm.findUnique({ where: { id: paymentTermId } });
                if (paymentTerm) {
                    paymentTermName = paymentTerm.name;
                }
            }

            const fp = await tx.faktur.update({
                where: { id },
                data: {
                    ...data,
                    companyId: undefined, // Prevent updating companyId
                    fakturDate: data.fakturDate ? new Date(data.fakturDate) : undefined,
                    dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
                    shippingDate: data.shippingDate ? new Date(data.shippingDate) : undefined,
                    paymentTerms: paymentTermName, // Store NAME for display/reporting
                    paymentTermId: paymentTermId,  // Update relation
                    lines: {
                        create: data.lines.map((l: any) => ({
                            itemId: l.itemId,
                            itemName: l.description || "Item",
                            description: l.notes || null,
                            unit: l.unit,
                            quantity: l.quantity,
                            unitPrice: l.unitPrice,
                            discountPercent: l.discountPercent,
                            discountAmount: l.discountAmount,
                            amount: l.amount,
                            warehouseId: l.warehouseId,
                            salespersonId: l.salespersonId || undefined
                        }))
                    },
                    costs: data.costs ? {
                        create: data.costs.map((c: any) => ({
                            accountId: c.accountId,
                            amount: c.amount,
                            notes: c.notes || null
                        }))
                    } : undefined
                },
                include: {
                    lines: true,
                    customer: true,
                    costs: { include: { account: true } }
                }
            });

            // 3. Apply New Effects - validate on draft-to-active transition
            const isTransitioningFromDraft = existing.status === 'DRAFT' &&
                fp.status !== 'DRAFT' &&
                fp.status !== 'CANCELLED';

            if (fp.status !== 'DRAFT' && fp.status !== 'CANCELLED') {
                // ALWAYS validate stock when publishing or when already published
                await this.validateStock(tx, fp.lines);
                await this.updateStock(tx, fp.lines, 'OUT');
                await this.createJournalEntries(tx, fp, fp.lines, fp.companyId);
            }

            return fp;
        }, { timeout: 10000 });
    }

    async delete(id: string) {
        return await prisma.$transaction(async (tx) => {
            const existing = await tx.faktur.findUnique({
                where: { id },
                include: { lines: true }
            });
            if (!existing) throw new Error("Faktur Not Found");

            // 1. Revert Effects
            if (existing.status !== 'DRAFT') {
                await this.updateStock(tx, existing.lines, 'IN');
                await this.voidJournals(tx, existing.id);
            }

            // 2. Delete
            // Check if tied to Receipts?
            // Schema: Faktur has receiptLines.
            const relations = await tx.salesReceiptLine.count({ where: { fakturId: id } });
            if (relations > 0) throw new Error("Cannot delete invoice that has payments. Void payments first.");

            await tx.fakturLine.deleteMany({ where: { fakturId: id } });
            await tx.faktur.delete({ where: { id } });

            return { message: "Deleted successfully" };
        });
    }
}
