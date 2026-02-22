import { api } from '../../lib/api';

export interface LineItem {
    product_id: string;
    title: string;
    amount: number;
    product_type: string;
}

export interface Order {
    id: string;
    customer_name: string;
    customer_email: string;
    amount: number;
    status: string;
    created_at: string;
    line_items?: LineItem[];
}

export interface Subscription {
    id: string; // MongoDB ID
    product_id: string;
    product_title?: string;
    product_price?: number;
    customer_email: string;
    razorpay_sub_id: string;
    status: string; // active, completed, cancelled, halted
    total_count: number;
    paid_count: number;
    start_at: string;
    end_at: string;
    created_at: string;
}

// Buyer Authentication API
export const buyerAuthApi = {
    // Request a magic link
    requestMagicLink: (email: string) =>
        api.post<{ message: string }>('/auth/buyer/magic-link', { email }),
};

// Buyer Dashboard API
export const buyerApi = {
    // Get all purchases for the logged in buyer
    getPurchases: () => api.get<Order[]>('/buyer/purchases'),

    // Get all subscriptions for the logged in buyer
    getSubscriptions: () => api.get<Subscription[]>('/buyer/subscriptions'),

    // Cancel a specific subscription
    cancelSubscription: (subId: string) => api.post(`/buyer/subscriptions/${subId}/cancel`),
};
