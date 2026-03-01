import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Loader2, Save, Plus, Trash2, User, Image } from 'lucide-react';

interface SocialLink {
    platform: string;
    url: string;
}

interface ProfileResponse {
    displayName: string;
    bio: string;
    avatarUrl: string;
    theme: string;
    abandonedCartEnabled: boolean;
    socialLinks: SocialLink[];
}

interface EmailTemplateResponse {
    subject: string;
    bodyHtml: string;
    delayDays: number;
    isActive: boolean;
}

const PLATFORMS = [
    { id: 'instagram', label: 'Instagram' },
    { id: 'youtube', label: 'YouTube' },
    { id: 'twitter', label: 'Twitter / X' },
    { id: 'linkedin', label: 'LinkedIn' },
    { id: 'tiktok', label: 'TikTok' },
];

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
                    api.get<ProfileResponse>('/creator/profile'),
                    api.get<EmailTemplateResponse>('/creator/email-templates/post_purchase').catch(() => ({ data: null }))
                ]);

                if (profileRes?.data) {
                    setProfile({
                        displayName: profileRes.data.displayName || '',
                        bio: profileRes.data.bio || '',
                        avatarUrl: profileRes.data.avatarUrl || '',
                        theme: profileRes.data.theme || 'minimal',
                        abandonedCartEnabled: profileRes.data.abandonedCartEnabled !== false,
                        socialLinks: profileRes.data.socialLinks || []
                    });
                }

                if (templateRes?.data) {
                    setPostPurchaseTemplate(templateRes.data);
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
            setError(err.message || 'Failed to save settings.');
        } finally {
            setIsSaving(false);
        }
    };

    const addSocialLink = () => {
        if (!profile) return;
        if (profile.socialLinks.length >= 5) return;
        setProfile({
            ...profile,
            socialLinks: [...profile.socialLinks, { platform: 'instagram', url: '' }]
        });
    };

    const removeSocialLink = (index: number) => {
        if (!profile) return;
        setProfile({
            ...profile,
            socialLinks: profile.socialLinks.filter((_, i) => i !== index)
        });
    };

    const updateSocialLink = (index: number, field: 'platform' | 'url', value: string) => {
        if (!profile) return;
        const updated = [...profile.socialLinks];
        updated[index] = { ...updated[index], [field]: value };
        setProfile({ ...profile, socialLinks: updated });
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

            <form onSubmit={handleSave} className="space-y-6">

                {/* ── Profile Section ── */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                            <User className="w-5 h-5 text-purple-600" />
                            Profile
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Your public profile information shown on your storefront.
                        </p>
                    </div>

                    {/* Avatar */}
                    <div className="flex items-start gap-6">
                        <div className="shrink-0">
                            {profile?.avatarUrl ? (
                                <img
                                    src={profile.avatarUrl}
                                    alt="Avatar"
                                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center">
                                    <Image className="w-8 h-8 text-purple-400" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Avatar URL</label>
                            <input
                                type="url"
                                value={profile?.avatarUrl || ''}
                                onChange={(e) => setProfile(prev => prev ? { ...prev, avatarUrl: e.target.value } : null)}
                                className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                placeholder="https://example.com/your-photo.jpg"
                            />
                            <p className="mt-1 text-xs text-gray-400">Enter a URL to your profile photo (HTTPS preferred)</p>
                        </div>
                    </div>

                    {/* Display Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                        <input
                            type="text"
                            required
                            maxLength={100}
                            value={profile?.displayName || ''}
                            onChange={(e) => setProfile(prev => prev ? { ...prev, displayName: e.target.value } : null)}
                            className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                            placeholder="Your creator name"
                        />
                    </div>

                    {/* Bio */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                        <textarea
                            rows={3}
                            maxLength={160}
                            value={profile?.bio || ''}
                            onChange={(e) => setProfile(prev => prev ? { ...prev, bio: e.target.value } : null)}
                            className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                            placeholder="A short bio about you and what you create..."
                        />
                        <p className="mt-1 text-xs text-gray-400 text-right">{profile?.bio?.length || 0}/160</p>
                    </div>

                    {/* Social Links */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Social Links</label>
                                <p className="text-xs text-gray-400">Add up to 5 social media links to your store</p>
                            </div>
                            {(profile?.socialLinks?.length || 0) < 5 && (
                                <button
                                    type="button"
                                    onClick={addSocialLink}
                                    className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-medium"
                                >
                                    <Plus className="w-4 h-4" /> Add Link
                                </button>
                            )}
                        </div>
                        <div className="space-y-3">
                            {profile?.socialLinks?.map((link, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <select
                                        value={link.platform}
                                        onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                                        className="w-40 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                                    >
                                        {PLATFORMS.map((p) => (
                                            <option key={p.id} value={p.id}>{p.label}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="url"
                                        value={link.url}
                                        onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                                        className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                        placeholder="https://instagram.com/yourhandle"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeSocialLink(index)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {(!profile?.socialLinks || profile.socialLinks.length === 0) && (
                                <p className="text-sm text-gray-400 italic py-2">No social links added yet.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Storefront Design Section ── */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                    <h2 className="text-xl font-semibold text-gray-800">Storefront Design</h2>
                    <p className="text-sm text-gray-500">
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

                {/* ── Email Automations Section ── */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                    <h2 className="text-xl font-semibold text-gray-800">Email Automations</h2>
                    <p className="text-sm text-gray-500">
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

                {/* Save Button */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-sm font-medium"
                    >
                        {isSaving ? (
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        ) : (
                            <Save className="w-5 h-5 mr-2" />
                        )}
                        Save All Settings
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SettingsPage;

