
import { Contact, ContactType } from '@prisma/client';
import { BaseService } from '../shared/base.service';
import { ContactRepository } from './contact.repository';

export class ContactService extends BaseService<Contact> {
    protected repository: ContactRepository;

    constructor() {
        const repo = new ContactRepository();
        super(repo);
        this.repository = repo;
    }

    async createContact(companyId: string, data: any): Promise<Contact> {
        // Basic validation / logic could go here
        // e.g., generate automatic code if not provided

        // Ensure companyId is injected
        return this.repository.create({
            ...data,
            company: { connect: { id: companyId } },
        });
    }

    async getCompanyContacts(companyId: string, type?: ContactType): Promise<Contact[]> {
        return this.repository.findAllByCompany(companyId, { type });
    }

    async updateContact(id: string, companyId: string, data: any): Promise<Contact> {
        // Ensure contact belongs to company
        const contact = await this.repository.findById(id);
        if (!contact || contact.companyId !== companyId) {
            throw new Error('Contact not found or access denied');
        }

        return this.repository.update(id, data);
    }
}
