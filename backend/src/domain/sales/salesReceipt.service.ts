
import { PrismaClient, ReceiptStatus, FakturStatus, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export class SalesReceiptService {

    async generateReceiptNumber(companyId: string): Promise<string> {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');

        // Count receipts for this month
        const count = await prisma.salesReceipt.count({
            where: {
                companyId,
                createdAt: {
                    gte: new Date(year, today.getMonth(), 1),
                    lt: new Date(year, today.getMonth() + 1, 1)
                }
            }
        });

        const sequence = String(count + 1).padStart(4, '0');
        return `RC/${year}/${month}/${sequence}`;
    }

    async create(companyId: string, data: any, userId: string) {
        return await prisma.$transaction(async (tx) => {
            // 1. Generate Number
            const receiptNumber = await this.generateReceiptNumber(companyId);

            // 2. Validate Amount
            const totalAllocated = data.lines.reduce((sum: number, line: any) => sum + Number(line.amount), 0);
            if (Math.abs(Number(data.amount) - totalAllocated) > 100) { // Allow small float diff
                throw new Error("Total Payment Amount does not match sum of allocated invoices");
            }

            // 3. Create Receipt
            const receipt = await tx.salesReceipt.create({
                data: {
                    companyId,
                    receiptNumber,
                    receiptDate: new Date(data.receiptDate),
                    customerId: data.customerId,
                    bankAccountId: data.bankAccountId,
                    paymentMethod: data.paymentMethod || 'TRANSFER',
                    amount: data.amount,
                    notes: data.notes,
                    status: 'POSTED', // Auto-post for now
                    createdBy: userId,
                    lines: {
                        create: data.lines.map((line: any) => ({
                            fakturId: line.fakturId,
                            amount: line.amount
                        }))
                    }
                },
                include: {
                    customer: true,
                    bankAccount: true,
                    lines: { include: { faktur: true } }
                }
            });

            // 4. Update Invoices (Faktur)
            for (const line of data.lines) {
                const faktur = await tx.faktur.findUnique({ where: { id: line.fakturId } });
                if (!faktur) throw new Error(`Faktur not found: ${line.fakturId}`);

                const newAmountPaid = Number(faktur.amountPaid) + Number(line.amount);
                const newBalanceDue = Number(faktur.totalAmount) - newAmountPaid;

                let newStatus: FakturStatus = faktur.status;
                if (newBalanceDue <= 0) newStatus = 'PAID';
                else if (newAmountPaid > 0) newStatus = 'PARTIAL';

                await tx.faktur.update({
                    where: { id: line.fakturId },
                    data: {
                        amountPaid: newAmountPaid,
                        balanceDue: newBalanceDue,
                        status: newStatus
                    }
                });
            }

            // 5. Create Journal Entry
            const customer = await tx.customer.findUnique({ where: { id: data.customerId } });
            const arAccountId = customer?.receivableAccountId;

            if (!arAccountId) {
                throw new Error("Customer does not have a linked Receivable Account (Piutang). Please configure it first.");
            }

            await tx.journalEntry.create({
                data: {
                    companyId,
                    transactionDate: receipt.receiptDate,
                    transactionNo: receipt.receiptNumber, // Reuse receipt number as ref
                    reference: receipt.receiptNumber,
                    sourceType: 'SALES_RECEIPT',
                    sourceId: receipt.id,
                    description: `Receipt from ${customer?.name} - ${receipt.notes || ''}`,
                    lines: {
                        create: [
                            {
                                accountId: data.bankAccountId, // DEBIT Bank
                                description: `Payment to ${receipt.bankAccount?.name}`,
                                debit: Number(data.amount),
                                credit: 0
                            },
                            {
                                accountId: arAccountId, // CREDIT Piutang
                                description: `Payment from ${customer?.name}`,
                                debit: 0,
                                credit: Number(data.amount)
                            }
                        ]
                    }
                }
            });

            return receipt;
        });
    }

    async update(id: string, data: any, userId: string) {
        return await prisma.$transaction(async (tx) => {
            const receipt = await tx.salesReceipt.findUnique({
                where: { id },
                include: { lines: true }
            });

            if (!receipt) throw new Error("Receipt not found");

            // 1. REVERT: Reverse Invoices impact
            for (const line of receipt.lines) {
                if (!line.fakturId) continue;
                const faktur = await tx.faktur.findUnique({ where: { id: line.fakturId } });
                if (faktur) {
                    const newAmountPaid = Number(faktur.amountPaid) - Number(line.amount);
                    const newBalanceDue = Number(faktur.totalAmount) - newAmountPaid;
                    let newStatus: FakturStatus = 'PARTIAL';
                    if (newAmountPaid <= 0) newStatus = 'UNPAID';

                    await tx.faktur.update({
                        where: { id: line.fakturId },
                        data: {
                            amountPaid: newAmountPaid,
                            balanceDue: newBalanceDue,
                            status: newStatus
                        }
                    });
                }
            }

            // 2. REVERT: Delete Journal Entry
            // Find Journal Entry by sourceId
            const je = await tx.journalEntry.findFirst({
                where: {
                    sourceId: id,
                    sourceType: 'SALES_RECEIPT'
                }
            });
            if (je) {
                // Delete lines first (cascade usually handles this but safety first)
                await tx.journalLine.deleteMany({ where: { journalId: je.id } });
                await tx.journalEntry.delete({ where: { id: je.id } });
            }

            // 3. APPLY NEW HEADER
            const updatedReceipt = await tx.salesReceipt.update({
                where: { id },
                data: {
                    receiptDate: new Date(data.receiptDate),
                    customerId: data.customerId,
                    bankAccountId: data.bankAccountId,
                    amount: data.amount,
                    notes: data.notes,
                    // status: 'POSTED', // Assume keeping it POSTED or whatever passed
                }
            });

            // 4. RESET LINES
            await tx.salesReceiptLine.deleteMany({ where: { salesReceiptId: id } });

            // 5. CREATE NEW LINES
            await tx.salesReceiptLine.createMany({
                data: data.lines.map((line: any) => ({
                    salesReceiptId: id,
                    fakturId: line.fakturId,
                    amount: line.amount
                }))
            });

            // 6. APPLY NEW: Update Invoices (Faktur)
            for (const line of data.lines) {
                const faktur = await tx.faktur.findUnique({ where: { id: line.fakturId } });
                if (!faktur) throw new Error(`Faktur not found: ${line.fakturId}`);

                const newAmountPaid = Number(faktur.amountPaid) + Number(line.amount);
                const newBalanceDue = Number(faktur.totalAmount) - newAmountPaid;

                let newStatus: FakturStatus = faktur.status;
                if (newBalanceDue <= 0) newStatus = 'PAID';
                else if (newAmountPaid > 0) newStatus = 'PARTIAL';

                await tx.faktur.update({
                    where: { id: line.fakturId },
                    data: {
                        amountPaid: newAmountPaid,
                        balanceDue: newBalanceDue,
                        status: newStatus
                    }
                });
            }

            // 7. APPLY NEW: Create Journal Entry
            const customer = await tx.customer.findUnique({ where: { id: data.customerId } });
            const arAccountId = customer?.receivableAccountId;
            const bankAccount = await tx.account.findUnique({ where: { id: data.bankAccountId } }); // Need bank name

            if (!arAccountId) {
                throw new Error("Customer does not have a linked Receivable Account (Piutang). Please configure it first.");
            }

            await tx.journalEntry.create({
                data: {
                    companyId: receipt.companyId,
                    transactionDate: updatedReceipt.receiptDate,
                    transactionNo: updatedReceipt.receiptNumber,
                    reference: updatedReceipt.receiptNumber,
                    sourceType: 'SALES_RECEIPT',
                    sourceId: updatedReceipt.id,
                    description: `Receipt from ${customer?.name} - ${updatedReceipt.notes || ''}`,
                    lines: {
                        create: [
                            {
                                accountId: data.bankAccountId, // DEBIT Bank
                                description: `Payment to ${bankAccount?.name || 'Bank'}`,
                                debit: Number(data.amount),
                                credit: 0
                            },
                            {
                                accountId: arAccountId, // CREDIT Piutang
                                description: `Payment from ${customer?.name}`,
                                debit: 0,
                                credit: Number(data.amount)
                            }
                        ]
                    }
                }
            });

            return updatedReceipt;
        });
    }



    async delete(id: string, userId: string) {
        return await prisma.$transaction(async (tx) => {
            const receipt = await tx.salesReceipt.findUnique({
                where: { id },
                include: { lines: true, customer: true, bankAccount: true }
            });

            if (!receipt) throw new Error("Receipt not found");

            // 1. Reverse Invoices
            for (const line of receipt.lines) {
                if (!line.fakturId) continue;

                const faktur = await tx.faktur.findUnique({ where: { id: line.fakturId } });
                if (faktur) {
                    const newAmountPaid = Number(faktur.amountPaid) - Number(line.amount);
                    const newBalanceDue = Number(faktur.totalAmount) - newAmountPaid;

                    let newStatus: FakturStatus = 'PARTIAL';
                    if (newAmountPaid <= 0) newStatus = 'UNPAID';
                    // Note: If previously PAID, now it becomes PARTIAL or UNPAID.

                    await tx.faktur.update({
                        where: { id: line.fakturId },
                        data: {
                            amountPaid: newAmountPaid,
                            balanceDue: newBalanceDue,
                            status: newStatus
                        }
                    });
                }
            }

            // 2. Hard Delete Journal Entry
            const je = await tx.journalEntry.findFirst({
                where: {
                    sourceId: id,
                    sourceType: 'SALES_RECEIPT'
                }
            });
            if (je) {
                await tx.journalLine.deleteMany({ where: { journalId: je.id } });
                await tx.journalEntry.delete({ where: { id: je.id } });
            }

            // 3. Hard Delete Receipt
            // Delete lines first if not cascaded
            await tx.salesReceiptLine.deleteMany({ where: { salesReceiptId: id } });
            return await tx.salesReceipt.delete({
                where: { id }
            });
        });
    }

    async findAll(companyId: string, params: any) {
        const where: any = { companyId };

        if (params.fakturId) {
            where.lines = {
                some: {
                    fakturId: params.fakturId
                }
            };
        }

        return prisma.salesReceipt.findMany({
            where,
            include: {
                customer: true,
                lines: {
                    include: { faktur: true }
                }
            },
            orderBy: { receiptDate: 'desc' }
        });
    }
}
