import { Warehouse, Prisma } from '@prisma/client';
import { BaseRepository } from '../shared/base.repository';
import prisma from '../../infrastructure/database';

export class WarehouseRepository extends BaseRepository<Warehouse, Prisma.WarehouseCreateInput, Prisma.WarehouseUpdateInput> {
    constructor() {
        super('warehouse');
    }

    async findByCode(companyId: string, code: string): Promise<Warehouse | null> {
        return prisma.warehouse.findFirst({
            where: {
                companyId,
                code: { equals: code, mode: 'insensitive' }
            }
        });
    }

    async findAllByCompany(companyId: string, params?: { skip?: number; take?: number; search?: string; status?: string; itemId?: string }): Promise<any[]> {
        const where: Prisma.WarehouseWhereInput = {
            companyId,
            ...(params?.status ? { isActive: params.status === 'active' } : {}),
            ...(params?.search
                ? {
                    OR: [
                        { name: { contains: params.search, mode: 'insensitive' } },
                        { code: { contains: params.search, mode: 'insensitive' } },
                        { city: { contains: params.search, mode: 'insensitive' } }
                    ]
                }
                : {})
        };

        const include = params?.itemId ? {
            stocks: {
                where: { itemId: params.itemId },
                select: { availableStock: true }
            }
        } : undefined;

        const warehouses = await prisma.warehouse.findMany({
            where,
            include,
            skip: params?.skip,
            take: params?.take,
            orderBy: { name: 'asc' }
        });

         // Map response to include stock directly if itemId was requested
         return warehouses.map(wh => {
            const stock = (wh as any).stocks?.[0]?.availableStock ?? 0;
            const { stocks, ...rest } = wh as any;
            return params?.itemId ? { ...rest, stock } : rest;
        });
    }

    async countByCompany(companyId: string, params?: { search?: string; status?: string }): Promise<number> {
        const where: Prisma.WarehouseWhereInput = {
            companyId,
            ...(params?.status ? { isActive: params.status === 'active' } : {}),
            ...(params?.search
                ? {
                    OR: [
                        { name: { contains: params.search, mode: 'insensitive' } },
                        { code: { contains: params.search, mode: 'insensitive' } },
                        { city: { contains: params.search, mode: 'insensitive' } }
                    ]
                }
                : {})
        };

        return prisma.warehouse.count({ where });
    }

    async countDependencies(id: string): Promise<{ stocks: number; transactions: number; fakturLines: number }> {
        const stocks = await prisma.itemStock.count({ where: { warehouseId: id } });
        const transactions = await prisma.inventoryTransaction.count({ where: { warehouseId: id } });
        const fakturLines = await prisma.fakturLine.count({ where: { warehouseId: id } });

        return { stocks, transactions, fakturLines };
    }
}
