import { api } from '../api';
import type { Product } from './store'; // Reuse Product type or define new one if needed

export interface CreateProductDTO {
    title: string;
    subtitle?: string;
    price: number;
    description?: string;
    product_type: string;
    cover_image_url?: string;
    file_url?: string;
    duration_minutes?: number;
    timezone?: string;
    cancellation_window_hours?: number;
    availability?: import('./store').AvailabilityWindow[];
    subscription_interval?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    subscription_billing_cycles?: number;
    external_url?: string;
    button_text?: string;
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

export async function enableAffiliateProgram(id: string, enabled: boolean, commissionRate: number) {
    const response = await api.post<{ message: string; product: Product }>(`/products/${id}/affiliates`, {
        enabled,
        commission_rate: commissionRate
    });
    return response.data;
}

export async function reorderProducts(items: ReorderItem[]) {
    // Backend expects { product_ids: ["id1", "id2"] }
    await api.patch('/products/reorder', { product_ids: items.map(item => item.id) });
}

export async function getPresignedUrl(filename: string, fileType: string, purpose: 'product_file' | 'cover_image' = 'product_file') {
    const response = await api.post<{ upload_url: string; file_key: string }>('/uploads/presigned', {
        file_name: filename,
        content_type: fileType,
        purpose
    });
    if (!response.data) throw new Error('Failed to get upload URL');
    return { url: response.data.upload_url, key: response.data.file_key };
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
    type: 'video' | 'text' | 'attachment' | 'link';
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

export async function reorderCourse(productId: string, items: Array<{ id: string, type: 'module' | 'lesson', parent_id?: string, sort_order: number }>) {
    const response = await api.put<Course>(`/products/${productId}/course/reorder`, { items });
    if (!response.data) throw new Error('Failed to reorder course');
    return response.data;
}

// --- Testimonial Specific Types & APIs ---

export interface Testimonial {
    id: string;
    product_id: string;
    creator_id: string;
    customer_name: string;
    text: string;
    rating: number;
    avatar_url?: string;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

export interface CreateTestimonialDTO {
    customer_name: string;
    text: string;
    rating: number;
    avatar_url?: string;
}

export async function getTestimonials(productId: string) {
    const response = await api.get<{ data: Testimonial[] }>(`/products/${productId}/testimonials`);
    return response.data?.data || [];
}

export async function createTestimonial(productId: string, data: CreateTestimonialDTO) {
    const response = await api.post<{ data: Testimonial }>(`/products/${productId}/testimonials`, data);
    return response.data?.data;
}

export async function updateTestimonial(productId: string, testimonialId: string, data: CreateTestimonialDTO) {
    const response = await api.put<{ data: Testimonial }>(`/products/${productId}/testimonials/${testimonialId}`, data);
    return response.data?.data;
}

export async function deleteTestimonial(productId: string, testimonialId: string) {
    await api.delete(`/products/${productId}/testimonials/${testimonialId}`);
}

export async function reorderTestimonials(productId: string, testimonialIds: string[]) {
    await api.patch(`/products/${productId}/testimonials/reorder`, { testimonial_ids: testimonialIds });
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
