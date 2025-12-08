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
                }
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
}
