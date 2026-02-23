import React, { useEffect, useState } from 'react';
import { getCreatorAffiliates, type Affiliate } from '../../features/affiliates/api';
import { Users, MousePointerClick, ShoppingCart, Banknote, Share2 } from 'lucide-react';
import { formatPrice } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

const AffiliateDashboard: React.FC = () => {
    const { user } = useAuth();
    const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAffiliates = async () => {
            try {
                setLoading(true);
                const data = await getCreatorAffiliates();
                setAffiliates(data);
                setError('');
            } catch (err: any) {
                setError('Failed to fetch affiliates');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchAffiliates();
    }, []);

    // Aggregations
    const totalPromoters = affiliates.length;
    const totalClicks = affiliates.reduce((sum, a) => sum + a.total_clicks, 0);
    const totalSales = affiliates.reduce((sum, a) => sum + a.total_sales, 0);
    const totalCommissions = affiliates.reduce((sum, a) => sum + a.total_earned, 0);

    const storeUrl = `${window.location.origin}/store/${user?.username}`;

    if (loading) return <div className="p-8 text-gray-500">Loading your affiliate program...</div>;
    if (error) return <div className="p-8 text-red-500">{error}</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Affiliate Program</h1>
                <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium border border-indigo-100">
                    <Share2 className="w-4 h-4" />
                    Share Invite Link:
                    <a href={`${storeUrl}/affiliate`} target="_blank" rel="noopener noreferrer" className="underline truncate max-w-[200px] hover:text-indigo-900">
                        {`${storeUrl}/affiliate`}
                    </a>
                </div>
            </div>

            {/* Top Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Promoters</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalPromoters}</h3>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                            <Users size={20} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Clicks</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalClicks}</h3>
                        </div>
                        <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                            <MousePointerClick size={20} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Referred Sales</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalSales}</h3>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg text-green-600">
                            <ShoppingCart size={20} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Commissions Paid</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatPrice(totalCommissions)}</h3>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-lg text-orange-600">
                            <Banknote size={20} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Affiliates List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900 font-heading">Active Affiliates</h2>
                </div>

                {affiliates.length === 0 ? (
                    <div className="p-8 text-center bg-gray-50">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900">No affiliates yet</h3>
                        <p className="text-gray-500 mt-1 max-w-sm mx-auto">
                            Share your invite link with your audience so they can start promoting your products.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left font-sans">
                            <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Promoter</th>
                                    <th className="px-6 py-4 font-medium">Referral Code</th>
                                    <th className="px-6 py-4 font-medium text-right">Clicks</th>
                                    <th className="px-6 py-4 font-medium text-right">Sales</th>
                                    <th className="px-6 py-4 font-medium text-right">Earned</th>
                                    <th className="px-6 py-4 font-medium text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {affiliates.map((aff) => (
                                    <tr key={aff.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{aff.name}</div>
                                            <div className="text-gray-500 text-xs">{aff.email}</div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-gray-600 tracking-wide">
                                            {aff.referral_code}
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-600">
                                            {aff.total_clicks}
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-600">
                                            {aff.total_sales}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-gray-900">
                                            {formatPrice(aff.total_earned)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${aff.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                                {aff.status}
                                            </span>
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
};

export default AffiliateDashboard;
