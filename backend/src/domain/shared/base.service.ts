
export abstract class BaseService<T> {
    protected repository: any;

    constructor(repository: any) {
        this.repository = repository;
    }

    async getById(id: string): Promise<T | null> {
        return this.repository.findById(id);
    }

    async getAll(params?: any): Promise<T[]> {
        return this.repository.findAll(params);
    }

    async delete(id: string): Promise<T> {
        return this.repository.delete(id);
    }
}
