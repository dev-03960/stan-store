import React from 'react';
import { Check, X, ArrowRight, Star, Sparkles, Rocket } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
};

const pricingFeatures = [
    'Unlimited products',
    'Digital & physical products',
    'Courses and coaching',
    'Affiliate system',
    'Email marketing automation',
    'Social media automation',
    'Advanced analytics',
    'Custom storefront',
    'Global payments'
];

const comparisonData = [
    {
        feature: 'Monthly Pricing',
        mio: '₹499',
        stan: 'Higher pricing',
        linktree: 'Limited free/paid',
        gumroad: 'Transaction fees'
    },
    {
        feature: 'Sell Digital Products',
        mio: true,
        stan: true,
        linktree: false,
        gumroad: true
    },
    {
        feature: 'Sell Physical Products',
        mio: true,
        stan: 'Limited',
        linktree: false,
        gumroad: 'Limited'
    },
    {
        feature: 'Courses & Coaching',
        mio: true,
        stan: true,
        linktree: false,
        gumroad: 'Limited'
    },
    {
        feature: 'Affiliate System',
        mio: true,
        stan: true,
        linktree: false,
        gumroad: 'Limited'
    },
    {
        feature: 'Recurring Affiliate Earnings',
        mio: true,
        stan: false,
        linktree: false,
        gumroad: false
    },
    {
        feature: 'Marketing Automation',
        mio: true,
        stan: 'Limited',
        linktree: false,
        gumroad: false
    },
    {
        feature: 'Email Marketing',
        mio: true,
        stan: 'Limited',
        linktree: false,
        gumroad: false
    },
    {
        feature: 'Custom Storefront',
        mio: true,
        stan: true,
        linktree: 'Limited',
        gumroad: 'Limited'
    },
    {
        feature: 'Link-in-Bio Store',
        mio: true,
        stan: true,
        linktree: true,
        gumroad: false
    },
    {
        feature: 'Analytics Dashboard',
        mio: true,
        stan: true,
        linktree: 'Limited',
        gumroad: true
    }
];

const faqs = [
    {
        question: 'Who is Mio Store for?',
        answer: 'Mio Store is built for creators, coaches, educators, freelancers, and influencers who want to monetize their audience.'
    },
    {
        question: 'What can I sell?',
        answer: 'You can sell digital products, courses, coaching sessions, memberships, and physical products.'
    },
    {
        question: 'Are there transaction fees?',
        answer: 'No. Mio Store only charges a ₹499 monthly subscription. Payment providers like Razorpay may charge their standard payment processing fees.'
    },
    {
        question: 'Can I sell globally?',
        answer: 'Yes. Mio Store supports creators and customers from around the world.'
    },
    {
        question: 'Can I use my own domain?',
        answer: 'Yes. Mio Store allows creators to connect custom domains for their storefront.'
    }
];

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring" as const,
            stiffness: 100,
            damping: 15
        }
    }
};

