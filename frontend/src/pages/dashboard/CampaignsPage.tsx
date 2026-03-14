import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Save, Play, Pause } from 'lucide-react';
import { campaignsApi } from '../../features/automations/campaignsApi';
import type { CampaignListResponse } from '../../features/automations/campaignsApi';
import { api } from '../../lib/api';

export const CampaignsPage: React.FC = () => {
    const [campaigns, setCampaigns] = useState<CampaignListResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState<any[]>([]);

    // Simple create form state
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newTriggerProduct, setNewTriggerProduct] = useState('');
    const [emails, setEmails] = useState([{ subject: '', body_html: '', delay_minutes: 0 }]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [campRes, prodRes] = await Promise.all([
                campaignsApi.getCampaigns(),
                api.get('/creator/products')
            ]);
            setCampaigns(campRes || []);
            setProducts((prodRes.data as any) || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newName || !newTriggerProduct || emails.length === 0) return;
        try {
            await campaignsApi.createCampaign({
                name: newName,
                trigger_product_id: newTriggerProduct,
                emails: emails.map(e => ({
                    ...e,
                    delay_minutes: Number(e.delay_minutes)
                }))
            });
            setIsCreating(false);
            setNewName('');
            setNewTriggerProduct('');
            setEmails([{ subject: '', body_html: '', delay_minutes: 0 }]);
            fetchData();
        } catch (err) {
            console.error('Failed to create campaign', err);
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: 'active' | 'paused') => {
        try {
            const newStatus = currentStatus === 'active' ? 'paused' : 'active';
            await campaignsApi.updateCampaignStatus(id, newStatus);
            fetchData();
        } catch (err) {
            console.error('Failed to toggle status', err);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-[#6786f5]" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-[#6786f5] to-blue-600 bg-clip-text text-transparent">Drip Campaigns</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Automate your email sequences when fans subscribe.</p>
                </div>
                {!isCreating && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#6786f5] text-white rounded-lg hover:bg-[#5570e0] transition"
                    >
                        <Plus className="w-5 h-5" /> Create Campaign
                    </button>
                )}
            </div>

            {isCreating && (
                <div className="bg-white dark:bg-[#1e2135] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
                    <h2 className="text-xl font-bold dark:text-white">New Campaign</h2>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Campaign Name</label>
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-[#6786f5] outline-none bg-white dark:bg-[#0f111a] dark:text-white"
                            placeholder="e.g. 5-Day Free Course Nurture"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Trigger (Lead Magnet)</label>
                        <select
                            value={newTriggerProduct}
                            onChange={(e) => setNewTriggerProduct(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-[#6786f5] outline-none bg-white dark:bg-[#0f111a] dark:text-white"
                        >
                            <option value="">Select a product...</option>
                            {products.filter(p => p.type === 'lead_magnet').map(p => (
                                <option key={p.id} value={p.id}>{p.title}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Sequence</label>
                        {emails.map((email, idx) => (
                            <div key={idx} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg space-y-4 bg-gray-50/50 dark:bg-[#0f111a]/50">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Subject Line</label>
                                    <input
                                        type="text"
                                        value={email.subject}
                                        onChange={(e) => {
                                            const nw = [...emails];
                                            nw[idx].subject = e.target.value;
                                            setEmails(nw);
                                        }}
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-200 outline-none bg-white dark:bg-[#0f111a] dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Body HTML</label>
                                    <textarea
                                        value={email.body_html}
                                        onChange={(e) => {
                                            const nw = [...emails];
                                            nw[idx].body_html = e.target.value;
                                            setEmails(nw);
                                        }}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-200 outline-none bg-white dark:bg-[#0f111a] dark:text-white"
                                        placeholder="<p>Hi {customer_name}, ...</p>"
                                    />
                                </div>
                                <div className="w-48">
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Delay (mins from previous)</label>
                                    <input
                                        type="number"
                                        value={email.delay_minutes}
                                        onChange={(e) => {
                                            const nw = [...emails];
                                            nw[idx].delay_minutes = parseInt(e.target.value) || 0;
                                            setEmails(nw);
                                        }}
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md outline-none bg-white dark:bg-[#0f111a] dark:text-white"
                                    />
                                </div>
                            </div>
                        ))}

                        {emails.length < 5 && (
                            <button
                                onClick={() => setEmails([...emails, { subject: '', body_html: '', delay_minutes: 1440 }])}
                                className="text-sm font-medium text-[#6786f5] hover:text-[#5570e0]"
                            >
                                + Add another email (Max 5)
                            </button>
                        )}
                    </div>

                    <div className="flex gap-4 pt-4 border-t dark:border-gray-700">
                        <button
                            onClick={handleCreate}
                            className="flex items-center gap-2 px-6 py-2 bg-[#6786f5] text-white rounded-lg hover:bg-[#5570e0] transition"
                        >
                            <Save className="w-4 h-4" /> Save Campaign
                        </button>
                        <button
                            onClick={() => setIsCreating(false)}
                            className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {campaigns.length === 0 && !isCreating ? (
                    <div className="text-center py-12 bg-white dark:bg-[#1e2135] rounded-2xl border border-gray-100 dark:border-gray-700">
                        <p className="text-gray-500 dark:text-gray-400">No campaigns found. Create one to get started!</p>
                    </div>
                ) : (
                    campaigns.map((c) => (
                        <div key={c.campaign.id} className="bg-white dark:bg-[#1e2135] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold dark:text-white flex items-center gap-3">
                                    {c.campaign.name}
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${c.campaign.status === 'active'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {c.campaign.status}
                                    </span>
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Triggered by Lead Magnet • {c.campaign.emails.length} emails • {c.sent_total} sent
                                </p>
                            </div>

                            <button
                                onClick={() => handleToggleStatus(c.campaign.id, c.campaign.status)}
                                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition"
                                title={c.campaign.status === 'active' ? 'Pause Campaign' : 'Resume Campaign'}
                            >
                                {c.campaign.status === 'active' ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 text-green-600" />}
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
