import React, { useState } from 'react';
import { X, Loader2, Landmark } from 'lucide-react';
import { savePayoutSettings } from '../../features/payouts/api';

interface PayoutSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: {
        account_number?: string;
        ifsc_code?: string;
        account_holder_name?: string;
        account_type?: string;
    };
}

export const PayoutSettingsModal: React.FC<PayoutSettingsModalProps> = ({ isOpen, onClose, onSuccess, initialData }) => {
    const [formData, setFormData] = useState({
        account_number: initialData?.account_number || '',
        ifsc_code: initialData?.ifsc_code || '',
        account_holder_name: initialData?.account_holder_name || '',
        account_type: initialData?.account_type || 'savings',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await savePayoutSettings(formData);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to save payout settings');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Landmark className="w-5 h-5 text-purple-600" /> Bank Account Details
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-4 bg-purple-50 flex gap-4">
                    <p className="text-xs text-purple-800">
                        This account will be used to transfer your earnings. Please ensure the details match your bank records exactly. Payments are routed via RazorpayX.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="account_holder_name" className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
                        <input
                            type="text"
                            id="account_holder_name"
                            required
                            value={formData.account_holder_name}
                            onChange={(e) => setFormData({ ...formData, account_holder_name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                            placeholder="John Doe"
                        />
                    </div>

                    <div>
                        <label htmlFor="account_number" className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                        <input
                            type="password"
                            id="account_number"
                            required
                            value={formData.account_number}
                            onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none font-mono"
                            placeholder="*************"
                        />
                    </div>

                    <div>
                        <label htmlFor="ifsc_code" className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                        <input
                            type="text"
                            id="ifsc_code"
                            required
                            value={formData.ifsc_code}
                            onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value.toUpperCase() })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none font-mono uppercase"
                            placeholder="HDFC0001234"
                            maxLength={11}
                        />
                    </div>

                    <div>
                        <label htmlFor="account_type" className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                        <select
                            id="account_type"
                            value={formData.account_type}
                            onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                        >
                            <option value="savings">Savings Account</option>
                            <option value="current">Current Account</option>
                        </select>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {loading ? 'Saving details...' : 'Save Bank Details'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
