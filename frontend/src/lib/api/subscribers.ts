import { api } from '../api';

export interface Subscriber {
    id: string;
    email: string;
    name: string;
    source: string;
    consent_given: boolean;
    created_at: string;
    updated_at: string;
}

export interface SubscriberListResponse {
    subscribers: Subscriber[];
    total: number;
}

export const getSubscribers = async (page: number = 1, limit: number = 20): Promise<SubscriberListResponse> => {
    const res = await api.get<SubscriberListResponse>(`/creator/subscribers?page=${page}&limit=${limit}`);
    return res.data as SubscriberListResponse;
};

export const sendNewsletter = async (subject: string, bodyHtml: string): Promise<void> => {
    await api.post('/creator/newsletter', { subject, body_html: bodyHtml });
};
