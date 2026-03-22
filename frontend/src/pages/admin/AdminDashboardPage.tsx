import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getPlatformMetrics, type PlatformMetrics } from '../../features/admin/api';
import { LayoutDashboard, Users, CreditCard, ShoppingBag, Activity } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const AdminDashboardPage: React.FC = () => {
    const { user, isLoading } = useAuth();
    const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
    const [loadingMetrics, setLoadingMetrics] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchMetrics();
        }
    }, [user]);

    const fetchMetrics = async () => {
        try {
            setLoadingMetrics(true);
            const data = await getPlatformMetrics();
            setMetrics(data);
        } catch (err) {
            setError('Failed to load metrics');
            console.error(err);
        } finally {
            setLoadingMetrics(false);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    if (!user || user.role !== 'admin') {
        return <Navigate to="/dashboard" replace />;
    }

    const StatCard = ({ title, value, icon: Icon, color }: any) => (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="text-2xl font-semibold mt-1">{value}</p>
                </div>
                <div className={`p-3 rounded-full ${color}`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Admin Header */}
            <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <LayoutDashboard className="w-5 h-5 text-indigo-600" />
                        Platform Admin
                    </h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">Welcome, {user.displayName}</span>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {loadingMetrics ? (
                    <div className="text-center py-10">Loading metrics...</div>
                ) : metrics ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Total Users"
                            value={metrics.total_users}
                            icon={Users}
                            color="bg-blue-500"
                        />
                        <StatCard
                            title="Total Revenue"
                            value={`₹${(metrics.total_revenue / 100).toLocaleString()}`}
                            icon={CreditCard}
                            color="bg-green-500"
                        />
                        <StatCard
                            title="Total Orders"
                            value={metrics.total_orders}
                            icon={ShoppingBag}
                            color="bg-[#6786f5]"
                        />
                        <StatCard
                            title="Active Creators"
                            value={metrics.active_creators}
                            icon={Activity}
                            color="bg-violet-500"
                        />
                    </div>
                ) : null}

                {/* Admin Quick Actions */}
                <div className="mt-12">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Quick Management</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <a 
                            href="/admin/subscriptions"
                            className="group p-6 bg-white rounded-2xl border border-gray-100 hover:border-amber-500/30 hover:shadow-xl hover:shadow-amber-500/5 transition-all"
                        >
                            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4 group-hover:scale-110 transition-transform">
                                <Users className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-gray-900 mb-1">Subscriptions</h3>
                            <p className="text-sm text-gray-500">Manage platform subscribers, view MRR, and grant access.</p>
                        </a>
                        <a 
                            href="/admin/blogs"
                            className="group p-6 bg-white rounded-2xl border border-gray-100 hover:border-[#6786f5]/30 hover:shadow-xl hover:shadow-[#6786f5]/5 transition-all"
                        >
                            <div className="w-12 h-12 rounded-xl bg-[#6786f5]/10 flex items-center justify-center text-[#6786f5] mb-4 group-hover:scale-110 transition-transform">
                                <Activity className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-gray-900 mb-1">Blog Posts</h3>
                            <p className="text-sm text-gray-500">Create, edit and manage platform blog articles.</p>
                        </a>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboardPage;
