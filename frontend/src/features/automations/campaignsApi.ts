import { api } from '../../lib/api';

export interface CampaignEmail {
    subject: string;
    body_html: string;
    delay_minutes: number;
}

export interface Campaign {
    id: string;
    creator_id: string;
    name: string;
    trigger_type: string;
    trigger_product_id: string;
    emails: CampaignEmail[];
    status: 'active' | 'paused';
    created_at: string;
    updated_at: string;
}

export interface CampaignListResponse {
    campaign: Campaign;
    sent_total: number;
}

export const campaignsApi = {
    getCampaigns: async () => {
        const response = await api.get<CampaignListResponse[]>('/creator/campaigns');
        return response.data || [];
    },

    createCampaign: async (payload: { name: string; trigger_product_id: string; emails: CampaignEmail[] }) => {
        const response = await api.post<{ campaign: Campaign; sent_total: number }>('/creator/campaigns', payload);
        return response.data;
    },

    updateCampaignStatus: async (id: string, status: 'active' | 'paused') => {
        const response = await api.patch(`/creator/campaigns/${id}`, { status });
        return response.data;
    },
};
