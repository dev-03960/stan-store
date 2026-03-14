import React, { useEffect, useState } from 'react';
import { getSalesHistory } from '../../features/dashboard/api';
import type { Order } from '../../features/dashboard/api';

const OrdersPage: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const data = await getSalesHistory();
                setOrders(data);
            } catch (err) {
                setError('Failed to load orders');
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    if (loading) return <div className="dark:text-gray-400">Loading orders...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Orders</h1>

            <div className="bg-white dark:bg-[#1e2135] rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
                        <thead className="bg-gray-50 dark:bg-[#0f111a] text-gray-900 dark:text-gray-200 font-medium">
                            <tr>
                                <th className="px-6 py-3">Order ID</th>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Customer</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {orders.length > 0 ? (
                                orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                                        <td className="px-6 py-4 font-mono text-xs text-gray-500 dark:text-gray-400">
                                            {order.id.substring(order.id.length - 8)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap dark:text-gray-300">
                                            {new Date(order.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900 dark:text-white">{order.customer_name}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">{order.customer_email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-400 capitalize">
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">
                                            ₹{(order.amount / 100).toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                        No orders found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default OrdersPage;
