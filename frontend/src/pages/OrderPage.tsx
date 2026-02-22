import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getOrder, getOrderDownloadUrl } from '../features/orders/api';
import { CheckCircle, Download, FileText, Loader2, AlertCircle, Calendar } from 'lucide-react';

const OrderPage: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();

    const { data: order, isLoading, error } = useQuery({
        queryKey: ['order', orderId],
        queryFn: () => getOrder(orderId!),
        enabled: !!orderId,
        retry: 1
    });

    const handleDownload = async (productId?: string) => {
        try {
            const url = await getOrderDownloadUrl(orderId!, productId);
            window.open(url, '_blank');
        } catch (err) {
            console.error('Download failed', err);
            alert('Failed to generate download link. Please try again.');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Order Not Found</h1>
                <p className="text-slate-600 mb-6">We couldn't find the order you're looking for.</p>
                <Link to="/" className="text-indigo-600 hover:text-indigo-800 font-medium">
                    Return to Home
                </Link>
            </div>
        );
    }

    const isPaid = order.status === 'paid';

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Header */}
                <div className={`p-8 text-center ${isPaid ? 'bg-green-50' : 'bg-yellow-50'}`}>
                    <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${isPaid ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                        {isPaid ? <CheckCircle className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">
                        {isPaid ? 'Payment Successful!' : 'Payment Pending'}
                    </h1>
                    <p className="text-slate-600">
                        Order ID: <span className="font-mono text-slate-800">{order.razorpay_order_id}</span>
                    </p>
                </div>

                {/* Content */}
                <div className="p-8 space-y-8">
                    {/* Purchased Items */}
                    <div>
                        <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-4">Purchased Items</h2>
                        <div className="space-y-4">
                            {(() => {
                                const items = order.line_items?.length ? order.line_items : (order.product ? [{ ...order.product, product_id: order.product_id, amount: order.product.price }] : []);
                                return items.map((item, idx) => (
                                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 shrink-0">
                                                {item.product_type === 'booking' ? <Calendar className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900">{item.title || 'Digital Product'}</p>
                                                <p className="text-sm text-slate-500">
                                                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: order.currency }).format(item.amount / 100)}
                                                </p>
                                            </div>
                                        </div>
                                        {isPaid && (
                                            <div className="w-full sm:w-auto mt-2 sm:mt-0">
                                                {item.product_type === 'booking' ? (
                                                    <div className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-100 text-center">
                                                        <span className="font-medium mr-1">✅ Booked</span>
                                                        {order.booking_slot_start && (
                                                            <span className="block text-xs mt-1 text-green-600 font-medium">
                                                                {new Date(order.booking_slot_start).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleDownload(item.product_id)}
                                                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-5 rounded-lg transition-colors text-sm shadow-sm"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                        Download
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>

                    {!isPaid && (
                        <div className="text-center p-4 bg-yellow-50 rounded-xl text-yellow-800 text-sm">
                            Your payment is being processed. Please check back later or check your email for confirmation.
                        </div>
                    )}

                    {/* Customer Details */}
                    <div>
                        <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-4">Receipt Sent To</h2>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-700">
                            <p className="font-medium text-slate-900">{order.customer_name}</p>
                            <p>{order.customer_email}</p>
                        </div>
                    </div>

                    <div className="text-center">
                        <Link to="/" className="text-sm text-slate-500 hover:text-indigo-600 transition-colors">
                            Return to Store
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderPage;
