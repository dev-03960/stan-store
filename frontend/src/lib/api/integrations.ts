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

export interface GoogleCalendarConnection {
    connected: boolean;
    email?: string;
    createdAt?: string;
}

export const integrationsApi = {
    // Instagram Connection
    getInstagramOAuthUrl: async () => {
        const response = await api.get<{ url: string }>('/integrations/instagram/oauth/url');
        return response.data;
    },
    getInstagramConnection: async () => {
        const response = await api.get<InstagramConnection>('/integrations/instagram/connection');
        return response.data;
    },
    disconnectInstagram: async () => {
        const response = await api.delete('/integrations/instagram/connection');
        return response.data;
    },

    // Instagram Automations
    getInstagramAutomations: async () => {
        const response = await api.get<InstagramAutomation[]>('/creator/automations/instagram');
        return response.data;
    },
    createInstagramAutomation: async (data: { keyword: string; responseText: string; productId?: string }) => {
        const response = await api.post<InstagramAutomation>('/creator/automations/instagram', data);
        return response.data;
    },
    deleteInstagramAutomation: async (id: string) => {
        const response = await api.delete(`/creator/automations/instagram/${id}`);
        return response.data;
    },

    // Google Calendar Connection
    getGoogleCalendarOAuthUrl: async () => {
        const response = await api.get<{ url: string }>('/integrations/google-calendar/oauth/url');
        return response.data;
    },
    getGoogleCalendarConnection: async () => {
        const response = await api.get<GoogleCalendarConnection>('/integrations/google-calendar/connection');
        return response.data;
    },
    disconnectGoogleCalendar: async () => {
        const response = await api.delete('/integrations/google-calendar/connection');
        return response.data;
    },
};

