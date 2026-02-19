import { api } from '../api';
import type { Product } from './store'; // Reuse Product type or define new one if needed

export interface CreateProductDTO {
    title: string;
    subtitle?: string;
    price: number;
    description?: string;
    product_type: string;
    image_url?: string;
    file_url?: string;
}

export interface UpdateProductDTO extends Partial<CreateProductDTO> { }

export interface ReorderItem {
    id: string;
    sort_order: number;
}

export async function getMyProducts() {
    const response = await api.get<Product[]>('/products');
    if (!response.data) throw new Error('Failed to fetch products');
    return response.data;
}

export async function createProduct(data: CreateProductDTO) {
    const response = await api.post<Product>('/products', data);
    if (!response.data) throw new Error('Failed to create product');
    return response.data;
}

export async function updateProduct(id: string, data: UpdateProductDTO) {
    const response = await api.put<Product>(`/products/${id}`, data);
    if (!response.data) throw new Error('Failed to update product');
    return response.data;
}

export async function deleteProduct(id: string) {
    await api.delete(`/products/${id}`);
}

export async function updateVisibility(id: string, isVisible: boolean) {
    const response = await api.patch<{ success: boolean }>(`/products/${id}/visibility`, { is_visible: isVisible });
    return response.data;
}

export async function reorderProducts(items: ReorderItem[]) {
    await api.patch('/products/reorder', { items });
}

export async function getPresignedUrl(filename: string, fileType: string, purpose: 'product_file' | 'cover_image' = 'product_file') {
    const response = await api.post<{ url: string; key: string }>('/uploads/presigned', {
        filename,
        file_type: fileType,
        purpose
    });
    if (!response.data) throw new Error('Failed to get upload URL');
    return response.data;
}

export async function uploadFileToUrl(url: string, file: File) {
    const response = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
            'Content-Type': file.type
        }
    });

    if (!response.ok) {
        throw new Error('Failed to upload file');
    }
}
