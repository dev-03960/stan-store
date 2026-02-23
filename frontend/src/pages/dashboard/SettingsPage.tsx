import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Loader2, Save } from 'lucide-react';

interface ProfileResponse {
    displayName: string;
    bio: string;
    avatarUrl: string;
    theme: string;
    abandonedCartEnabled: boolean;
}

interface EmailTemplateResponse {
    subject: string;
    bodyHtml: string;
    delayDays: number;
    isActive: boolean;
}

const SettingsPage = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [profile, setProfile] = useState<ProfileResponse | null>(null);
    const [postPurchaseTemplate, setPostPurchaseTemplate] = useState<EmailTemplateResponse | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const [profileRes, templateRes] = await Promise.all([
                    api.get<{ data: ProfileResponse }>('/creator/profile'),
                    api.get<{ data: EmailTemplateResponse }>('/creator/email-templates/post_purchase').catch(() => ({ data: { data: null } }))
                ]);

                if (profileRes?.data?.data) {
                    setProfile({
                        displayName: profileRes.data.data.displayName || '',
                        bio: profileRes.data.data.bio || '',
                        avatarUrl: profileRes.data.data.avatarUrl || '',
                        theme: profileRes.data.data.theme || 'minimal',
                        abandonedCartEnabled: profileRes.data.data.abandonedCartEnabled !== false // defaults to true if omitted
                    });
                }

                if (templateRes?.data?.data) {
                    setPostPurchaseTemplate(templateRes.data.data);
                }
            } catch (err: any) {
                setError('Failed to load settings. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsSaving(true);

        try {
            await Promise.all([
                api.put('/creator/profile', profile),
                postPurchaseTemplate && api.put('/creator/email-templates/post_purchase', postPurchaseTemplate)
            ]);
            setSuccess('Settings saved successfully.');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save settings.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Store Settings</h1>

            {error && (
                <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            {success && (
                <div className="p-4 mb-6 bg-green-50 text-green-700 rounded-lg">
                    {success}
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">

                {/* Theme & Design section */}
                <div className="space-y-4 pb-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800">Storefront Design</h2>
                    <p className="text-sm text-gray-500 mb-4">
                        Personalize the look and feel of your public store page.
                    </p>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Theme Structure</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                            {[
                                { id: 'minimal', name: 'Minimal', previewClass: 'bg-white border-gray-200 text-gray-900' },
                                { id: 'bold', name: 'Bold Dark', previewClass: 'bg-slate-900 border-slate-700 text-white' },
                                { id: 'gradient', name: 'Vibrant', previewClass: 'bg-gradient-to-br from-purple-100 to-pink-100 border-purple-200 text-purple-900' },
                                { id: 'warm', name: 'Warm Earth', previewClass: 'bg-[#f5f0e8] border-[#e2d5c4] text-[#5c4a3d]' }
                            ].map((theme) => (
                                <button
                                    key={theme.id}
                                    type="button"
                                    onClick={() => setProfile(prev => prev ? { ...prev, theme: theme.id } : null)}
                                    className={`relative flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${profile?.theme === theme.id ? 'border-purple-600 ring-2 ring-purple-100 bg-purple-50' : 'border-gray-200 hover:border-purple-300'}`}
                                >
                                    <div className={`w-full h-16 rounded shadow-sm border flex items-center justify-center font-semibold text-xs ${theme.previewClass}`}>
                                        Aa
                                    </div>
                                    <span className={`text-sm font-medium ${profile?.theme === theme.id ? 'text-purple-700' : 'text-gray-600'}`}>{theme.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* General Settings section */}
                <div className="space-y-4 pb-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800">Email Automations</h2>
                    <p className="text-sm text-gray-500 mb-4">
                        Configure automated marketing emails to boost your conversions.
                    </p>

                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-gray-900">Abandoned Cart Recovery</label>
                                <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">Active</span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                                Automatically send an email reminder to buyers who leave items in their cart for more than 1 hour.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setProfile(prev => prev ? { ...prev, abandonedCartEnabled: !prev.abandonedCartEnabled } : null)}
                            className={`${profile?.abandonedCartEnabled ? 'bg-purple-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                            role="switch"
                            aria-checked={profile?.abandonedCartEnabled}
                        >
                            <span
                                aria-hidden="true"
                                className={`${profile?.abandonedCartEnabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                            />
                        </button>
                    </div>

                    {/* Post-Purchase Follow-Up Sequence */}
                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-medium text-gray-900">Automated Follow-Up (Post-Purchase)</label>
                                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${postPurchaseTemplate?.isActive ? 'bg-blue-50 text-blue-700 ring-blue-700/10' : 'bg-gray-50 text-gray-600 ring-gray-500/10'}`}>
                                        {postPurchaseTemplate?.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                    Send a customizable email to customers a few days after their purchase.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPostPurchaseTemplate(prev => prev ? { ...prev, isActive: !prev.isActive } : null)}
                                className={`${postPurchaseTemplate?.isActive ? 'bg-purple-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                                role="switch"
                                aria-checked={postPurchaseTemplate?.isActive}
                            >
                                <span
                                    aria-hidden="true"
                                    className={`${postPurchaseTemplate?.isActive ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                                />
                            </button>
                        </div>

                        {postPurchaseTemplate?.isActive && (
                            <div className="mt-5 space-y-4 pl-4 border-l-2 border-purple-100">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Delay Duration (Days)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="30"
                                        value={postPurchaseTemplate.delayDays}
                                        onChange={(e) => setPostPurchaseTemplate(prev => prev ? { ...prev, delayDays: parseInt(e.target.value) || 1 } : null)}
                                        className="mt-1 block w-32 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Number of days to wait after a purchase before sending</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email Subject</label>
                                    <input
                                        type="text"
                                        value={postPurchaseTemplate.subject}
                                        onChange={(e) => setPostPurchaseTemplate(prev => prev ? { ...prev, subject: e.target.value } : null)}
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Supports variables: {'{product_title}'}, {'{creator_name}'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email Body (HTML/Text)</label>
                                    <textarea
                                        rows={6}
                                        value={postPurchaseTemplate.bodyHtml}
                                        onChange={(e) => setPostPurchaseTemplate(prev => prev ? { ...prev, bodyHtml: e.target.value } : null)}
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                        placeholder="<p>Hi there,</p>..."
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                    >
                        {isSaving ? (
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        ) : (
                            <Save className="w-5 h-5 mr-2" />
                        )}
                        Save Settings
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SettingsPage;
