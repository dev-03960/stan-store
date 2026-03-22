import React, { useEffect, useState } from 'react';
import { getCreatorAffiliates, updateAffiliateCommission, suspendAffiliate, reactivateAffiliate, manualGrantAffiliate, type Affiliate } from '../../features/affiliates/api';
import { Users, MousePointerClick, ShoppingCart, Banknote, Share2, Edit3, UserPlus, Power, PowerOff, Loader2, X } from 'lucide-react';
import { formatPrice } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

const AffiliateDashboard: React.FC = () => {
    const { user } = useAuth();
    const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [editingCommission, setEditingCommission] = useState<{ id: string, name: string, rate: number } | null>(null);
    const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
    const [grantEmail, setGrantEmail] = useState('');
    const [grantName, setGrantName] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const fetchAffiliates = async () => {
        try {
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

    useEffect(() => {
        fetchAffiliates();
    }, []);

    const handleSaveCommission = async () => {
        if (!editingCommission) return;
        try {
            setActionLoading(true);
            await updateAffiliateCommission(editingCommission.id, editingCommission.rate);
            await fetchAffiliates();
            setEditingCommission(null);
        } catch (err: any) {
            alert('Failed to update commission');
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleStatus = async (aff: Affiliate) => {
        try {
            setActionLoading(true);
            if (aff.status === 'active') {
                await suspendAffiliate(aff.id);
            } else {
                await reactivateAffiliate(aff.id);
            }
            await fetchAffiliates();
        } catch (err) {
            alert('Failed to update status');
        } finally {
            setActionLoading(false);
        }
    };

    const handleManualGrant = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setActionLoading(true);
            await manualGrantAffiliate(grantEmail, grantName);
            await fetchAffiliates();
            setIsGrantModalOpen(false);
            setGrantEmail('');
            setGrantName('');
        } catch (err: any) {
            alert(err.message || 'Failed to grant affiliate access');
        } finally {
            setActionLoading(false);
        }
    };

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
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <button
                        onClick={() => setIsGrantModalOpen(true)}
                        className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        <UserPlus className="w-4 h-4" />
                        Add Affiliate
                    </button>
                    <div className="flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium border border-indigo-100">
                        <Share2 className="w-4 h-4" />
                        Share Invite Link:
                        <a href={`${storeUrl}/affiliate`} target="_blank" rel="noopener noreferrer" className="underline truncate max-w-[150px] sm:max-w-[200px] hover:text-indigo-900">
                            {`${storeUrl}/affiliate`}
                        </a>
                    </div>
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
                        <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
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
                                    <th className="px-6 py-4 font-medium text-center">Commission %</th>
                                    <th className="px-6 py-4 font-medium text-center">Status</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
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
                                        <td className="px-6 py-4 text-center text-gray-900 font-medium">
                                            {aff.commission_rate}%
                                            <button 
                                              onClick={() => setEditingCommission({ id: aff.id, name: aff.name, rate: aff.commission_rate })}
                                              className="ml-2 text-indigo-500 hover:text-indigo-700 inline-flex align-middle"
                                              title="Edit Commission"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${aff.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                                {aff.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleToggleStatus(aff)}
                                                disabled={actionLoading}
                                                className={`p-2 rounded-lg border transition-colors ${aff.status === 'active' ? 'text-red-600 bg-red-50 border-red-100 hover:bg-red-100' : 'text-green-600 bg-green-50 border-green-100 hover:bg-green-100'} disabled:opacity-50`}
                                                title={aff.status === 'active' ? "Suspend Affiliate" : "Reactivate Affiliate"}
                                            >
                                                {aff.status === 'active' ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modals */}
            {isGrantModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl relative">
                        <button onClick={() => setIsGrantModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-indigo-600" /> Grant Affiliate Access
                        </h3>
                        <form onSubmit={handleManualGrant} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input required type="text" value={grantName} onChange={e => setGrantName(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" placeholder="Jane Doe" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input required type="email" value={grantEmail} onChange={e => setGrantEmail(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" placeholder="jane@example.com" />
                            </div>
                            <button disabled={actionLoading} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg flex justify-center items-center gap-2 disabled:opacity-50">
                                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                Send Invite & Grant Access
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {editingCommission && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl relative">
                        <button onClick={() => setEditingCommission(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Edit Commission</h3>
                        <p className="text-sm text-gray-500 mb-4">Set a custom commission rate for <b>{editingCommission.name}</b>.</p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%)</label>
                                <input type="number" min="0" max="100" value={editingCommission.rate} onChange={e => setEditingCommission({ ...editingCommission, rate: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                            </div>
                            <button disabled={actionLoading} onClick={handleSaveCommission} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg flex justify-center items-center gap-2 disabled:opacity-50">
                                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AffiliateDashboard;
