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
    duration_minutes?: number;
    timezone?: string;
    cancellation_window_hours?: number;
    availability?: import('./store').AvailabilityWindow[];
    subscription_interval?: 'monthly' | 'yearly';
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

export async function updateBumpConfig(id: string, bump: import('./store').BumpConfig | null) {
    const response = await api.put<{ success: boolean }>(`/products/${id}/bump`, bump || { bump_product_id: "000000000000000000000000", bump_discount: 0 });
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

// --- Course Builder Specific Types & APIs ---

export interface Lesson {
    id: string; // lesson_id from backend
    title: string;
    type: 'video' | 'text' | 'attachment';
    content: string; // URL, text, or file key
    sort_order: number;
    duration_minutes?: number;
}

export interface Module {
    id: string; // module_id from backend
    title: string;
    sort_order: number;
    lessons: Lesson[];
}

export interface Course {
    id: string; // mongodb ObjectID as string
    product_id: string;
    creator_id: string;
    modules: Module[];
    created_at: string;
    updated_at: string;
}

export async function getCourse(productId: string) {
    const response = await api.get<Course>(`/products/${productId}/course`);
    if (!response.data) throw new Error('Failed to fetch course');
    return response.data;
}

export async function createModule(productId: string, title: string, sort_order: number) {
    const response = await api.post<Course>(`/products/${productId}/course/modules`, { title, sort_order });
    if (!response.data) throw new Error('Failed to create module');
    return response.data;
}

export async function updateModule(productId: string, moduleId: string, title: string, sort_order: number) {
    const response = await api.put<Course>(`/products/${productId}/course/modules/${moduleId}`, { title, sort_order });
    if (!response.data) throw new Error('Failed to update module');
    return response.data;
}

export async function deleteModule(productId: string, moduleId: string) {
    const response = await api.delete<Course>(`/products/${productId}/course/modules/${moduleId}`);
    if (!response.data) throw new Error('Failed to delete module');
    return response.data;
}

export async function createLesson(productId: string, moduleId: string, lesson: Omit<Lesson, 'id'>) {
    const response = await api.post<Course>(`/products/${productId}/course/modules/${moduleId}/lessons`, lesson);
    if (!response.data) throw new Error('Failed to create lesson');
    return response.data;
}

export async function updateLesson(productId: string, moduleId: string, lessonId: string, lesson: Omit<Lesson, 'id'>) {
    const response = await api.put<Course>(`/products/${productId}/course/modules/${moduleId}/lessons/${lessonId}`, lesson);
    if (!response.data) throw new Error('Failed to update lesson');
    return response.data;
}

export async function deleteLesson(productId: string, moduleId: string, lessonId: string) {
    const response = await api.delete<Course>(`/products/${productId}/course/modules/${moduleId}/lessons/${lessonId}`);
    if (!response.data) throw new Error('Failed to delete lesson');
    return response.data;
}

export async function reorderCourseStructure(productId: string, modules: Module[]) {
    const response = await api.put<Course>(`/products/${productId}/course/reorder`, modules);
    if (!response.data) throw new Error('Failed to reorder course structure');
    return response.data;
}