export default function PricingPage() {
    const [openFaq, setOpenFaq] = React.useState<number | null>(0);

    return (
        <div className="min-h-screen bg-white dark:bg-[#0f111a] py-20 px-4">
            {/* ════════════════ PRICING SECTION ════════════════ */}
            <div className="max-w-6xl mx-auto mb-32">
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-20"
                >
                    <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-500/10 px-4 py-1.5 mb-6 border border-blue-100 dark:border-blue-500/20">
                        <Star className="w-4 h-4 text-[#6786f5]" />
                        <span className="text-sm font-bold text-[#6786f5] uppercase tracking-wider">Simple Pricing</span>
                    </div>
                    <h1 className="text-5xl sm:text-7xl font-black text-gray-900 dark:text-white mb-8 tracking-tight" style={{ fontFamily: "'Lexend', sans-serif" }}>
                        Unlock Your Full <br />
                        <span className="bg-gradient-to-r from-[#6786f5] via-blue-500 to-indigo-600 bg-clip-text text-transparent">Creator Potential</span>
                    </h1>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-lg mx-auto"
                >
                    <div className="relative group">
                        <div className="absolute -inset-2 bg-gradient-to-r from-[#6786f5] to-indigo-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000" />
                        <div className="relative p-8 sm:p-12 rounded-[2.5rem] bg-white dark:bg-[#1a1d2b] border border-gray-100 dark:border-gray-800 shadow-2xl">
                            <div className="flex justify-between items-start mb-10">
                                <div>
                                    <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Mio Store Pro</h2>
                                    <p className="text-gray-500 dark:text-gray-400 font-medium">For the professional creators</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#6786f5] to-indigo-600 text-white shadow-lg shadow-blue-500/20">
                                    <Sparkles className="w-6 h-6" />
                                </div>
                            </div>

                            <div className="mb-10">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-6xl font-black text-gray-900 dark:text-white tracking-tighter">₹499</span>
                                    <span className="text-xl text-gray-500 font-bold">/ month</span>
                                </div>
                                <p className="text-sm text-gray-400 mt-3 font-medium">Cancel anytime. No lock-in.</p>
                            </div>

                            <motion.div 
                                variants={containerVariants}
                                initial="hidden"
                                animate="show"
                                className="space-y-4 mb-12"
                            >
                                {pricingFeatures.map((feature) => (
                                    <motion.div key={feature} variants={itemVariants} className="flex items-center gap-3">
                                        <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                            <Check className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="text-gray-700 dark:text-gray-300 font-bold text-sm">{feature}</span>
                                    </motion.div>
                                ))}
                            </motion.div>

                            <motion.a
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                href="/login"
                                className="flex items-center justify-center gap-3 w-full py-5 px-6 rounded-2xl bg-[#6786f5] text-white text-xl font-black hover:bg-[#5570e0] transition-colors shadow-2xl shadow-blue-500/30"
                            >
                                <Rocket className="w-6 h-6" />
                                Start Your Store
                                <ArrowRight className="w-5 h-5" />
                            </motion.a>

                            <div className="mt-10 pt-8 border-t border-gray-100 dark:border-gray-800 flex items-center justify-center gap-6">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Accepted:</span>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-bold text-gray-500">Razorpay</span>
                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                                    <span className="text-xs font-bold text-gray-500">PhonePe</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* ════════════════ COMPARISON SECTION ════════════════ */}
            <motion.div 
                {...fadeInUp}
                className="max-w-6xl mx-auto mb-32"
            >
                <div className="text-center mb-20">
                    <h2 className="text-4xl sm:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight" style={{ fontFamily: "'Lexend', sans-serif" }}>
                        Why Choose Mio Store?
                    </h2>
                    <p className="text-xl text-gray-500 dark:text-gray-400 font-medium">See how we stack up against the competition.</p>
                </div>

                <div className="relative p-1 bg-gradient-to-br from-gray-50 to-white dark:from-white/5 dark:to-transparent rounded-[2.5rem] border border-gray-100 dark:border-gray-800">
                    <div className="overflow-x-auto rounded-[2.3rem] bg-white dark:bg-[#0f111a]">
                        <table className="w-full min-w-[800px] text-left">
                            <thead>
                                <tr>
                                    <th className="py-8 px-8 text-xs font-black uppercase tracking-widest text-gray-400">Features</th>
                                    <th className="py-8 px-8 bg-blue-50/50 dark:bg-blue-500/5">
                                        <div className="flex flex-col">
                                            <span className="text-xl font-black text-[#6786f5]">Mio Store</span>
                                            <span className="text-[10px] uppercase tracking-widest text-[#6786f5]/60 mt-1">Recommended</span>
                                        </div>
                                    </th>
                                    <th className="py-8 px-8 text-sm font-bold text-gray-500">Stan Store</th>
                                    <th className="py-8 px-8 text-sm font-bold text-gray-500">Linktree</th>
                                    <th className="py-8 px-8 text-sm font-bold text-gray-500">Gumroad</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                                {comparisonData.map((row, i) => (
                                    <motion.tr 
                                        initial={{ opacity: 0, x: -10 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.05 }}
                                        key={i} 
                                        className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group"
                                    >
                                        <td className="py-6 px-8 font-bold text-gray-800 dark:text-gray-200">{row.feature}</td>
                                        <td className="py-6 px-8 bg-blue-50/30 dark:bg-blue-500/5">
                                            {typeof row.mio === 'boolean' ? (
                                                row.mio ? (
                                                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                                        <Check className="w-5 h-5 text-white" />
                                                    </div>
                                                ) : <X className="w-6 h-6 text-red-500" />
                                            ) : (
                                                <span className="font-black text-[#6786f5] text-lg">{row.mio}</span>
                                            )}
                                        </td>
                                        <td className="py-6 px-8 text-sm text-gray-500 font-medium">{row.stan}</td>
                                        <td className="py-6 px-8 text-sm text-gray-500 font-medium">{row.linktree}</td>
                                        <td className="py-6 px-8 text-sm text-gray-500 font-medium">{row.gumroad}</td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </motion.div>

            {/* ════════════════ FAQ SECTION ════════════════ */}
            <div className="max-w-4xl mx-auto mb-32">
                <div className="text-center mb-16">
                    <h2 className="text-4xl sm:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight" style={{ fontFamily: "'Lexend', sans-serif" }}>
                        Common Questions
                    </h2>
                    <p className="text-xl text-gray-500 dark:text-gray-400 font-medium">Everything you need to know about starting with Miostore.</p>
                </div>

                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    className="space-y-4"
                >
                    {faqs.map((faq, i) => (
                        <motion.div 
                            key={i} 
                            variants={itemVariants}
                            className={`rounded-3xl border transition-all duration-300 ${
                                openFaq === i 
                                ? 'border-[#6786f5] bg-blue-50/50 dark:bg-blue-500/10' 
                                : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1a1d2b]'
                            }`}
                        >
                            <button
                                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                className="w-full flex items-center justify-between p-7 text-left group"
                            >
                                <span className={`text-lg font-bold transition-colors ${openFaq === i ? 'text-[#6786f5]' : 'text-gray-900 dark:text-white'}`}>
                                    {faq.question}
                                </span>
                                <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 ${
                                    openFaq === i 
                                    ? 'bg-[#6786f5] border-[#6786f5] rotate-180' 
                                    : 'border-gray-200 dark:border-gray-700'
                                }`}>
                                    <ArrowRight className={`w-4 h-4 transition-colors rotate-90 ${openFaq === i ? 'text-white' : 'text-gray-400'}`} />
                                </div>
                            </button>
                            <AnimatePresence>
                                {openFaq === i && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-7 pt-0">
                                            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                                                {faq.answer}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}
