
import { PrismaClient } from '@prisma/client';
import prisma from '../../infrastructure/database';

export abstract class BaseRepository<T, CreateInput, UpdateInput> {
    protected model: any;

    constructor(modelName: keyof PrismaClient) {
        this.model = prisma[modelName];
    }

    async findById(id: string): Promise<T | null> {
        return this.model.findUnique({
            where: { id },
        });
    }

    async findAll(params?: { skip?: number; take?: number; where?: any }): Promise<T[]> {
        return this.model.findMany({
            skip: params?.skip,
            take: params?.take,
            where: params?.where,
        });
    }

    async create(data: CreateInput): Promise<T> {
        return this.model.create({
            data,
        });
    }

    async update(id: string, data: UpdateInput): Promise<T> {
        return this.model.update({
            where: { id },
            data,
        });
    }

    async delete(id: string): Promise<T> {
        return this.model.delete({
            where: { id },
        });
    }
}
