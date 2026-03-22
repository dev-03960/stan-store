import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { getPresignedUrl, uploadFileToUrl } from '../../lib/api/products';
import { Loader2, Save, Plus, Trash2, User, Image, Palette, Type, Layout, Upload, Smartphone } from 'lucide-react';
import ImageCropperModal from '../../components/dashboard/ImageCropperModal';

interface SocialLink {
    platform: string;
    url: string;
}

interface ProfileResponse {
    displayName: string;
    bio: string;
    avatarUrl: string;
    theme: string;
    brandColor: string;
    fontFamily: string;
    coverPhotoUrl: string;
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

const THEMES = [
    { id: 'minimal', name: 'Clean', desc: 'Light & modern', bgClass: 'bg-white', textClass: 'text-gray-900', borderClass: 'border-gray-200', accent: '#6C5CE7' },
    { id: 'bold', name: 'Bold Dark', desc: 'Dark navy', bgClass: 'bg-[#1a1a2e]', textClass: 'text-white', borderClass: 'border-[#2a2a4a]', accent: '#00d4ff' },
    { id: 'gradient', name: 'Vibrant', desc: 'Purple-pink gradient', bgClass: 'bg-gradient-to-br from-[#eef1ff] to-pink-100', textClass: 'text-[#3d4eaa]', borderClass: 'border-[#6786f540]', accent: '#d23669' },
    { id: 'warm', name: 'Warm Earth', desc: 'Cream & terracotta', bgClass: 'bg-[#f5f0e8]', textClass: 'text-[#5c4a3d]', borderClass: 'border-[#e2d5c4]', accent: '#c97b3d' },
    { id: 'ocean', name: 'Ocean', desc: 'Deep navy & teal', bgClass: 'bg-[#0a192f]', textClass: 'text-[#ccd6f6]', borderClass: 'border-[#1d3461]', accent: '#64ffda' },
    { id: 'neon', name: 'Neon Pop', desc: 'Dark & vivid', bgClass: 'bg-[#0d0d0d]', textClass: 'text-[#f0f0f0]', borderClass: 'border-[#2a2a2a]', accent: '#39ff14' },
];

const FONTS = [
    { id: 'Inter', name: 'Inter', sample: 'The quick brown fox' },
    { id: 'Outfit', name: 'Outfit', sample: 'The quick brown fox' },
    { id: 'Poppins', name: 'Poppins', sample: 'The quick brown fox' },
    { id: 'Libre Baskerville', name: 'Libre Baskerville', sample: 'The quick brown fox' },
    { id: 'Playfair Display', name: 'Playfair Display', sample: 'The quick brown fox' },
    { id: 'Space Grotesk', name: 'Space Grotesk', sample: 'The quick brown fox' },
];

// --------------- Mobile Preview Component ---------------
const MobilePreview: React.FC<{ profile: ProfileResponse | null }> = ({ profile }) => {
    const theme = THEMES.find(t => t.id === profile?.theme) || THEMES[0];
    const brandColor = profile?.brandColor || theme.accent;

    return (
        <div className="w-[280px] h-[560px] bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl relative flex-shrink-0">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-gray-900 rounded-b-2xl z-10" />
            {/* Screen */}
            <div
                className={`w-full h-full rounded-[2rem] overflow-hidden overflow-y-auto ${theme.bgClass} ${theme.textClass}`}
                data-theme={profile?.theme || 'minimal'}
                style={{
                    backgroundColor: profile?.theme !== 'gradient' ? 'var(--theme-bg)' : undefined,
                    fontFamily: profile?.fontFamily || 'Inter',
                }}
            >
                {/* Cover Photo */}
                {profile?.coverPhotoUrl ? (
                    <div className="w-full h-24 overflow-hidden">
                        <img src={profile.coverPhotoUrl} alt="Cover" className="w-full h-full object-cover" />
                    </div>
                ) : (
                    <div className="w-full h-16" style={{ background: `linear-gradient(135deg, ${brandColor}33, ${brandColor}11)` }} />
                )}

                {/* Profile Section */}
                <div className="flex flex-col items-center text-center px-4 -mt-8 relative z-10">
                    <div className="w-16 h-16 rounded-full border-2 overflow-hidden shadow-md" style={{ borderColor: brandColor }}>
                        {profile?.avatarUrl ? (
                            <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-500 text-lg font-bold">
                                {profile?.displayName?.charAt(0) || 'S'}
                            </div>
                        )}
                    </div>
                    <h3 className="text-sm font-bold mt-2 truncate w-full" style={{ fontFamily: profile?.fontFamily || 'Inter' }}>
                        {profile?.displayName || 'Your Name'}
                    </h3>
                    <p className="text-[10px] opacity-70 mt-0.5 line-clamp-2">
                        {profile?.bio || 'Your bio goes here...'}
                    </p>
                </div>

                {/* Sample Product Cards */}
                <div className="px-3 mt-4 space-y-2 pb-4">
                    {['Digital Product', 'Online Course', '1:1 Coaching'].map((title, i) => (
                        <div
                            key={i}
                            className="rounded-lg p-3 flex items-center gap-2 border transition-all"
                            style={{
                                backgroundColor: 'var(--theme-surface, #fff)',
                                borderColor: 'var(--theme-border, #e5e7eb)',
                            }}
                        >
                            <div
                                className="w-8 h-8 rounded-md flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                                style={{ backgroundColor: brandColor }}
                            >
                                {title.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-semibold truncate">{title}</p>
                                <p className="text-[9px] opacity-50">₹{(i + 1) * 999}</p>
                            </div>
                            <div
                                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] flex-shrink-0"
                                style={{ backgroundColor: brandColor, color: 'var(--theme-button-text, #fff)' }}
                            >
                                →
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --------------- Main SettingsPage ---------------
const SettingsPage = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [profile, setProfile] = useState<ProfileResponse | null>(null);
    const [postPurchaseTemplate, setPostPurchaseTemplate] = useState<EmailTemplateResponse | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [designTab, setDesignTab] = useState<'themes' | 'colors' | 'font'>('themes');

    // File upload states
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);

    // Cropper states
    const [cropperConfig, setCropperConfig] = useState<{
        isOpen: boolean;
        image: string;
        aspect: number;
        shape: 'rect' | 'round';
        type: 'avatar' | 'cover';
    }>({
        isOpen: false,
        image: '',
        aspect: 1,
        shape: 'round',
        type: 'avatar'
    });

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
                        brandColor: profileRes.data.brandColor || '',
                        fontFamily: profileRes.data.fontFamily || 'Inter',
                        coverPhotoUrl: profileRes.data.coverPhotoUrl || '',
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

    const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setCropperConfig({
                isOpen: true,
                image: imageUrl,
                aspect: 1,
                shape: 'round',
                type: 'avatar'
            });
        }
    };

    const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setCropperConfig({
                isOpen: true,
                image: imageUrl,
                aspect: 4 / 1.5, // Standard banner aspect
                shape: 'rect',
                type: 'cover'
            });
        }
    };

