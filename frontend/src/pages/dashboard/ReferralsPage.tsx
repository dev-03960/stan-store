import { useQuery } from '@tanstack/react-query';
import { getReferralDashboard } from '../../features/referrals/api';
import { Users, IndianRupee, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ReferralsPage() {
    const { data: dashboard, isLoading, error } = useQuery({
        queryKey: ['referral-dashboard'],
        queryFn: getReferralDashboard,
    });

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#6786f5] border-t-transparent" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="rounded-xl bg-red-50 p-6 text-center text-red-600">
                    <p className="font-medium">Failed to load referral data</p>
                </div>
            </div>
        );
    }

    const { referrals = [], total_referrals = 0, total_commission = 0 } = dashboard || {};

    const StatusBadge = ({ status }: { status: string }) => {
        switch (status) {
            case 'active':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Active
                    </span>
                );
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-semibold text-yellow-700">
                        <Clock className="h-3.5 w-3.5" />
                        Pending Trial
                    </span>
                );
            case 'cancelled':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                        <XCircle className="h-3.5 w-3.5" />
                        Cancelled
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Platform Referrals</h1>
                    <p className="text-gray-500">Refer creators to Miostore and earn 20% recurring commission.</p>
                </div>
                <div>
                    <button
                        onClick={() => {
                            const username = localStorage.getItem('stan_username') || 'your-username'; // Adjust as needed if username isn't in local storage easily
                            navigator.clipboard.writeText(`https://miostore.com/?ref=${username}`);
                            alert('Referral Link Copied to Clipboard!');
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                    >
                        Copy Referral Link
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid gap-6 sm:grid-cols-2">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
                >
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Referrals</p>
                            <p className="text-2xl font-bold text-gray-900">{total_referrals}</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
                >
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600">
                            <IndianRupee className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Commissions</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {new Intl.NumberFormat('en-IN', {
                                    style: 'currency',
                                    currency: 'INR'
                                }).format(total_commission / 100)}
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Referrals List */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-6 py-4">
                    <h2 className="text-lg font-semibold text-gray-900">Referred Creators</h2>
                </div>
                
                {referrals.length === 0 ? (
                    <div className="p-12 text-center">
                        <Users className="mx-auto h-12 w-12 text-gray-300" />
                        <h3 className="mt-2 text-sm font-semibold text-gray-900">No referrals yet</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Share your link with other creators to start earning.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50/50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Creator</th>
                                    <th className="px-6 py-4 font-semibold">Joined At</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {referrals.map((referral) => (
                                    <tr key={referral.id} className="hover:bg-gray-50/50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{referral.referred_name}</div>
                                            <div className="text-gray-500">@{referral.referred_username}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {new Date(referral.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={referral.status} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
