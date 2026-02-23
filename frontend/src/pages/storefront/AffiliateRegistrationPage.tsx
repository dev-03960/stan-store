import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { registerAffiliate } from '../../features/affiliates/api';
import { useQuery } from '@tanstack/react-query';
import { getStoreByUsername } from '../../lib/api/store';
import { Loader2, Link as LinkIcon, Gift, Copy, Check } from 'lucide-react';
import { ErrorBoundary } from '../../components/ErrorBoundary';

const AffiliateRegistrationContent: React.FC = () => {
    const { username } = useParams<{ username: string }>();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [referralCode, setReferralCode] = useState('');
    const [copied, setCopied] = useState(false);

    // Fetch the creator to get their ID for registration
    const { data: storeData, isLoading: storeLoading } = useQuery({
        queryKey: ['store', username],
        queryFn: () => getStoreByUsername(username!),
        enabled: !!username,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!storeData?.creator?.id) {
            setError('Creator not found');
            return;
        }

        setLoading(true);
        try {
            const res = await registerAffiliate({
                creator_id: storeData.creator.id,
                email,
                name
            });
            setReferralCode(res.referral_code);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to register as an affiliate. You may already be registered with this email.');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    if (storeLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!storeData) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold mb-2">Store not found</h1>
                <p className="text-gray-600">The store you are looking for does not exist.</p>
                <button
                    onClick={() => navigate('/')}
                    className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                    Go Home
                </button>
            </div>
        );
    }

    const { creator } = storeData;
    const storeUrl = `${window.location.origin}/store/${username}`;
    const referralLink = `${storeUrl}?ref=${referralCode}`;

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                {/* Header Profile Area */}
                <div className="bg-indigo-600 px-6 py-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Gift className="w-32 h-32" />
                    </div>
                    <div className="relative z-10 flex flex-col items-center">
                        {creator.avatarUrl ? (
                            <img src={creator.avatarUrl} alt={creator.displayName} className="w-20 h-20 rounded-full border-4 border-white object-cover" />
                        ) : (
                            <div className="w-20 h-20 rounded-full border-4 border-white bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl">
                                {creator.displayName.charAt(0)}
                            </div>
                        )}
                        <h2 className="mt-4 text-white text-xl font-bold">Partner with {creator.displayName}</h2>
                        <p className="text-indigo-100 text-sm mt-1">Earn commissions by referring sales to their products.</p>
                    </div>
                </div>

                <div className="p-6 sm:p-8">
                    {referralCode ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex flex-col items-center justify-center mx-auto mb-4">
                                <Check className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">You're Approved!</h3>
                            <p className="text-gray-600 mb-6 text-sm">
                                Share the link below with your audience. Any purchases made through this link will earn you a commission.
                            </p>

                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 relative group">
                                <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wide">Your Unique Link</p>
                                <div className="text-sm font-mono text-gray-800 break-all pr-10">
                                    {referralLink}
                                </div>
                                <button
                                    onClick={() => copyToClipboard(referralLink)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-indigo-600 transition-colors rounded-md hover:bg-indigo-50"
                                    title="Copy to clipboard"
                                >
                                    {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                                </button>
                            </div>

                            <button
                                onClick={() => navigate(`/store/${username}`)}
                                className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                            >
                                Visit Storefront
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="p-4 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                    Full Name
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                                    placeholder="Jane Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                                    placeholder="jane@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed items-center gap-2"
                            >
                                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                Generate Tracking Link
                                <LinkIcon className="w-4 h-4" />
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function AffiliateRegistrationPage() {
    return (
        <ErrorBoundary>
            <AffiliateRegistrationContent />
        </ErrorBoundary>
    );
}
