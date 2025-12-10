import api from './index';

export interface PaymentTerm {
    id: string;
    companyId: string;
    code: string;
    name: string;
    days: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export const paymentTermApi = {
    getAll: async () => {
        const response = await api.get<PaymentTerm[]>('/payment-terms');
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get<PaymentTerm>(`/payment-terms/${id}`);
        return response.data;
    },

    create: async (data: { code: string; name: string; days: number }) => {
        const response = await api.post<PaymentTerm>('/payment-terms', data);
        return response.data;
    },

    update: async (id: string, data: { code?: string; name?: string; days?: number; isActive?: boolean }) => {
        const response = await api.put<PaymentTerm>(`/payment-terms/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        await api.delete(`/payment-terms/${id}`);
    }
};
