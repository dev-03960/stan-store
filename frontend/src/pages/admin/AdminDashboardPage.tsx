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
                            color="bg-purple-500"
                        />
                        <StatCard
                            title="Active Creators"
                            value={metrics.active_creators}
                            icon={Activity}
                            color="bg-orange-500"
                        />
                    </div>
                ) : null}
            </main>
        </div>
    );
};

export default AdminDashboardPage;
