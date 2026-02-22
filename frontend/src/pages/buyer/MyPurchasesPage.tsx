import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, Navigate } from 'react-router-dom';
import { buyerApi } from '../../features/buyer/api';
import type { Order, Subscription } from '../../features/buyer/api';

export default function MyPurchasesPage() {
    const { isAuthenticated, user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState<'purchases' | 'subscriptions'>('purchases');

    const [purchases, setPurchases] = useState<Order[]>([]);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Layout guard
    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    if (user.role !== 'buyer') {
        // Creators trying to access buyer dashboard bounce back to creator dashboard for now
        // A robust system might allow creator -> buyer switching, but this is simpler
        return <Navigate to="/dashboard" replace />;
    }

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                if (activeTab === 'purchases') {
                    const res = await buyerApi.getPurchases();
                    setPurchases(res.data || []);
                } else {
                    const res = await buyerApi.getSubscriptions();
                    setSubscriptions(res.data || []);
                }
            } catch (err: any) {
                setError(err.message || `Failed to load ${activeTab}`);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [activeTab]);

    const handleCancelSubscription = async (subId: string) => {
        if (!window.confirm('Are you sure you want to cancel this subscription? You will lose access at the end of your billing cycle.')) return;

        try {
            await buyerApi.cancelSubscription(subId);
            // Re-fetch
            const res = await buyerApi.getSubscriptions();
            setSubscriptions(res.data || []);
        } catch (err: any) {
            alert(err.message || 'Failed to cancel subscription');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Simple Buyer Navigation */}
            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <span className="text-xl font-bold font-heading text-indigo-600">Stan Store</span>
                            <span className="ml-4 px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-semibold rounded-full">Buyer Account</span>
                        </div>
                        <div className="flex items-center">
                            <span className="text-sm text-gray-500 mr-4">{user.email}</span>
                            <button
                                onClick={logout}
                                className="text-sm text-gray-600 hover:text-gray-900"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">Buyer Dashboard</h1>
                    <div className="flex space-x-1 sm:space-x-2 bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('purchases')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'purchases' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            History & Downloads
                        </button>
                        <button
                            onClick={() => setActiveTab('subscriptions')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'subscriptions' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Active Subscriptions
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                    </div>
                ) : error ? (
                    <div className="bg-red-50 text-red-700 p-4 rounded-md">
                        {error}
                    </div>
                ) : purchases.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div className="mx-auto h-12 w-12 text-gray-400">
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </div>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No purchases found</h3>
                        <p className="mt-1 text-sm text-gray-500">You haven't bought any products yet.</p>
                    </div>
                ) : activeTab === 'purchases' ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {purchases.map((order) => (
                            <div key={order.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                                <div className="p-6 flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                                        {/* Fallback to legacy structure if LineItems is missing */}
                                        {order.line_items && order.line_items.length > 0 ? order.line_items[0].title : `Order #${order.id.substring(0, 8)}`}
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Purchased {new Date(order.created_at).toLocaleDateString()}
                                    </p>

                                    <div className="mt-4">
                                        {order.line_items && order.line_items.length > 0 && order.line_items[0].product_type === 'download' ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                Digital Download
                                            </span>
                                        ) : order.line_items && order.line_items.length > 0 && order.line_items[0].product_type === 'course' ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                Course / Membership
                                            </span>
                                        ) : order.line_items && order.line_items.length > 0 && order.line_items[0].product_type === 'lead_magnet' ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Lead Magnet
                                            </span>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                                    {order.line_items && order.line_items.length > 0 && (order.line_items[0].product_type === 'download' || order.line_items[0].product_type === 'lead_magnet') && (
                                        <a
                                            href={`http://localhost:8080/api/v1/orders/${order.id}/download`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition"
                                        >
                                            Download Access
                                        </a>
                                    )}
                                    {order.line_items && order.line_items.length > 0 && order.line_items[0].product_type === 'course' && (
                                        <Link
                                            to={`/course-player/${order.line_items[0].product_id}`}
                                            className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 transition"
                                        >
                                            Open Course
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4 max-w-4xl mx-auto">
                        {subscriptions.map((sub) => (
                            <div key={sub.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-lg font-semibold text-gray-900 relative">
                                            {sub.product_title || `Subscription`}
                                        </h3>
                                        {sub.status === 'active' ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Active</span>
                                        ) : sub.status === 'cancelled' ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">Cancelled</span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 capitalize">{sub.status}</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        Renews on {new Date(sub.end_at).toLocaleDateString()} • ₹{(sub.product_price || 0) / 100} / cycle
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Subscribed: {new Date(sub.start_at).toLocaleDateString()}
                                    </p>
                                </div>

                                {sub.status !== 'cancelled' && (
                                    <button
                                        onClick={() => handleCancelSubscription(sub.id)}
                                        className="inline-flex justify-center items-center px-4 py-2 border border-red-200 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                                    >
                                        Cancel Subscription
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
