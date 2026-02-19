import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getOrder, getOrderDownloadUrl } from '../features/orders/api';
import { CheckCircle, Download, FileText, Loader2, AlertCircle } from 'lucide-react';

const OrderPage: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();

    const { data: order, isLoading, error } = useQuery({
        queryKey: ['order', orderId],
        queryFn: () => getOrder(orderId!),
        enabled: !!orderId,
        retry: 1
    });

    const handleDownload = async () => {
        try {
            const url = await getOrderDownloadUrl(orderId!);
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
                    {/* Product Details */}
                    <div>
                        <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-4">Purchased Item</h2>
                        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-semibold text-slate-900">{order.product?.title || 'Digital Product'}</p>
                                <p className="text-sm text-slate-500">
                                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: order.currency }).format(order.amount / 100)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Customer Details */}
                    <div>
                        <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-4">Sent To</h2>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-700">
                            <p className="font-medium text-slate-900">{order.customer_name}</p>
                            <p>{order.customer_email}</p>
                        </div>
                    </div>

                    {/* Action */}
                    {isPaid ? (
                        <button
                            onClick={handleDownload}
                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transform hover:-translate-y-1"
                        >
                            <Download className="w-5 h-5" />
                            Download My Product
                        </button>
                    ) : (
                        <div className="text-center p-4 bg-yellow-50 rounded-xl text-yellow-800 text-sm">
                            Your payment is being processed. Please check back later or check your email for confirmation.
                        </div>
                    )}

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
