import React, { useState } from 'react';
import { X, Loader2, Lock } from 'lucide-react';
import { createOrder, verifyPayment } from '../../features/orders/api';
import { loadRazorpay } from '../../lib/razorpay';
import type { Product } from '../../lib/api/store';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, product }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const isLoaded = await loadRazorpay();
            if (!isLoaded) {
                throw new Error('Razorpay SDK failed to load. Are you online?');
            }

            const orderData = await createOrder({
                product_id: product.id,
                customer_name: name,
                customer_email: email,
            });

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID, // Ensure env var is set
                amount: orderData.amount,
                currency: orderData.currency,
                name: "Stan Store Clone",
                description: `Purchase: ${product.title}`,
                order_id: orderData.razorpay_order_id,
                handler: async function (response: any) {
                    try {
                        await verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });
                    } catch (err) {
                        console.error('Payment verification failed:', err);
                    }
                    window.location.href = `/orders/${orderData.id}`;
                },
                prefill: {
                    name: name,
                    email: email,
                },
                theme: {
                    color: "#2563eb",
                },
            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.open();

        } catch (err: any) {
            console.error("Payment Error:", err);
            setError(err.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">Secure Checkout</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Product Summary */}
                <div className="p-4 bg-gray-50 border-b border-gray-100 flex gap-4">
                    {product.image_url && (
                        <img src={product.image_url} alt={product.title} className="w-16 h-16 object-cover rounded-lg" />
                    )}
                    <div>
                        <h3 className="font-medium text-gray-900 line-clamp-1">{product.title}</h3>
                        <p className="text-sm text-gray-500 line-clamp-1">{product.description}</p>
                        <p className="font-bold text-gray-900 mt-1">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(product.price / 100)}
                        </p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handlePayment} className="p-4 space-y-4">
                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            id="name"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="John Doe"
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="john@example.com"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                        {loading ? 'Processing...' : `Pay ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(product.price / 100)}`}
                    </button>

                    <p className="text-xs text-center text-gray-400 flex items-center justify-center gap-1">
                        <Lock className="w-3 h-3" /> Secured by Razorpay
                    </p>
                </form>
            </div>
        </div>
    );
};

export default CheckoutModal;
