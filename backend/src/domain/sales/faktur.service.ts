
import { PrismaClient, FakturStatus, Prisma } from '@prisma/client';
import { JournalService } from '../accounting/journal.service';

const prisma = new PrismaClient();

export class FakturService {

    async generateFakturNumber(companyId: string, tx?: Prisma.TransactionClient): Promise<string> {
        const db = tx || prisma;

        // Format: PKY-YYYYMMDD-{timestamp_seconds}-{random_3digit}
        // Example: PKY-20241211-1702345678-847
        const timestamp = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0'); // 000-999

        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

        const candidate = `PKY-${dateStr}-${timestamp}-${random}`;

        // Single collision check (probability ~0.1% with 1000 combinations/second)
        const exists = await db.faktur.count({
            where: { companyId, fakturNumber: candidate }
        });

        // Retry once with new random if collision (very rare)
        if (exists > 0) {
            const newRandom = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            return `PKY-${dateStr}-${timestamp}-${newRandom}`;
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

    // Helper: Validate Stock for UPDATE - only check delta (new qty - existing qty)
    private async validateStockForUpdate(tx: Prisma.TransactionClient, newLines: any[], existingLines: any[]) {
        // Build map of existing qty per item+warehouse
        const existingQtyMap = new Map<string, number>();
        for (const line of existingLines) {
            if (!line.itemId) continue;
            const key = `${line.itemId}-${line.warehouseId || 'default'}`;
            existingQtyMap.set(key, (existingQtyMap.get(key) || 0) + Number(line.quantity));
        }

        // Filter lines that need validation
        const validLines = newLines.filter(line => line.itemId && line.quantity);
        if (validLines.length === 0) return;

        // Batch fetch all items
        const itemIds = [...new Set(validLines.map(l => l.itemId))];
        const items = await tx.item.findMany({ where: { id: { in: itemIds } } });
        const itemMap = new Map(items.map(i => [i.id, i]));

        const stockItems = items.filter(i => i.isStockItem);
        if (stockItems.length === 0) return;

        // Get default warehouse
        const companyId = stockItems[0].companyId;
        const defWh = await tx.warehouse.findFirst({ where: { companyId } });
        const defaultWarehouseId = defWh?.id || null;

        // Collect warehouse IDs
        const warehouseIds = new Set<string>();
        for (const line of validLines) {
            const item = itemMap.get(line.itemId);
            if (!item || !item.isStockItem) continue;
            const warehouseId = line.warehouseId || defaultWarehouseId;
            if (warehouseId) warehouseIds.add(warehouseId);
        }

        // Batch fetch stocks
        const stocks = await tx.itemStock.findMany({
            where: {
                itemId: { in: itemIds },
                warehouseId: { in: Array.from(warehouseIds) }
            }
        });
        const stockMap = new Map(stocks.map(s => [`${s.itemId}-${s.warehouseId}`, s]));

        // Validate only the DELTA (increase) for each line
        for (const line of validLines) {
            const item = itemMap.get(line.itemId);
            if (!item || !item.isStockItem) continue;

            const warehouseId = line.warehouseId || defaultWarehouseId;
            if (!warehouseId) throw new Error(`Gudang tidak ditentukan untuk item: ${item.name}`);

            const key = `${line.itemId}-${warehouseId}`;
            const existingQty = existingQtyMap.get(key) || 0;
            const newQty = Number(line.quantity);
            const delta = newQty - existingQty; // Only check if qty increases

            if (delta > 0) {
                const stock = stockMap.get(key);
                const available = stock ? Number(stock.availableStock) : 0;

                if (available < delta) {
                    throw new Error(`Stok tidak mencukupi untuk item: ${item.name}. Tersedia: ${available}, Penambahan diminta: ${delta}`);
                }
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

    // Helper: Create Journal Entries - Delegated to JournalService
    private async createJournalEntries(tx: Prisma.TransactionClient, faktur: any, lines: any[], companyId: string) {
        const journalService = new JournalService();

        // 1. Create Sales Journal
        await journalService.createSalesJournal(tx, faktur, lines);

        // 2. Create COGS Journal
        await journalService.createCOGSJournal(tx, faktur, lines);
    }

    // Helper: Reverse (Void) Journals
    private async voidJournals(tx: Prisma.TransactionClient, fakturId: string) {
        const journalService = new JournalService();
        await journalService.voidJournal(tx, fakturId);
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

            // Calculate totalCost from costs array
            const totalCost = data.costs
                ? data.costs.reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0)
                : 0;

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
                    address: data.address || null, // NEW: Alamat
                    totalCost: totalCost,          // NEW: Total biaya lainnya
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
                            salespersonId: l.salespersonId || undefined,
                            subtotalBeforeDiscount: Number(l.quantity) * Number(l.unitPrice), // NEW
                            customerId: data.customerId || null  // NEW
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

            // Calculate NEW status based on existing amountPaid and new totalAmount
            const newTotalAmount = Number(data.totalAmount || 0);
            const currentAmountPaid = Number(existing.amountPaid || 0);
            const newBalanceDue = newTotalAmount - currentAmountPaid;

            let computedStatus: FakturStatus;
            if (currentAmountPaid <= 0) {
                computedStatus = 'UNPAID';
            } else if (currentAmountPaid >= newTotalAmount) {
                computedStatus = 'PAID'; // Termasuk kelebihan bayar
            } else {
                computedStatus = 'PARTIAL';
            }

            // Calculate totalCost from costs array
            const totalCost = data.costs
                ? data.costs.reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0)
                : 0;

            const fp = await tx.faktur.update({
                where: { id },
                data: {
                    ...data,
                    companyId: undefined, // Prevent updating companyId
                    status: computedStatus, // USE COMPUTED STATUS, not from frontend
                    amountPaid: undefined, // Preserve existing amountPaid
                    balanceDue: newBalanceDue, // Recalculate based on new total
                    fakturDate: data.fakturDate ? new Date(data.fakturDate) : undefined,
                    dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
                    shippingDate: data.shippingDate ? new Date(data.shippingDate) : undefined,
                    paymentTerms: paymentTermName, // Store NAME for display/reporting
                    paymentTermId: paymentTermId,  // Update relation
                    address: data.address || null, // NEW: Alamat
                    totalCost: totalCost,          // NEW: Total biaya lainnya
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
                            salespersonId: l.salespersonId || undefined,
                            subtotalBeforeDiscount: Number(l.quantity) * Number(l.unitPrice), // NEW
                            customerId: data.customerId || existing.customerId || null  // NEW
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
                // Use delta validation for edit mode
                await this.validateStockForUpdate(tx, fp.lines, existing.lines);
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
