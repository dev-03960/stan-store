import React, { useState, useEffect } from 'react';
import { X, Loader2, Lock, Tag, CheckCircle2, Calendar, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
        if (!product?.bump?.bump_product_id || !allProducts) return null;
        return allProducts.find(p => p.id === product.bump!.bump_product_id) || null;
    }, [product, allProducts]);

    useEffect(() => {
        if (!product || product.product_type !== 'booking' || !isOpen) return;

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
    }, [product?.id, product?.product_type, isOpen, selectedDate]);

    // Recalculate amounts
    const baseAmount = product ? Math.max(0, product.price - discountAmount) : 0;
    const bumpAmount = bumpAccepted && bumpProduct && product?.bump
        ? Math.max(0, bumpProduct.price - product.bump.bump_discount)
        : 0;
    const finalAmount = baseAmount + bumpAmount;

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const isLoaded = await loadRazorpay();
            if (!isLoaded) {
                throw new Error('Razorpay SDK failed to load. Are you online?');
            }

            const refFromStorage = localStorage.getItem('stan_ref');

            const orderData = await createOrder({
                product_id: product.id,
                customer_name: name,
                customer_email: email,
                coupon_code: appliedCoupon || undefined,
                booking_slot_start: selectedSlot || undefined,
                bump_accepted: bumpAccepted,
                referral_code: refFromStorage || undefined,
            });

            const options: any = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "Miostore",
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
                    window.location.href = `/order/${orderData.id}`;
                },
                prefill: {
                    name: name,
                    email: email,
                },
                theme: {
                    color: "#6366f1",
                },
            };

            if (orderData.razorpay_order_id.startsWith('sub_')) {
                options.subscription_id = orderData.razorpay_order_id;
            } else {
                options.order_id = orderData.razorpay_order_id;
            }

            const paymentObject = new (window as any).Razorpay(options);
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
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 overflow-hidden">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, y: '100%' }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="relative bg-white dark:bg-[#0f111a] w-full max-w-lg h-full sm:h-auto max-h-[100dvh] sm:max-h-[90vh] sm:rounded-[2.5rem] shadow-2xl overflow-y-auto flex flex-col no-scrollbar"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="sticky top-0 z-20 flex items-center justify-between p-5 sm:p-7 bg-white/80 dark:bg-[#0f111a]/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
                            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3 tracking-tight">
                                <span className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
                                    <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" />
                                </span>
                                Secure Checkout
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 -mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                            >
                                <X className="w-6 h-6 sm:w-7 sm:h-7 text-gray-400" />
                            </button>
                        </div>

                        {/* Content Container */}
                        <div className="flex-1 pb-20 sm:pb-8">
                            {/* Product Summary */}
                            <div className="p-5 sm:p-8 bg-slate-50 dark:bg-white/5 border-b border-gray-100 dark:border-gray-800 flex gap-5 sm:gap-8">
                                {product.cover_image_url && (
                                    <div className="w-20 h-20 sm:w-28 sm:h-28 flex-shrink-0 rounded-[1.5rem] overflow-hidden shadow-lg border-2 border-white dark:border-gray-800">
                                        <img src={product.cover_image_url} alt={product.title} className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white line-clamp-1 tracking-tight">{product.title}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mt-1 font-medium">{product.description}</p>
                                    <div className="mt-3 flex items-baseline gap-2">
                                        {discountAmount > 0 ? (
                                            <>
                                                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">{formatPrice(finalAmount)}</span>
                                                <span className="text-sm text-gray-400 line-through font-bold opacity-60">{formatPrice(product.price)}</span>
                                            </>
                                        ) : (
                                            <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">{formatPrice(product.price)}</span>
                                        )}
                                        {product.product_type === 'membership' && (
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
                                                / {product.subscription_interval === 'yearly' ? 'YEAR' : 'MONTH'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Coupon Section */}
                            <div className="px-5 py-5 sm:px-8 sm:py-6 border-b border-gray-100 dark:border-gray-800">
                                {appliedCoupon ? (
                                    <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-500/10 rounded-2xl border border-green-100 dark:border-green-500/20 shadow-sm shadow-green-500/5">
                                        <div className="flex items-center gap-3 text-green-700 dark:text-green-400">
                                            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                                            <span className="text-sm font-black tracking-tight uppercase">{appliedCoupon} APPLIED SUCCESSFULLY</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={removeCoupon}
                                            className="text-[10px] font-black text-green-700/60 dark:text-green-400/60 hover:text-green-700 dark:hover:text-green-400 underline uppercase tracking-widest px-2"
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
                                                className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-2 font-black uppercase tracking-widest transition-all"
                                            >
                                                <Tag className="w-4 h-4" /> Have a coupon code?
                                            </button>
                                        ) : (
                                            <div className="flex gap-2 animate-in slide-in-from-top-4 duration-300">
                                                <input
                                                    type="text"
                                                    value={couponCode}
                                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                    placeholder="ENTER CODE"
                                                    className="flex-1 px-5 py-3 text-sm border-2 border-gray-100 dark:border-gray-800 dark:bg-white/5 rounded-2xl focus:border-indigo-500 outline-none uppercase font-black tracking-widest text-gray-900 dark:text-white transition-all shadow-sm"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleApplyCoupon}
                                                    disabled={validatingCoupon || !couponCode.trim()}
                                                    className="px-6 sm:px-8 py-3 bg-gray-900 dark:bg-indigo-600 text-white text-[10px] sm:text-xs font-black rounded-2xl hover:opacity-90 disabled:opacity-50 transition-all uppercase tracking-widest shadow-lg shadow-indigo-600/20"
                                                >
                                                    {validatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                                                </button>
                                            </div>
                                        )}
                                        {couponError && <p className="mt-3 text-[10px] sm:text-xs font-black text-red-600 dark:text-red-400 uppercase tracking-widest ml-1">{couponError}</p>}
                                    </div>
                                )}
                            </div>

                            {/* Booking Slots */}
                            {product.product_type === 'booking' && (
                                <div className="p-5 sm:p-8 border-b border-gray-100 dark:border-gray-800 space-y-6">
                                    <label className="block text-xs font-black text-gray-400 dark:text-gray-500 flex items-center gap-2 uppercase tracking-[0.2em]">
                                        <Calendar className="w-4 h-4 text-indigo-600" /> Select Date & Time
                                    </label>
                                    <input
                                        type="date"
                                        min={new Date().toISOString().split('T')[0]}
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="w-full px-5 py-4 border-2 border-gray-100 dark:border-gray-800 dark:bg-white/5 rounded-2xl focus:border-indigo-500 outline-none transition-all font-bold text-gray-900 dark:text-white shadow-sm"
                                    />

                                    <div>
                                        {loadingSlots ? (
                                            <div className="flex justify-center p-12"><Loader2 className="w-10 h-10 animate-spin text-indigo-600/20" /></div>
                                        ) : availableSlots.length === 0 ? (
                                            <p className="text-sm text-gray-500 text-center py-10 bg-gray-50 dark:bg-white/5 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-800 font-bold">No slots available on this date.</p>
                                        ) : (
                                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 sm:gap-3 max-h-72 overflow-y-auto pr-1 pb-2 custom-scrollbar">
                                                {availableSlots.map((slot: string) => {
                                                    const d = new Date(slot);
                                                    const timeString = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                                    return (
                                                        <button
                                                            key={slot}
                                                            type="button"
                                                            onClick={() => setSelectedSlot(slot)}
                                                            className={`py-4 px-1 text-[10px] sm:text-xs font-black rounded-2xl border-2 transition-all tracking-widest ${selectedSlot === slot ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-600/30' : 'border-gray-50 dark:border-gray-800 dark:bg-white/5 hover:border-indigo-500/50 text-gray-700 dark:text-gray-300'}`}
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
                                <div className="p-6 sm:p-8 mx-5 sm:mx-8 mt-8 border-2 border-dashed border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/5 rounded-[2rem] relative overflow-hidden group hover:border-indigo-400 transition-all">
                                    <label className="flex items-start gap-5 cursor-pointer">
                                        <div className="pt-1.5">
                                            <input
                                                type="checkbox"
                                                checked={bumpAccepted}
                                                onChange={(e) => setBumpAccepted(e.target.checked)}
                                                className="w-6 h-6 text-indigo-600 rounded-lg border-2 border-indigo-200 dark:border-gray-700 focus:ring-offset-0 focus:ring-0 cursor-pointer transition-transform group-active:scale-90"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2.5">
                                                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[9px] uppercase font-black px-2.5 py-1 rounded-full tracking-[0.1em] shadow-lg shadow-indigo-500/40">
                                                    Special Add-on
                                                </span>
                                            </div>
                                            <h4 className="font-black text-gray-900 dark:text-white text-base sm:text-lg">Add {bumpProduct.title}?</h4>
                                            <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-400 mt-1.5 line-clamp-2 leading-relaxed font-medium">{bumpProduct.description}</p>
                                            <div className="mt-4 flex items-baseline gap-2.5">
                                                <span className="font-black text-gray-900 dark:text-white text-lg">
                                                    +{formatPrice(Math.max(0, bumpProduct.price - product.bump.bump_discount))}
                                                </span>
                                                {product.bump.bump_discount > 0 && (
                                                    <span className="text-xs text-gray-400 line-through font-bold opacity-60">
                                                        {formatPrice(bumpProduct.price)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            )}

                            {/* User Info Form */}
                            <form onSubmit={handlePayment} className="p-5 sm:p-8 space-y-7">
                                {error && (
                                    <div className="p-4 sm:p-5 text-sm font-black text-red-600 bg-red-50 dark:bg-red-500/10 rounded-2xl border-2 border-red-100 dark:border-red-500/20 shadow-lg shadow-red-500/5 uppercase tracking-tight">
                                        {error}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                                    <div className="space-y-2">
                                        <label htmlFor="name" className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-1">Your Full Name</label>
                                        <input
                                            type="text"
                                            id="name"
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full px-5 py-4 border-2 border-gray-100 dark:border-gray-800 dark:bg-white/5 rounded-2xl focus:border-indigo-500 outline-none transition-all text-gray-900 dark:text-white font-bold shadow-sm placeholder:text-gray-300 dark:placeholder:text-gray-700"
                                            placeholder="Enter name"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="email" className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-1">Email Address</label>
                                        <input
                                            type="email"
                                            id="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full px-5 py-4 border-2 border-gray-100 dark:border-gray-800 dark:bg-white/5 rounded-2xl focus:border-indigo-500 outline-none transition-all text-gray-900 dark:text-white font-bold shadow-sm placeholder:text-gray-300 dark:placeholder:text-gray-700"
                                            placeholder="you@email.com"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="submit"
                                        disabled={loading || (product.product_type === 'booking' && !selectedSlot)}
                                        className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-[1.5rem] transition-all shadow-2xl shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed text-xl tracking-tighter"
                                    >
                                        {loading ? <Loader2 className="w-7 h-7 animate-spin" /> : <ChevronRight className="w-7 h-7" />}
                                        {loading ? 'PROCESSING...' : `PAY ${formatPrice(finalAmount).toUpperCase()}`}
                                    </motion.button>
                                </div>

                                <p className="text-[10px] text-center text-gray-300 dark:text-gray-600 flex items-center justify-center gap-2 font-black uppercase tracking-[0.25em] pb-6 sm:pb-0">
                                    <Lock className="w-4 h-4" /> SECURED BY RAZORPAY
                                </p>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CheckoutModal;
