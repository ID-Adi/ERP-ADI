
import { PrismaClient, ReturnStatus } from '@prisma/client';

const prisma = new PrismaClient();

export class SalesReturnService {

    async generateReturnNumber(companyId: string): Promise<string> {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');

        const count = await prisma.salesReturn.count({
            where: {
                companyId,
                createdAt: {
                    gte: new Date(year, today.getMonth(), 1),
                    lt: new Date(year, today.getMonth() + 1, 1)
                }
            }
        });

        const sequence = String(count + 1).padStart(4, '0');
        return `RET/${year}/${month}/${sequence}`;
    }

    async create(companyId: string, data: any, userId: string) {
        return await prisma.$transaction(async (tx) => {
            // 1. Generate Number
            const returnNumber = await this.generateReturnNumber(companyId);

            // 2. Calculate total amount from lines
            const totalAmount = data.lines.reduce((sum: number, line: any) =>
                sum + (Number(line.quantity) * Number(line.unitPrice)), 0);

            // 3. Create Sales Return
            const salesReturn = await tx.salesReturn.create({
                data: {
                    companyId,
                    returnNumber,
                    returnDate: new Date(data.returnDate),
                    fakturId: data.fakturId,
                    customerId: data.customerId,
                    status: 'DRAFT',
                    totalAmount,
                    notes: data.notes,
                    createdBy: userId,
                    lines: {
                        create: data.lines.map((line: any) => ({
                            itemId: line.itemId,
                            description: line.description,
                            quantity: line.quantity,
                            unitPrice: line.unitPrice,
                            amount: Number(line.quantity) * Number(line.unitPrice),
                            warehouseId: line.warehouseId
                        }))
                    }
                },
                include: {
                    customer: true,
                    faktur: true,
                    lines: {
                        include: {
                            item: true,
                            warehouse: true
                        }
                    }
                }
            });

            return salesReturn;
        });
    }

    async getByFakturId(fakturId: string) {
        return prisma.salesReturn.findMany({
            where: { fakturId },
            include: {
                customer: true,
                faktur: true,
                lines: {
                    include: {
                        item: true,
                        warehouse: true
                    }
                }
            },
            orderBy: { returnDate: 'desc' }
        });
    }
}
