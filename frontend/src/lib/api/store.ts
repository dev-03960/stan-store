import { api } from '../api';

export interface SocialLink {
    platform: string;
    url: string;
}

export interface CreatorProfile {
    id: string;
    displayName: string;
    username: string;
    bio: string;
    avatarUrl: string;
    socialLinks: SocialLink[];
}

export interface AvailabilityWindow {
    day_of_week: number;
    start_time: string;
    end_time: string;
}

export interface BumpConfig {
    bump_product_id: string;
    bump_discount: number;
}

export interface Product {
    id: string;
    title: string;
    subtitle?: string;
    price: number;
    description?: string;
    image_url?: string;
    product_type: string;
    duration_minutes?: number;
    timezone?: string;
    cancellation_window_hours?: number;
    availability?: AvailabilityWindow[];
    bump?: BumpConfig;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    file_url?: string;
    is_visible?: boolean;
    sort_order?: number;
    subscription_interval?: 'monthly' | 'yearly';
}

export interface StoreResponse {
    creator: CreatorProfile;
    products: Product[];
}

export async function getStoreByUsername(username: string): Promise<StoreResponse> {
    // api.get returns ApiResponse<T> which is { data: T, ... }
    // Wait, looking at api.ts: `const body: ApiResponse<T> = await response.json(); return body;`
    // So api.get returns the envelope.
    const response = await api.get<StoreResponse>(`/store/${username}`);
    if (!response.data) {
        throw new Error('No data returned from store API');
    }
    return response.data;
}
