import { api } from '../api';
import type { Course } from './products';

export interface Order {
    id: string;
    product_id: string; // Legacy
    line_items?: {
        product_id: string;
        title: string;
        amount: number;
        product_type: string;
    }[];
    status: string;
    amount: number;
    created_at: string;
    // ... other fields
}

export async function getMyPurchases() {
    const response = await api.get<Order[]>('/buyer/orders');
    if (!response.data) throw new Error('Failed to fetch purchases');
    return response.data;
}

export async function getPurchasedCourse(productId: string) {
    const response = await api.get<Course>(`/buyer/courses/${productId}`);
    if (!response.data) throw new Error('Failed to fetch course');
    return response.data;
}