    const handleCropComplete = (croppedBlob: Blob) => {
        const fileName = cropperConfig.type === 'avatar' ? 'avatar.jpg' : 'cover.jpg';
        const file = new File([croppedBlob], fileName, { type: 'image/jpeg' });
        const previewUrl = URL.createObjectURL(croppedBlob);

        if (cropperConfig.type === 'avatar') {
            setAvatarFile(file);
            setAvatarPreview(previewUrl);
        } else {
            setCoverFile(file);
            setCoverPreview(previewUrl);
        }

        setCropperConfig(prev => ({ ...prev, isOpen: false }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsSaving(true);

        try {
            let finalProfile = { ...profile };

            // Upload avatar if changed
            if (avatarFile) {
                const presigned = await getPresignedUrl(avatarFile.name, avatarFile.type, 'cover_image');
                await uploadFileToUrl(presigned.url, avatarFile);
                let r2PublicUrl = import.meta.env.VITE_R2_PUBLIC_URL || '';
                if (r2PublicUrl) {
                    r2PublicUrl = r2PublicUrl.replace(/\/$/, '');
                    if (!r2PublicUrl.startsWith('http')) r2PublicUrl = 'https://' + r2PublicUrl;
                }
                finalProfile.avatarUrl = r2PublicUrl ? `${r2PublicUrl}/${presigned.key}` : presigned.url.split('?')[0];
            }

            // Upload cover photo if changed
            if (coverFile) {
                const presigned = await getPresignedUrl(coverFile.name, coverFile.type, 'cover_image');
                await uploadFileToUrl(presigned.url, coverFile);
                let r2PublicUrl = import.meta.env.VITE_R2_PUBLIC_URL || '';
                if (r2PublicUrl) {
                    r2PublicUrl = r2PublicUrl.replace(/\/$/, '');
                    if (!r2PublicUrl.startsWith('http')) r2PublicUrl = 'https://' + r2PublicUrl;
                }
                finalProfile.coverPhotoUrl = r2PublicUrl ? `${r2PublicUrl}/${presigned.key}` : presigned.url.split('?')[0];
            }

            await Promise.all([
                api.put('/creator/profile', finalProfile),
                postPurchaseTemplate && api.put('/creator/email-templates/post_purchase', postPurchaseTemplate)
            ]);
            setSuccess('Settings saved successfully.');
            setAvatarFile(null);
            setCoverFile(null);
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
                <Loader2 className="h-8 w-8 animate-spin text-[#6786f5]" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Store Settings</h1>

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

            <form onSubmit={handleSave}>
                <div className="flex gap-8">
                    {/* Left Column: Settings */}
                    <div className="flex-1 space-y-6 min-w-0">

                        {/* ── Profile Section ── */}
                        <div className="bg-white dark:bg-[#1a1d2b] p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-6">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                                    <User className="w-5 h-5 text-[#6786f5]" />
                                    Profile
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Your public profile information shown on your storefront.
                                </p>
                            </div>

                            {/* Avatar Upload */}
                            <div className="flex items-start gap-6">
                                <div className="shrink-0">
                                    {(avatarPreview || profile?.avatarUrl) ? (
                                        <img
                                            src={avatarPreview || profile?.avatarUrl}
                                            alt="Avatar"
                                            className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                        />
                                    ) : (
                                        <div className="w-20 h-20 rounded-full bg-[#6786f51a] flex items-center justify-center">
                                            <Image className="w-8 h-8 text-[#6786f5]" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Profile Picture</label>
                                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 text-center hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            id="avatar-upload"
                                            onChange={handleAvatarFileChange}
                                        />
                                        <label htmlFor="avatar-upload" className="cursor-pointer flex flex-col items-center">
                                            <Upload className="w-6 h-6 text-gray-400 dark:text-gray-500 mb-1" />
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                {avatarFile ? avatarFile.name : 'Click to upload profile photo'}
                                            </span>
                                            <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">Suggested: 400x400px, under 5MB</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Cover Photo Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cover Photo / Banner</label>
                                {(coverPreview || profile?.coverPhotoUrl) && (
                                    <div className="mb-2 rounded-lg overflow-hidden h-32 bg-gray-100">
                                        <img
                                            src={coverPreview || profile?.coverPhotoUrl}
                                            alt="Cover"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        id="cover-upload"
                                        onChange={handleCoverFileChange}
                                    />
                                    <label htmlFor="cover-upload" className="cursor-pointer flex flex-col items-center">
                                        <Upload className="w-6 h-6 text-gray-400 dark:text-gray-500 mb-1" />
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            {coverFile ? coverFile.name : (profile?.coverPhotoUrl ? 'Change cover photo' : 'Click to upload cover photo')}
                                        </span>
                                        <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">Suggested: 1200x450px (8:3 Ratio)</span>
                                    </label>
                                </div>
                            </div>

                            {/* Display Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Name</label>
                                <input
                                    type="text"
                                    required
                                    maxLength={100}
                                    value={profile?.displayName || ''}
                                    onChange={(e) => setProfile(prev => prev ? { ...prev, displayName: e.target.value } : null)}
                                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 text-sm focus:border-[#6786f5] focus:outline-none focus:ring-1 focus:ring-[#6786f5] bg-white dark:bg-[#0f111a] text-gray-900 dark:text-white"
                                    placeholder="Your creator name"
                                />
                            </div>

                            {/* Bio */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                                <textarea
                                    rows={3}
                                    maxLength={160}
                                    value={profile?.bio || ''}
                                    onChange={(e) => setProfile(prev => prev ? { ...prev, bio: e.target.value } : null)}
                                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 text-sm focus:border-[#6786f5] focus:outline-none focus:ring-1 focus:ring-[#6786f5] bg-white dark:bg-[#0f111a] text-gray-900 dark:text-white"
                                    placeholder="A short bio about you and what you create..."
                                />
                                <p className="mt-1 text-xs text-gray-400 text-right">{profile?.bio?.length || 0}/160</p>
                            </div>

                            {/* Social Links */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Social Links</label>
                                        <p className="text-xs text-gray-400 dark:text-gray-500">Add up to 5 social media links to your store</p>
                                    </div>
                                    {(profile?.socialLinks?.length || 0) < 5 && (
                                        <button
                                            type="button"
                                            onClick={addSocialLink}
                                            className="inline-flex items-center gap-1 text-sm text-[#6786f5] hover:text-[#5570e0] font-medium"
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
                                                className="w-40 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2.5 text-sm focus:border-[#6786f5] focus:outline-none focus:ring-1 focus:ring-[#6786f5] bg-white dark:bg-[#0f111a] text-gray-900 dark:text-white"
                                            >
                                                {PLATFORMS.map((p) => (
                                                    <option key={p.id} value={p.id}>{p.label}</option>
                                                ))}
                                            </select>
                                            <input
                                                type="url"
                                                value={link.url}
                                                onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                                                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 text-sm focus:border-[#6786f5] focus:outline-none focus:ring-1 focus:ring-[#6786f5] bg-white dark:bg-[#0f111a] text-gray-900 dark:text-white"
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
                                        <p className="text-sm text-gray-400 dark:text-gray-500 italic py-2">No social links added yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── Storefront Design Section ── */}
                        <div className="bg-white dark:bg-[#1a1d2b] p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                                    <Layout className="w-5 h-5 text-[#6786f5]" />
                                    Storefront Design
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Personalize the look and feel of your public store page.
                                </p>
                            </div>

                            {/* Tabs */}
                            <div className="flex border-b border-gray-200 dark:border-gray-800">
                                {[
                                    { key: 'themes' as const, label: 'Themes', icon: <Layout className="w-4 h-4" /> },
                                    { key: 'colors' as const, label: 'Colors', icon: <Palette className="w-4 h-4" /> },
                                    { key: 'font' as const, label: 'Font', icon: <Type className="w-4 h-4" /> },
                                ].map(tab => (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => setDesignTab(tab.key)}
                                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${designTab === tab.key
                                                ? 'border-[#6786f5] text-[#6786f5]'
                                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        {tab.icon}
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Tab Content */}
                            {designTab === 'themes' && (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                                    {THEMES.map((theme) => (
                                        <button
                                            key={theme.id}
                                            type="button"
                                            onClick={() => setProfile(prev => prev ? { ...prev, theme: theme.id } : null)}
                                            className={`relative flex flex-col gap-2 p-3 rounded-xl border-2 transition-all text-left ${profile?.theme === theme.id
                                                    ? 'border-[#6786f5] ring-2 ring-[#6786f520] bg-[#6786f50d]'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-[#6786f5] bg-white dark:bg-[#0f111a]'
                                                }`}
                                        >
                                            {/* Theme Mini Preview */}
                                            <div className={`w-full h-20 rounded-lg ${theme.bgClass} ${theme.borderClass} border flex flex-col items-center justify-center gap-1 shadow-sm overflow-hidden`}>
                                                <div className="w-6 h-6 rounded-full bg-gray-400/30" />
                                                <div className="w-12 h-1.5 rounded-full" style={{ backgroundColor: theme.accent }} />
                                                <div className="w-16 h-1 rounded-full bg-gray-400/20" />
                                            </div>
                                            <div>
                                                <span className={`text-sm font-semibold ${profile?.theme === theme.id ? 'text-[#5570e0]' : 'text-gray-800 dark:text-gray-200'}`}>
                                                    {theme.name}
                                                </span>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{theme.desc}</p>
                                            </div>
                                            {profile?.theme === theme.id && (
                                                <div className="absolute top-2 right-2 w-5 h-5 bg-[#6786f5] rounded-full flex items-center justify-center">
                                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {designTab === 'colors' && (
                                <div className="mt-4 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Brand Color</label>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Choose a primary color for buttons, accents, and highlights.</p>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="color"
                                                value={profile?.brandColor || '#6C5CE7'}
                                                onChange={(e) => setProfile(prev => prev ? { ...prev, brandColor: e.target.value } : null)}
                                                className="w-14 h-14 rounded-xl cursor-pointer border-2 border-gray-200 p-1"
                                            />
                                            <div className="flex-1">
                                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Hex Code</label>
                                                <input
                                                    type="text"
                                                    value={profile?.brandColor || '#6C5CE7'}
                                                    onChange={(e) => setProfile(prev => prev ? { ...prev, brandColor: e.target.value } : null)}
                                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f111a] px-4 py-2.5 text-sm font-mono text-gray-900 dark:text-white focus:border-[#6786f5] focus:outline-none focus:ring-1 focus:ring-[#6786f5]"
                                                    placeholder="#6C5CE7"
                                                />
                                            </div>
                                        </div>
                                        {/* Quick preset colors */}
                                        <div className="flex gap-2 mt-3">
                                            {['#6C5CE7', '#00B894', '#E17055', '#0984E3', '#D63384', '#FF6B6B', '#FD79A8', '#2D3436'].map(hex => (
                                                <button
                                                    key={hex}
                                                    type="button"
                                                    onClick={() => setProfile(prev => prev ? { ...prev, brandColor: hex } : null)}
                                                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${profile?.brandColor === hex ? 'border-gray-800 dark:border-white scale-110' : 'border-gray-200 dark:border-gray-700'}`}
                                                    style={{ backgroundColor: hex }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {designTab === 'font' && (
                                <div className="mt-4 space-y-3">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Choose a Font</label>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">This font will be used across your entire storefront.</p>
                                    <div className="space-y-2">
                                        {FONTS.map(font => (
                                            <button
                                                key={font.id}
                                                type="button"
                                                onClick={() => setProfile(prev => prev ? { ...prev, fontFamily: font.id } : null)}
                                                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all flex items-center justify-between ${profile?.fontFamily === font.id
                                                        ? 'border-[#6786f5] bg-[#6786f50d]'
                                                        : 'border-gray-200 dark:border-gray-700 hover:border-[#6786f5] bg-white dark:bg-[#0f111a]'
                                                    }`}
                                            >
                                                <div>
                                                    <span className="text-sm font-medium text-gray-800 dark:text-white">{font.name}</span>
                                                    <p className="text-lg mt-0.5 text-gray-600 dark:text-gray-400" style={{ fontFamily: font.id }}>
                                                        {font.sample}
                                                    </p>
                                                </div>
                                                {profile?.fontFamily === font.id && (
                                                    <div className="w-5 h-5 bg-[#6786f5] rounded-full flex items-center justify-center flex-shrink-0">
                                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── Email Automations Section ── */}
                        <div className="bg-white dark:bg-[#1e2135] p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Email Automations</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Configure automated marketing emails to boost your conversions.
                            </p>

                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm font-medium text-gray-900 dark:text-white">Abandoned Cart Recovery</label>
                                        <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-500/20 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-400 ring-1 ring-inset ring-blue-700/10">Active</span>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Automatically send an email reminder to buyers who leave items in their cart for more than 1 hour.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setProfile(prev => prev ? { ...prev, abandonedCartEnabled: !prev.abandonedCartEnabled } : null)}
                                    className={`${profile?.abandonedCartEnabled ? 'bg-[#6786f5]' : 'bg-gray-200 dark:bg-gray-800'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                                    role="switch"
                                    aria-checked={profile?.abandonedCartEnabled}
                                >
                                    <span
                                        aria-hidden="true"
                                        className={`${profile?.abandonedCartEnabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                                    />
                                </button>
                            </div>

                            {/* Post-Purchase Follow-Up */}
                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <label className="text-sm font-medium text-gray-900 dark:text-white">Automated Follow-Up (Post-Purchase)</label>
                                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${postPurchaseTemplate?.isActive ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 ring-blue-700/10' : 'bg-gray-50 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400 ring-gray-500/10'}`}>
                                                {postPurchaseTemplate?.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            Send a customizable email to customers a few days after their purchase.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setPostPurchaseTemplate(prev => prev ? { ...prev, isActive: !prev.isActive } : null)}
                                        className={`${postPurchaseTemplate?.isActive ? 'bg-[#6786f5]' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
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
                                    <div className="mt-5 space-y-4 pl-4 border-l-2 border-[#6786f520]">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Delay Duration (Days)</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="30"
                                                value={postPurchaseTemplate.delayDays}
                                                onChange={(e) => setPostPurchaseTemplate(prev => prev ? { ...prev, delayDays: parseInt(e.target.value) || 1 } : null)}
                                                className="mt-1 block w-32 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f111a] px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-[#6786f5] focus:outline-none focus:ring-1 focus:ring-[#6786f5]"
                                            />
                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Number of days to wait after a purchase before sending</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Subject</label>
                                            <input
                                                type="text"
                                                value={postPurchaseTemplate.subject}
                                                onChange={(e) => setPostPurchaseTemplate(prev => prev ? { ...prev, subject: e.target.value } : null)}
                                                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f111a] px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-[#6786f5] focus:outline-none focus:ring-1 focus:ring-[#6786f5]"
                                            />
                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Supports variables: {'{product_title}'}, {'{creator_name}'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Body (HTML/Text)</label>
                                            <textarea
                                                rows={6}
                                                value={postPurchaseTemplate.bodyHtml}
                                                onChange={(e) => setPostPurchaseTemplate(prev => prev ? { ...prev, bodyHtml: e.target.value } : null)}
                                                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f111a] px-3 py-2 text-sm text-gray-900 dark:text-white font-mono focus:border-[#6786f5] focus:outline-none focus:ring-1 focus:ring-[#6786f5]"
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
                                className="flex items-center px-6 py-2.5 bg-[#6786f5] text-white rounded-lg hover:bg-[#5570e0] disabled:opacity-50 transition-colors shadow-sm font-medium"
                            >
                                {isSaving ? (
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                ) : (
                                    <Save className="w-5 h-5 mr-2" />
                                )}
                                Save All Settings
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Mobile Preview */}
                    <div className="hidden lg:block sticky top-8 self-start">
                        <div className="flex flex-col items-center gap-3">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                                <Smartphone className="w-4 h-4" />
                                Live Preview
                            </div>
                            <MobilePreview
                                profile={profile ? {
                                    ...profile,
                                    avatarUrl: avatarPreview || profile.avatarUrl,
                                    coverPhotoUrl: coverPreview || profile.coverPhotoUrl,
                                } : null}
                            />
                        </div>
                    </div>
                </div>
            </form>

            <ImageCropperModal
                isOpen={cropperConfig.isOpen}
                onClose={() => setCropperConfig(prev => ({ ...prev, isOpen: false }))}
                image={cropperConfig.image}
                aspect={cropperConfig.aspect}
                shape={cropperConfig.shape}
                onCropComplete={handleCropComplete}
            />
        </div>
    );
};

export default SettingsPage;
