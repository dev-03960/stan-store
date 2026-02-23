import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export interface DashboardMetrics {
    unique_visitors: number;
    page_views: number;
    product_views: number;
    checkout_starts: number;
    purchases: number;
    revenue: number;
}

export const getCreatorAnalytics = async (period: string): Promise<DashboardMetrics> => {
    const response = await api.get<DashboardMetrics>(`/creator/analytics?period=${period}`);
    if (!response.data) throw new Error('Failed to fetch analytics data');
    return response.data;
};

export function useAnalytics(period: string) {
    return useQuery({
        queryKey: ['creator-analytics', period],
        queryFn: () => getCreatorAnalytics(period),
        refetchInterval: 60000, // auto-poll every 60s
    });
}
