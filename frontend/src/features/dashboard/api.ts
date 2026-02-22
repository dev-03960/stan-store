import { api } from '../../lib/api';



// Sales / Order History Interface
export interface Order {
    id: string;
    product_id: string;
    customer_name: string;
    customer_email: string;
    amount: number;
    status: string;
    created_at: string;
}

export const getSalesHistory = async (): Promise<Order[]> => {
    const response = await api.get<Order[]>('/sales');
    if (!response.data) {
        throw new Error('Failed to fetch sales history');
    }
    return response.data;
};
