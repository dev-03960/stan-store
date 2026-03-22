import React, { useEffect, useState } from 'react';
import { X, Loader2, Users } from 'lucide-react';
import { getProductAffiliateAnalytics } from '../../features/affiliates/api';
import { formatPrice } from '../../lib/utils';
import type { Product } from '../../lib/api/store';

interface AffiliateAnalyticsModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product;
}

export const AffiliateAnalyticsModal: React.FC<AffiliateAnalyticsModalProps> = ({ isOpen, onClose, product }) => {
    const [analytics, setAnalytics] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        
        const fetchAnalytics = async () => {
            try {
                setLoading(true);
                const data = await getProductAffiliateAnalytics(product.id);
                setAnalytics(data);
                setError('');
            } catch (err) {
                console.error(err);
                setError('Failed to load analytics');
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [isOpen, product.id]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-xl relative">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Affiliate Analytics</h2>
                        <p className="text-sm text-gray-500 mt-1">Performance for: <span className="font-semibold">{product.title}</span></p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                
                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                        </div>
                    ) : error ? (
                        <div className="text-red-500 py-8 text-center">{error}</div>
                    ) : analytics.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-base font-medium text-gray-900">No Sales Yet</h3>
                            <p className="text-sm text-gray-500 mt-1">No affiliates have sold this product yet.</p>
                        </div>
                    ) : (
                        <div className="overflow-hidden border border-gray-200 rounded-xl">
                            <table className="w-full text-left font-sans">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">Affiliate</th>
                                        <th className="px-6 py-4 font-medium text-right">Product Sales</th>
                                        <th className="px-6 py-4 font-medium text-right">Commission Earned</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm">
                                    {analytics.map((row) => (
                                        <tr key={row.affiliate.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{row.affiliate.name}</div>
                                                <div className="text-gray-500 text-xs">{row.affiliate.email}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-medium text-gray-900">{row.sales_count}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-medium text-green-600">{formatPrice(row.commission_earned)}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
