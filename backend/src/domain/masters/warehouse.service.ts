import { Warehouse, Prisma } from '@prisma/client';
import { BaseService } from '../shared/base.service';
import { WarehouseRepository } from './warehouse.repository';

export class WarehouseService extends BaseService<Warehouse> {
    protected repository: WarehouseRepository;

    constructor() {
        const repo = new WarehouseRepository();
        super(repo);
        this.repository = repo;
    }

    async createWarehouse(companyId: string, data: any): Promise<Warehouse> {
        const { name, code, address, city, isActive } = data;

        if (!name) throw new Error('Nama Gudang wajib diisi');
        if (!code) throw new Error('Kode Gudang wajib diisi');

        // Check for duplicates
        const existing = await this.repository.findByCode(companyId, code);
        if (existing) {
            throw new Error('Gudang dengan kode tersebut sudah ada');
        }

        return this.repository.create({
            name,
            code,
            address,
            city,
            isActive: isActive ?? true,
            company: { connect: { id: companyId } }
        });
    }

    async updateWarehouse(id: string, companyId: string, data: any): Promise<Warehouse> {
        const warehouse = await this.repository.findById(id);
        if (!warehouse || warehouse.companyId !== companyId) {
            throw new Error('Warehouse not found or access denied');
        }

        // Check for code uniqueness if code is changing
        if (data.code && data.code !== warehouse.code) {
             const existing = await this.repository.findByCode(companyId, data.code);
             if (existing) {
                 throw new Error('Gudang dengan kode tersebut sudah ada');
             }
        }

        return this.repository.update(id, data);
    }

    async deleteWarehouse(id: string): Promise<Warehouse> {
        // Dependency Check
        const deps = await this.repository.countDependencies(id);

        if (deps.stocks > 0 || deps.transactions > 0 || deps.fakturLines > 0) {
            throw new Error('Gudang tidak dapat dihapus karena masih memiliki stok atau riwayat transaksi.');
        }

        return this.repository.delete(id);
    }

    async getCompanyWarehouses(companyId: string, params?: { page?: number; limit?: number; search?: string; itemId?: string }): Promise<{ data: any[]; meta: any }> {
        const page = params?.page || 1;
        const limit = params?.limit || 20;
        const skip = (page - 1) * limit;

        const data = await this.repository.findAllByCompany(companyId, {
            skip,
            take: limit,
            search: params?.search,
            itemId: params?.itemId
        });

        const total = await this.repository.countByCompany(companyId, { search: params?.search });

        return {
            data,
            meta: {
                total,
                page,
                limit,
                last_page: Math.ceil(total / limit)
            }
        };
    }
}
