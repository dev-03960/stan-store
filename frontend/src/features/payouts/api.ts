import { api } from '../../lib/api';

export interface PayoutConfig {
    id: string;
    creator_id: string;
    account_number: string;
    ifsc_code: string;
    account_holder_name: string;
    account_type: string;
    is_verified: boolean;
    razorpay_fund_account_id?: string;
    created_at: string;
    updated_at: string;
}

export interface PayoutSettingsResponse {
    configured: boolean;
    message?: string;
    id?: string;
    account_number?: string;
    ifsc_code?: string;
    account_holder_name?: string;
    account_type?: string;
    is_verified?: boolean;
}

export interface BalanceSummary {
    available_balance: number;
    pending_balance: number;
    total_earnings: number;
    total_withdrawn: number;
}

export interface Payout {
    id: string;
    creator_id: string;
    amount: number;
    status: 'processing' | 'completed' | 'failed' | 'reversed';
    reference_id: string;
    failure_reason?: string;
    created_at: string;
    completed_at?: string;
}

export const getPayoutSettings = async (): Promise<PayoutSettingsResponse> => {
    const response = await api.get<PayoutSettingsResponse>('/creator/payout-settings');
    if (!response.data) throw new Error('Failed to fetch payout settings');
    return response.data;
};

export const savePayoutSettings = async (data: {
    account_number: string;
    ifsc_code: string;
    account_holder_name: string;
    account_type: string;
}): Promise<PayoutConfig> => {
    const response = await api.post<PayoutConfig>('/creator/payout-settings', data);
    if (!response.data) throw new Error('Failed to save payout settings');
    return response.data;
};

export const getBalanceSummary = async (): Promise<BalanceSummary> => {
    const response = await api.get<BalanceSummary>('/creator/payouts/balance');
    if (!response.data) throw new Error('Failed to fetch balance summary');
    return response.data;
};

export const withdrawFunds = async (amountInPaise: number): Promise<Payout> => {
    const response = await api.post<Payout>('/creator/payouts/withdraw', { amount: amountInPaise });
    if (!response.data) throw new Error('Failed to initiate withdrawal');
    return response.data;
};

export const getPayoutHistory = async (): Promise<Payout[]> => {
    const response = await api.get<Payout[]>('/creator/payouts');
    if (!response.data) throw new Error('Failed to fetch payout history');
    return response.data;
};
