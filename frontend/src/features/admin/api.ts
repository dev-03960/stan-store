import { api } from '../../lib/api';

export interface PlatformMetrics {
    total_users: number;
    total_revenue: number;
    total_orders: number;
    active_creators: number;
}

export const getPlatformMetrics = async (): Promise<PlatformMetrics | null> => {
    const response = await api.get<PlatformMetrics>('/admin/metrics');
    return response.data || null;
};
