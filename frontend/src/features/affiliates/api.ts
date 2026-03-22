import { api } from '../../lib/api';

export interface Affiliate {
    id: string;
    creator_id: string;
    email: string;
    name: string;
    referral_code: string;
    commission_rate: number;
    total_clicks: number;
    total_sales: number;
    total_earned: number; // in paise
    status: string;
    created_at: string;
    updated_at: string;
}

export interface AffiliateStats {
    total_clicks: number;
    total_sales: number;
    total_earned: number; // in paise
    pending_payouts: number; // in paise
}

export interface RegisterAffiliateDTO {
    creator_id: string;
    email: string;
    name: string;
}

export interface RegisterAffiliateResponse {
    message: string;
    referral_code: string;
}

// Protected: Creator views their affiliates
export async function getCreatorAffiliates() {
    const response = await api.get<Affiliate[]>('/creator/affiliates');
    return response.data || [];
}

// Public: Register as an affiliate
export async function registerAffiliate(data: RegisterAffiliateDTO) {
    const response = await api.post<RegisterAffiliateResponse>('/affiliates/register', data);
    if (!response.data) throw new Error('Failed to register affiliate');
    return response.data;
}

// Public: Get stats for an affiliate using their referral code
export async function getAffiliateStats(code: string) {
    const response = await api.get<AffiliateStats>(`/affiliates/my-stats?code=${encodeURIComponent(code)}`);
    if (!response.data) throw new Error('Failed to retrieve stats');
    return response.data;
}

// Public: Track a click for a referral code
export async function trackAffiliateClick(code: string) {
    await api.post('/affiliates/track', { code });
}

// Protected: Edit an affiliate's commission rate
export async function updateAffiliateCommission(id: string, rate: number) {
    await api.put(`/creator/affiliates/${id}/commission`, { commission_rate: rate });
}

// Protected: Suspend an affiliate
export async function suspendAffiliate(id: string) {
    await api.patch(`/creator/affiliates/${id}/suspend`);
}

// Protected: Reactivate an affiliate
export async function reactivateAffiliate(id: string) {
    await api.patch(`/creator/affiliates/${id}/reactivate`);
}

// Protected: Manually grant an affiliate access
export async function manualGrantAffiliate(email: string, name: string) {
    const response = await api.post<RegisterAffiliateResponse>('/creator/affiliates/manual-grant', { email, name });
    if (!response.data) throw new Error('Failed to grant affiliate');
    return response.data;
}

// Protected: Get product-specific affiliate analytics
export async function getProductAffiliateAnalytics(productId: string) {
    const response = await api.get<any[]>(`/creator/products/${productId}/affiliate-analytics`);
    return response.data || [];
}
