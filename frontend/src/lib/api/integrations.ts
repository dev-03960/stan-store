import { api } from '../api';

export interface InstagramConnection {
    connected: boolean;
    igUsername?: string;
    createdAt?: string;
}

export interface InstagramAutomation {
    id: string;
    creatorId: string;
    keyword: string;
    responseText: string;
    productId?: string;
    isActive: boolean;
    dmCount: number;
    createdAt: string;
}

export const integrationsApi = {
    // Connection
    getInstagramOAuthUrl: async () => {
        const response = await api.get<{ data: { url: string } }>('/integrations/instagram/oauth/url');
        return response.data;
    },
    getInstagramConnection: async () => {
        const response = await api.get<{ data: InstagramConnection }>('/integrations/instagram/connection');
        return response.data;
    },
    disconnectInstagram: async () => {
        const response = await api.delete('/integrations/instagram/connection');
        return response.data;
    },

    // Automations
    getInstagramAutomations: async () => {
        const response = await api.get<{ data: InstagramAutomation[] }>('/creator/automations/instagram');
        return response.data;
    },
    createInstagramAutomation: async (data: { keyword: string; responseText: string; productId?: string }) => {
        const response = await api.post<{ data: InstagramAutomation }>('/creator/automations/instagram', data);
        return response.data;
    },
    deleteInstagramAutomation: async (id: string) => {
        const response = await api.delete(`/creator/automations/instagram/${id}`);
        return response.data;
    }
};
