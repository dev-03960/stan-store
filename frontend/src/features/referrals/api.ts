import { api } from '../../lib/api';

export interface PlatformReferral {
    id: string;
    referrer_id: string;
    referred_id: string;
    status: 'pending' | 'active' | 'cancelled';
    created_at: string;
    updated_at: string;
    referred_name: string;
    referred_email: string;
    referred_username: string;
}

export interface ReferralDashboardData {
    referrals: PlatformReferral[];
    total_referrals: number;
    total_commission: number;
}

export const getReferralDashboard = async (): Promise<ReferralDashboardData> => {
    const response = await api.get<{ data: ReferralDashboardData }>('/creator/referrals');
    return response.data!.data;
};
