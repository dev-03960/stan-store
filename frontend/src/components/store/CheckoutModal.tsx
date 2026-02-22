import React, { useState, useEffect } from 'react';
import { X, Loader2, Lock, Tag, CheckCircle2, Calendar } from 'lucide-react';
import { createOrder, verifyPayment, getAvailableSlots } from '../../features/orders/api';
import { api } from '../../lib/api';
import { loadRazorpay } from '../../lib/razorpay';
import { formatPrice } from '../../lib/utils';
import type { Product } from '../../lib/api/store';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product;
    allProducts?: Product[];
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, product, allProducts }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Coupon State
    const [showCouponInput, setShowCouponInput] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState('');
    const [discountAmount, setDiscountAmount] = useState(0);
    const [validatingCoupon, setValidatingCoupon] = useState(false);
    const [couponError, setCouponError] = useState('');

    // Booking State
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<string>('');
    const [loadingSlots, setLoadingSlots] = useState(false);

    // Bump State
    const [bumpAccepted, setBumpAccepted] = useState(false);

    const bumpProduct = React.useMemo(() => {
        if (!product.bump?.bump_product_id || !allProducts) return null;
        return allProducts.find(p => p.id === product.bump!.bump_product_id) || null;
    }, [product, allProducts]);

    useEffect(() => {
        if (product.product_type !== 'booking' || !isOpen) return;

        const fetchSlots = async () => {
            setLoadingSlots(true);
            try {
                const slots = await getAvailableSlots(product.id, selectedDate);
                setAvailableSlots(slots);
                setSelectedSlot('');
            } catch (err) {
                console.error('Failed to fetch slots:', err);
                setAvailableSlots([]);
            } finally {
                setLoadingSlots(false);
            }
        };

        fetchSlots();
    }, [product.id, product.product_type, isOpen, selectedDate]);

    // Recalculate amounts
    const baseAmount = Math.max(0, product.price - discountAmount);
    const bumpAmount = bumpAccepted && bumpProduct && product.bump
        ? Math.max(0, bumpProduct.price - product.bump.bump_discount)
        : 0;
    const finalAmount = baseAmount + bumpAmount;

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

            // TODO: We need to update createOrder to also accept coupon_code,
            // but the backend `CreateOrder` handler doesn't accept it yet.
            // Wait, looking at the plan: "Update the Razorpay order creation payload to pass the applied coupon code".
            // Since `CreateOrder` backend only accepts `ProductID`, `CustomerName`, `CustomerEmail`, `BumpAccepted`
            // Let's pass `couponCode: appliedCoupon` and we will update `api.ts` `createOrder` right after this.
            const orderData = await createOrder({
                product_id: product.id,
                customer_name: name,
                customer_email: email,
                coupon_code: appliedCoupon || undefined,
                booking_slot_start: selectedSlot || undefined,
                bump_accepted: bumpAccepted,
            });

            const options: any = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID, // Ensure env var is set
                amount: orderData.amount,
                currency: orderData.currency,
                name: "Stan Store Clone",
                description: `Purchase: ${product.title}`,
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

            if (orderData.razorpay_order_id.startsWith('sub_')) {
                options.subscription_id = orderData.razorpay_order_id;
            } else {
                options.order_id = orderData.razorpay_order_id;
            }

            const paymentObject = new window.Razorpay(options);
            paymentObject.open();

        } catch (err: any) {
            console.error("Payment Error:", err);
            setError(err.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;

        setValidatingCoupon(true);
        setCouponError('');

        try {
            const res = await api.post<{ discount_amount: number }>('/coupons/validate', {
                code: couponCode.trim().toUpperCase(),
                product_id: product.id
            });

            if (res.data) {
                setDiscountAmount(res.data.discount_amount);
                setAppliedCoupon(couponCode.trim().toUpperCase());
                setShowCouponInput(false);
            }
        } catch (err: any) {
            setCouponError(err.message || 'Invalid or expired coupon');
            setDiscountAmount(0);
            setAppliedCoupon('');
        } finally {
            setValidatingCoupon(false);
        }
    };

    const removeCoupon = () => {
        setAppliedCoupon('');
        setCouponCode('');
        setDiscountAmount(0);
        setCouponError('');
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
                        <div className="mt-1 flex items-baseline gap-2 text-sm sm:text-base">
                            {discountAmount > 0 ? (
                                <>
                                    <span className="font-bold text-gray-900">{formatPrice(finalAmount)}</span>
                                    <span className="text-gray-400 line-through text-xs sm:text-sm">{formatPrice(product.price)}</span>
                                </>
                            ) : (
                                <span className="font-bold text-gray-900">{formatPrice(product.price)}</span>
                            )}
                            {product.product_type === 'membership' && (
                                <span className="text-gray-500 font-normal ml-0.5">
                                    /{product.subscription_interval === 'yearly' ? 'year' : 'mo'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Coupon Section */}
                <div className="px-4 py-3 bg-white border-b border-gray-100">
                    {appliedCoupon ? (
                        <div className="flex items-center justify-between p-2.5 bg-green-50 rounded-lg border border-green-100">
                            <div className="flex items-center gap-2 text-green-700">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-sm font-medium">{appliedCoupon} applied</span>
                            </div>
                            <button
                                type="button"
                                onClick={removeCoupon}
                                className="text-xs text-green-700 hover:text-green-800 underline"
                            >
                                Remove
                            </button>
                        </div>
                    ) : (
                        <div>
                            {!showCouponInput ? (
                                <button
                                    type="button"
                                    onClick={() => setShowCouponInput(true)}
                                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
                                >
                                    <Tag className="w-4 h-4" /> Have a coupon code?
                                </button>
                            ) : (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                            placeholder="Enter code"
                                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none uppercase"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleApplyCoupon}
                                            disabled={validatingCoupon || !couponCode.trim()}
                                            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
                                        >
                                            {validatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                                        </button>
                                    </div>
                                    {couponError && <p className="mt-1.5 text-xs text-red-600">{couponError}</p>}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Booking Slot Selection */}
                {product.product_type === 'booking' && (
                    <div className="p-4 border-b border-gray-100 bg-white space-y-3">
                        <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Calendar className="w-4 h-4" /> Select Date & Time
                        </label>
                        <input
                            type="date"
                            min={new Date().toISOString().split('T')[0]}
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        />

                        <div>
                            {loadingSlots ? (
                                <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
                            ) : availableSlots.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-2 bg-gray-50 rounded-lg">No slots available on this date.</p>
                            ) : (
                                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                                    {availableSlots.map((slot) => {
                                        const d = new Date(slot);
                                        const timeString = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                        return (
                                            <button
                                                key={slot}
                                                type="button"
                                                onClick={() => setSelectedSlot(slot)}
                                                className={`py-2 px-1 text-sm rounded-lg border transition-colors ${selectedSlot === slot ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50 text-gray-700'}`}
                                            >
                                                {timeString}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Order Bump */}
                {bumpProduct && product.bump && (
                    <div className="p-4 mx-4 mt-4 border-2 border-dashed border-indigo-200 bg-indigo-50 rounded-xl relative overflow-hidden transition-all duration-200 hover:border-indigo-300">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <div className="pt-1">
                                <input
                                    type="checkbox"
                                    checked={bumpAccepted}
                                    onChange={(e) => setBumpAccepted(e.target.checked)}
                                    className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                                />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="bg-indigo-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm tracking-wider">
                                        Limited Time Offer
                                    </span>
                                </div>
                                <h4 className="font-semibold text-gray-900 text-sm">Yes, add {bumpProduct.title}</h4>
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{bumpProduct.description}</p>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <span className="font-bold text-gray-900 text-sm">
                                        +{formatPrice(Math.max(0, bumpProduct.price - product.bump.bump_discount))}
                                    </span>
                                    {product.bump.bump_discount > 0 && (
                                        <span className="text-xs text-gray-400 line-through">
                                            {formatPrice(bumpProduct.price)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </label>
                    </div>
                )}

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
                        disabled={loading || (product.product_type === 'booking' && !selectedSlot)}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                        {loading ? 'Processing...' : `Pay ${formatPrice(finalAmount)}${product.product_type === 'membership' ? `/${product.subscription_interval === 'yearly' ? 'year' : 'mo'}` : ''}`}
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
