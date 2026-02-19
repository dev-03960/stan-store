import { api } from '../../lib/api';

export interface CreateOrderRequest {
    product_id: string;
    customer_name: string;
    customer_email: string;
}

export interface CreateOrderResponse {
    id: string;
    razorpay_order_id: string;
    amount: number;
    currency: string;
    status: string;
}

export const createOrder = async (data: CreateOrderRequest): Promise<CreateOrderResponse> => {
    const response = await api.post<CreateOrderResponse>('/orders', data);
    if (!response.data) {
        throw new Error('Failed to create order: No data received');
    }
    return response.data;
};

export interface Order {
    id: string;
    product_id: string;
    customer_name: string;
    customer_email: string;
    amount: number;
    currency: string;
    status: string;
    razorpay_order_id: string;
    razorpay_payment_id?: string;
    created_at: string;
    product?: {
        title: string;
        price: number;
        product_type: string;
    };
}

export const getOrder = async (orderId: string): Promise<Order> => {
    const response = await api.get<Order>(`/orders/${orderId}`);
    if (!response.data) {
        throw new Error('Failed to fetch order');
    }
    return response.data;
};

export interface DownloadResponse {
    download_url: string;
    expires_at: string;
}

export const getOrderDownloadUrl = async (orderId: string): Promise<string> => {
    const response = await api.get<DownloadResponse>(`/orders/${orderId}/download`);
    if (!response.data) {
        throw new Error('Failed to get download URL');
    }
    return response.data.download_url;
};

export const verifyPayment = async (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}) => {
    return api.post('/payments/verify', data);
};
