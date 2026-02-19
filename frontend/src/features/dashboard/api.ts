import { api } from '../../lib/api';

// Wallet Interface
export interface Transaction {
    id: string;
    amount: number;
    type: 'credit' | 'debit';
    source: 'order' | 'payout';
    reference_id: string;
    description: string;
    created_at: string;
}

export interface WalletDetails {
    balance: number;
    transactions: Transaction[];
}

export const getWalletDetails = async (): Promise<WalletDetails> => {
    const response = await api.get<WalletDetails>('/wallet');
    if (!response.data) {
        throw new Error('Failed to fetch wallet details');
    }
    return response.data;
};

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
