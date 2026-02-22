import React, { useState } from 'react';
import { X, Loader2, ArrowRight } from 'lucide-react';
import { withdrawFunds } from '../../features/payouts/api';
import { formatPrice } from '../../lib/utils';

interface WithdrawModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    availableBalance: number; // in paise
    accountEnding: string;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    availableBalance,
    accountEnding
}) => {
    // We let user input in Rupees, but backend expects Paise
    const [amountRupees, setAmountRupees] = useState((availableBalance / 100).toString());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const withdrawalAmountPaise = Math.round(parseFloat(amountRupees) * 100);

        if (withdrawalAmountPaise <= 0) {
            setError('Amount must be greater than zero.');
            setLoading(false);
            return;
        }

        if (withdrawalAmountPaise > availableBalance) {
            setError('Amount exceeds available balance.');
            setLoading(false);
            return;
        }

        try {
            await withdrawFunds(withdrawalAmountPaise);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to initiate withdrawal');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">Withdraw Funds</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-4 bg-gray-50 border-b border-gray-100 text-center">
                    <p className="text-sm text-gray-500">Available to withdraw</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{formatPrice(availableBalance)}</p>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Amount to withdraw (₹)</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">₹</span>
                            <input
                                type="number"
                                id="amount"
                                required
                                min="1"
                                max={availableBalance / 100}
                                step="any"
                                value={amountRupees}
                                onChange={(e) => setAmountRupees(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-lg font-medium"
                            />
                        </div>
                    </div>

                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between">
                        <span className="text-sm text-gray-500">Transfer to</span>
                        <span className="text-sm font-medium text-gray-900 font-mono flex items-center gap-1">
                            •••• {accountEnding}
                        </span>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading || !amountRupees || parseFloat(amountRupees) <= 0}
                            className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            {loading ? 'Processing...' : 'Confirm Withdrawal'}
                            {!loading && <ArrowRight className="w-4 h-4" />}
                        </button>
                        <p className="text-xs text-center text-gray-400 mt-3">
                            Transfers usually arrive within 24 hours.
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};
