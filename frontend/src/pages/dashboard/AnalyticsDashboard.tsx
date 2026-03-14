import React, { useState } from 'react';
import { useAnalytics } from '../../features/analytics/api';
import {
    Users,
    MousePointerClick,
    Banknote,
    Eye,
    TrendingUp,
    Copy
} from 'lucide-react';
import { formatPrice } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

const PERIODS = [
    { value: 'today', label: 'Today' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: 'all', label: 'All Time' }
];

const AnalyticsDashboard: React.FC = () => {
    const { user } = useAuth();
    const [period, setPeriod] = useState('7d');

    const { data: metrics, isLoading, error } = useAnalytics(period);

    const storeUrl = `${window.location.origin}/store/${user?.username}`;

    const copyStoreLink = () => {
        navigator.clipboard.writeText(storeUrl);
        alert('Store link copied to clipboard!');
    };

    if (isLoading) return <div className="p-8 text-gray-500">Loading your analytics...</div>;
    if (error) return <div className="p-8 text-red-500">Failed to load analytics data.</div>;

    // Empty state if literally 0 visitors
    if (!metrics || metrics.unique_visitors === 0) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
                <div className="p-12 text-center bg-white dark:bg-[#1a1d2b] rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <TrendingUp size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No visits yet</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                        Start sharing your store link with your audience to track visits, conversions, and sales here.
                    </p>
                    <button
                        onClick={copyStoreLink}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <Copy size={18} />
                        Copy Store Link
                    </button>
                </div>
            </div>
        );
    }

    // Calculate funnel percentages based on the step before it
    const productViewRate = metrics.unique_visitors > 0
        ? Math.round((metrics.product_views / metrics.unique_visitors) * 100)
        : 0;

    const checkoutRate = metrics.product_views > 0
        ? Math.round((metrics.checkout_starts / metrics.product_views) * 100)
        : 0;

    const purchaseRate = metrics.checkout_starts > 0
        ? Math.round((metrics.purchases / metrics.checkout_starts) * 100)
        : 0;

    const totalConversionRate = metrics.unique_visitors > 0
        ? ((metrics.purchases / metrics.unique_visitors) * 100).toFixed(1)
        : '0.0';

    return (
        <div className="space-y-6 pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>

                {/* Period Selector */}
                <div className="flex bg-white dark:bg-[#1e2135] rounded-lg p-1 border border-gray-200 dark:border-gray-800 shadow-sm">
                    {PERIODS.map(p => (
                        <button
                            key={p.value}
                            onClick={() => setPeriod(p.value)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${period === p.value
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'
                                }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Top Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#1a1d2b] p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Unique Visitors</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{metrics.unique_visitors}</h3>
                        </div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
                            <Users size={20} />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1a1d2b] p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Page Views</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{metrics.page_views}</h3>
                        </div>
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
                            <Eye size={20} />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1a1d2b] p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Checkout Starts</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{metrics.checkout_starts}</h3>
                        </div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
                            <MousePointerClick size={20} />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1a1d2b] p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatPrice(metrics.revenue)}</h3>
                        </div>
                        <div className="p-3 bg-green-50 dark:bg-green-500/10 rounded-lg text-green-600 dark:text-green-400">
                            <Banknote size={20} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Funnel Chart Section */}
            <div className="bg-white dark:bg-[#1a1d2b] p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 mt-6">
                <div className="mb-6 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Store Funnel</h2>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-3 py-1 rounded-full border border-green-200 dark:border-green-800">
                        {totalConversionRate}% Conversion Rate
                    </span>
                </div>

                <div className="space-y-6">
                    {/* Step 1: Visitors */}
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Unique Visitors</span>
                            <span className="font-bold text-gray-900 dark:text-white">{metrics.unique_visitors}</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-8 overflow-hidden relative">
                            <div
                                className="bg-blue-500 h-8 rounded-full transition-all duration-1000"
                                style={{ width: '100%' }}
                            ></div>
                        </div>
                    </div>

                    {/* Step 2: Product Views */}
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Viewed Products</span>
                            <span className="font-bold text-gray-900 dark:text-white">{metrics.product_views} <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">({productViewRate}%)</span></span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-8 overflow-hidden relative">
                            <div
                                className="bg-indigo-500 h-8 rounded-full transition-all duration-1000"
                                style={{ width: `${Math.max(productViewRate, 2)}%` }} // min 2% so the color shows slightly
                            ></div>
                        </div>
                    </div>

                    {/* Step 3: Checkout Starts */}
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Started Checkout</span>
                            <span className="font-bold text-gray-900 dark:text-white">{metrics.checkout_starts} <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">({checkoutRate}%)</span></span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-8 overflow-hidden relative">
                            <div
                                className="bg-blue-400 h-8 rounded-full transition-all duration-1000"
                                style={{ width: `${Math.max((metrics.checkout_starts / Math.max(metrics.unique_visitors, 1)) * 100, 2)}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Step 4: Purchases */}
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Purchases</span>
                            <span className="font-bold text-gray-900 dark:text-white">{metrics.purchases} <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">({purchaseRate}%)</span></span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-8 overflow-hidden relative">
                            <div
                                className="bg-green-500 h-8 rounded-full transition-all duration-1000"
                                style={{ width: `${Math.max((metrics.purchases / Math.max(metrics.unique_visitors, 1)) * 100, 2)}%` }}
                            ></div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
