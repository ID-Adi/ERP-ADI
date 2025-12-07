
import { Contact, Prisma } from '@prisma/client';
import { BaseRepository } from '../shared/base.repository';
import prisma from '../../infrastructure/database';

export class ContactRepository extends BaseRepository<Contact, Prisma.ContactCreateInput, Prisma.ContactUpdateInput> {
    constructor() {
        super('contact');
    }

    // Override or add specific methods if needed
    async findByCode(companyId: string, code: string): Promise<Contact | null> {
        return prisma.contact.findUnique({
            where: {
                companyId_code: {
                    companyId,
                    code,
                },
            },
        });
    }

    async findAllByCompany(companyId: string, params?: { skip?: number; take?: number; type?: any }): Promise<Contact[]> {
        return prisma.contact.findMany({
            where: {
                companyId,
                ...(params?.type ? { type: params.type } : {}),
            },
            skip: params?.skip,
            take: params?.take,
            orderBy: { createdAt: 'desc' },
        });
    }
}
