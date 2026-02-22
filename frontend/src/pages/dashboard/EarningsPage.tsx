import React, { useEffect, useState } from 'react';
import {
    getBalanceSummary,
    getPayoutHistory,
    getPayoutSettings,
    type BalanceSummary,
    type Payout,
    type PayoutSettingsResponse
} from '../../features/payouts/api';
import { formatPrice } from '../../lib/utils';
import { PayoutSettingsModal } from '../../components/payouts/PayoutSettingsModal';
import { WithdrawModal } from '../../components/payouts/WithdrawModal';
import { Landmark, ArrowUpRight, TrendingUp, Clock, AlertCircle } from 'lucide-react';

const EarningsPage: React.FC = () => {
    const [balance, setBalance] = useState<BalanceSummary | null>(null);
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [settings, setSettings] = useState<PayoutSettingsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal States
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [balData, payoutsData, settingsData] = await Promise.all([
                getBalanceSummary(),
                getPayoutHistory(),
                getPayoutSettings()
            ]);
            setBalance(balData);
            setPayouts(payoutsData);
            setSettings(settingsData);
            setError('');
        } catch (err: any) {
            setError('Failed to load dashboard data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) return <div className="p-8 text-gray-500">Loading your earnings dashboard...</div>;
    if (error) return <div className="p-8 text-red-500">{error}</div>;

    const hasBankConfigured = settings?.configured;
    // Get last 4 digits of account if configured, else fallback
    const accountEnding = hasBankConfigured && settings.account_number
        ? settings.account_number.slice(-4)
        : 'XXXX';

    return (
        <div className="space-y-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Payouts Dashboard</h1>

            {/* Top Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Available Balance (Main Card) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 md:col-span-2 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                        <Landmark className="w-24 h-24 text-gray-900" />
                    </div>

                    <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Available to Withdraw</h2>
                    <div className="mt-4 flex items-baseline space-x-2">
                        <span className="text-4xl font-extrabold text-gray-900">
                            {formatPrice(balance?.available_balance || 0)}
                        </span>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-4 items-center">
                        {hasBankConfigured ? (
                            <button
                                onClick={() => setIsWithdrawModalOpen(true)}
                                className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                            >
                                Withdraw Funds
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsSettingsModalOpen(true)}
                                className="bg-red-50 text-red-600 border border-red-200 px-6 py-2.5 rounded-lg font-medium hover:bg-red-100 transition-colors shadow-sm flex items-center gap-2"
                            >
                                <AlertCircle className="w-4 h-4" />
                                Link Bank Account First
                            </button>
                        )}

                        {hasBankConfigured && (
                            <button
                                onClick={() => setIsSettingsModalOpen(true)}
                                className="text-sm text-gray-500 hover:text-gray-900 underline"
                            >
                                Edit Bank Link (•••• {accountEnding})
                            </button>
                        )}
                    </div>
                </div>

                {/* Stats Column */}
                <div className="space-y-6">
                    <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
                        <div className="flex items-center gap-2 text-orange-600 mb-2">
                            <Clock className="w-4 h-4" />
                            <h2 className="text-xs font-semibold uppercase tracking-wider">Processing</h2>
                        </div>
                        <span className="text-2xl font-bold text-orange-900">
                            {formatPrice(balance?.pending_balance || 0)}
                        </span>
                    </div>

                    <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                        <div className="flex items-center gap-2 text-green-600 mb-2">
                            <TrendingUp className="w-4 h-4" />
                            <h2 className="text-xs font-semibold uppercase tracking-wider">Total Earned All Time</h2>
                        </div>
                        <span className="text-2xl font-bold text-green-900">
                            {formatPrice(balance?.total_earnings || 0)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Payout History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Withdrawal History</h3>
                    <p className="text-sm text-gray-500">
                        Total Withdrawn: <span className="font-medium text-gray-900">{formatPrice(balance?.total_withdrawn || 0)}</span>
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-gray-900 font-medium border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Reference ID</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {payouts.length > 0 ? (
                                payouts.map((payout) => (
                                    <tr key={payout.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {new Date(payout.created_at).toLocaleDateString()}
                                            <div className="text-xs text-gray-400 mt-0.5">
                                                {new Date(payout.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs">
                                            {payout.reference_id}
                                        </td>
                                        <td className="px-6 py-4 capitalize">
                                            <span
                                                className={`px-2.5 py-1 rounded-full text-xs font-medium border ${payout.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                                                        payout.status === 'processing' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                            'bg-red-50 text-red-700 border-red-200'
                                                    }`}
                                            >
                                                {payout.status}
                                            </span>
                                            {payout.status === 'failed' && payout.failure_reason && (
                                                <p className="text-xs text-red-500 mt-1 max-w-xs truncate" title={payout.failure_reason}>
                                                    {payout.failure_reason}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-gray-900">
                                            <div className="flex items-center justify-end gap-1">
                                                {formatPrice(payout.amount)}
                                                <ArrowUpRight className="w-3 h-3 text-gray-400" />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <Landmark className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500 font-medium">No withdrawals yet</p>
                                        <p className="text-gray-400 text-sm mt-1">Your payout history will appear here.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            <PayoutSettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                onSuccess={fetchData}
                initialData={settings?.configured ? {
                    account_number: settings.account_number,
                    ifsc_code: settings.ifsc_code,
                    account_holder_name: settings.account_holder_name,
                    account_type: settings.account_type,
                } : undefined}
            />

            <WithdrawModal
                isOpen={isWithdrawModalOpen}
                onClose={() => setIsWithdrawModalOpen(false)}
                onSuccess={fetchData}
                availableBalance={balance?.available_balance || 0}
                accountEnding={accountEnding}
            />

        </div>
    );
};

export default EarningsPage;
