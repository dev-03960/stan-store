import React, { useEffect, useState } from 'react';
import { getWalletDetails } from '../../features/dashboard/api';
import type { WalletDetails } from '../../features/dashboard/api';

const EarningsPage: React.FC = () => {
    const [wallet, setWallet] = useState<WalletDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchWallet = async () => {
            try {
                const data = await getWalletDetails();
                setWallet(data);
            } catch (err) {
                setError('Failed to load wallet details');
            } finally {
                setLoading(false);
            }
        };

        fetchWallet();
    }, []);

    if (loading) return <div>Loading earnings...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Earnings</h1>

            {/* Balance Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Available Balance</h2>
                <div className="mt-4 flex items-baseline space-x-2">
                    <span className="text-4xl font-extrabold text-gray-900">
                        ₹{wallet ? (wallet.balance / 100).toFixed(2) : '0.00'}
                    </span>
                    <span className="text-sm text-gray-500">INR</span>
                </div>
                <div className="mt-6">
                    <button className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors">
                        Withdraw Funds
                    </button>
                    <p className="mt-2 text-xs text-gray-400">Withdrawals are processed within 24 hours.</p>
                </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-gray-900 font-medium">
                            <tr>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Description</th>
                                <th className="px-6 py-3">Type</th>
                                <th className="px-6 py-3 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {wallet?.transactions && wallet.transactions.length > 0 ? (
                                wallet.transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {new Date(tx.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">{tx.description}</td>
                                        <td className="px-6 py-4 capitalize">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${tx.type === 'credit'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                    }`}
                                            >
                                                {tx.type}
                                            </span>
                                        </td>
                                        <td
                                            className={`px-6 py-4 text-right font-medium ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'
                                                }`}
                                        >
                                            {tx.type === 'credit' ? '+' : '-'}₹{(tx.amount / 100).toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                        No transactions yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default EarningsPage;
