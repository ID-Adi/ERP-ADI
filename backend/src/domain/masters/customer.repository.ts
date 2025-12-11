import { Customer, Prisma } from '@prisma/client';
import { BaseRepository } from '../shared/base.repository';
import prisma from '../../infrastructure/database';

export class CustomerRepository extends BaseRepository<Customer, Prisma.CustomerCreateInput, Prisma.CustomerUpdateInput> {
    constructor() {
        super('customer');
    }

    async findByCode(companyId: string, code: string): Promise<Customer | null> {
        return prisma.customer.findUnique({
            where: {
                companyId_code: {
                    companyId,
                    code,
                },
            },
        });
    }

    async findAllByCompany(companyId: string, params?: { skip?: number; take?: number; search?: string; status?: string }): Promise<any[]> {
        const where: Prisma.CustomerWhereInput = {
            companyId,
            ...(params?.status ? { isActive: params.status === 'active' } : {}),
            ...(params?.search
                ? {
                    OR: [
                        { name: { contains: params.search, mode: 'insensitive' } },
                        { code: { contains: params.search, mode: 'insensitive' } },
                        { email: { contains: params.search, mode: 'insensitive' } },
                        { phone: { contains: params.search, mode: 'insensitive' } },
                    ],
                }
                : {}),
        };

        const customers = await prisma.customer.findMany({
            where,
            skip: params?.skip,
            take: params?.take,
            orderBy: { createdAt: 'desc' },
            include: {
                fakturs: {
                    where: {
                        status: {
                            in: ['UNPAID', 'PARTIAL', 'OVERDUE']
                        }
                    },
                    select: {
                        balanceDue: true
                    }
                },
                paymentTerm: true
            }
        });

        // Calculate and attach receivableBalance
        return customers.map(customer => {
            const balance = customer.fakturs.reduce((sum, faktur) => sum + Number(faktur.balanceDue), 0);
            const { fakturs, ...rest } = customer; // Remove fakturs from result to keep it clean
            return {
                ...rest,
                receivableBalance: balance
            };
        });
    }

    // Paginated query with total count
    async findAllByCompanyPaginated(companyId: string, params?: { page?: number; limit?: number; search?: string; status?: string }): Promise<{ data: any[]; total: number }> {
        const page = params?.page || 1;
        const limit = params?.limit || 50;
        const skip = (page - 1) * limit;

        const where: Prisma.CustomerWhereInput = {
            companyId,
            ...(params?.status ? { isActive: params.status === 'active' } : {}),
            ...(params?.search
                ? {
                    OR: [
                        { name: { contains: params.search, mode: 'insensitive' } },
                        { code: { contains: params.search, mode: 'insensitive' } },
                        { email: { contains: params.search, mode: 'insensitive' } },
                        { phone: { contains: params.search, mode: 'insensitive' } },
                    ],
                }
                : {}),
        };

        const [total, customers] = await Promise.all([
            prisma.customer.count({ where }),
            prisma.customer.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    fakturs: {
                        where: {
                            status: {
                                in: ['UNPAID', 'PARTIAL', 'OVERDUE']
                            }
                        },
                        select: {
                            balanceDue: true
                        }
                    },
                    paymentTerm: true
                }
            })
        ]);

        // Calculate and attach receivableBalance
        const data = customers.map(customer => {
            const balance = customer.fakturs.reduce((sum, faktur) => sum + Number(faktur.balanceDue), 0);
            const { fakturs, ...rest } = customer;
            return {
                ...rest,
                receivableBalance: balance
            };
        });

        return { data, total };
    }

    // Lightweight dropdown query (no relations, minimal fields)
    async findAllForDropdown(companyId: string): Promise<{ id: string; code: string; name: string }[]> {
        return prisma.customer.findMany({
            where: { companyId, isActive: true },
            select: {
                id: true,
                code: true,
                name: true
            },
            orderBy: { name: 'asc' }
        });
    }
}
