import { Customer } from '@prisma/client';
import { BaseService } from '../shared/base.service';
import { CustomerRepository } from './customer.repository';

export class CustomerService extends BaseService<Customer> {
    protected repository: CustomerRepository;

    constructor() {
        const repo = new CustomerRepository();
        super(repo);
        this.repository = repo;
    }

    async createCustomer(companyId: string, data: any): Promise<Customer> {
        // Auto-generate code if missing
        if (!data.code) {
            const timestamp = Date.now().toString().slice(-6);
            data.code = `CUST-${timestamp}`;
        }

        // Extract account IDs and convert to Prisma connect syntax
        const {
            receivableAccountId,
            downPaymentAccountId,
            salesAccountId,
            cogsAccountId,
            salesReturnAccountId,
            goodsDiscountAccountId,
            salesDiscountAccountId,
            paymentTermId, // Extract paymentTermId
            ...restData
        } = data;

        // Build the create data object with proper relation connects
        const createData: any = {
            ...restData,
            company: { connect: { id: companyId } },
        };

        // Only add relation connects if the ID is provided and not null/empty
        if (receivableAccountId) {
            createData.receivableAccount = { connect: { id: receivableAccountId } };
        }
        if (downPaymentAccountId) {
            createData.downPaymentAccount = { connect: { id: downPaymentAccountId } };
        }
        if (salesAccountId) {
            createData.salesAccount = { connect: { id: salesAccountId } };
        }
        if (cogsAccountId) {
            createData.cogsAccount = { connect: { id: cogsAccountId } };
        }
        if (salesReturnAccountId) {
            createData.salesReturnAccount = { connect: { id: salesReturnAccountId } };
        }
        if (goodsDiscountAccountId) {
            createData.goodsDiscountAccount = { connect: { id: goodsDiscountAccountId } };
        }
        if (salesDiscountAccountId) {
            createData.salesDiscountAccount = { connect: { id: salesDiscountAccountId } };
        }
        if (paymentTermId) {
            createData.paymentTerm = { connect: { id: paymentTermId } };
        }

        return this.repository.create(createData);
    }

    async getCompanyCustomers(companyId: string, params?: { limit?: number; search?: string; status?: string }): Promise<any[]> {
        return this.repository.findAllByCompany(companyId, {
            take: params?.limit ? Number(params.limit) : undefined,
            search: params?.search,
            status: params?.status
        });
    }

    async updateCustomer(id: string, companyId: string, data: any): Promise<Customer> {
        const customer = await this.repository.findById(id);
        if (!customer || customer.companyId !== companyId) {
            throw new Error('Customer not found or access denied');
        }

        // Extract account IDs and convert to Prisma connect/disconnect syntax
        const {
            receivableAccountId,
            downPaymentAccountId,
            salesAccountId,
            cogsAccountId,
            salesReturnAccountId,
            goodsDiscountAccountId,
            salesDiscountAccountId,
            paymentTermId,
            ...restData
        } = data;

        // Build the update data object
        const updateData: any = { ...restData };

        // Helper to handle connect/disconnect for optional relations
        const handleRelation = (fieldValue: string | null | undefined, relationName: string) => {
            if (fieldValue === null || fieldValue === '') {
                // Disconnect the relation
                updateData[relationName] = { disconnect: true };
            } else if (fieldValue) {
                // Connect to new relation
                updateData[relationName] = { connect: { id: fieldValue } };
            }
            // If undefined, don't touch the relation
        };

        handleRelation(receivableAccountId, 'receivableAccount');
        handleRelation(downPaymentAccountId, 'downPaymentAccount');
        handleRelation(salesAccountId, 'salesAccount');
        handleRelation(cogsAccountId, 'cogsAccount');
        handleRelation(salesReturnAccountId, 'salesReturnAccount');
        handleRelation(goodsDiscountAccountId, 'goodsDiscountAccount');
        handleRelation(salesDiscountAccountId, 'salesDiscountAccount');
        handleRelation(paymentTermId, 'paymentTerm');

        return this.repository.update(id, updateData);
    }
}
