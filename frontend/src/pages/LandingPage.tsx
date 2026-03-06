
import { MioLogo } from '../components/brand/MioLogo';
import {
    ShoppingBag, Zap, TrendingUp, Users, Shield, CreditCard,
    ArrowRight, Star, Sparkles, Rocket, CheckCircle, Play
} from 'lucide-react';

const features = [
    {
        icon: ShoppingBag,
        title: 'Digital Products',
        description: 'Sell eBooks, templates, presets, and digital downloads with instant delivery.',
        gradient: 'from-blue-500 to-indigo-500',
    },
    {
        icon: Play,
        title: 'Online Courses',
        description: 'Create and sell courses with a built-in video player and progress tracking.',
        gradient: 'from-sky-500 to-blue-500',
    },
    {
        icon: Users,
        title: 'Affiliate System',
        description: 'Let your fans promote your products and earn commissions automatically.',
        gradient: 'from-indigo-500 to-violet-500',
    },
    {
        icon: TrendingUp,
        title: 'Analytics Dashboard',
        description: 'Track revenue, page views, conversions, and top products in real time.',
        gradient: 'from-emerald-500 to-teal-500',
    },
    {
        icon: CreditCard,
        title: 'Razorpay Payments',
        description: 'Accept UPI, cards, and net banking. Instant payouts to your bank account.',
        gradient: 'from-cyan-500 to-blue-500',
    },
    {
        icon: Shield,
        title: 'Secure & Reliable',
        description: 'Enterprise-grade security with encrypted payments and data protection.',
        gradient: 'from-slate-600 to-slate-800',
    },
];

const steps = [
    { step: '01', title: 'Sign Up', description: 'Create your free account in seconds with Google or email.' },
    { step: '02', title: 'Add Products', description: 'Upload your digital products, courses, or coaching packages.' },
    { step: '03', title: 'Share Your Link', description: 'Get your beautiful storefront link and share it everywhere.' },
    { step: '04', title: 'Get Paid', description: 'Receive payments directly to your bank account via Razorpay.' },
];

const stats = [
    { value: '10K+', label: 'Creators' },
    { value: '₹5Cr+', label: 'Revenue Processed' },
    { value: '50K+', label: 'Products Sold' },
    { value: '99.9%', label: 'Uptime' },
];

export default function LandingPage() {
    return (
        <div className="overflow-hidden">
            {/* ════════════════ HERO SECTION ════════════════ */}
            <section className="relative min-h-[90vh] flex items-center justify-center px-4 pt-8 pb-20">
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50" />
                <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-100/20 rounded-full blur-3xl" />

                <div className="relative z-10 max-w-5xl mx-auto text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 px-5 py-2 mb-8 border border-blue-200/50">
                        <Sparkles className="w-4 h-4 text-[#6786f5]" />
                        <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            India's Fastest-Growing Creator Commerce Platform
                        </span>
                    </div>

                    {/* Logo + Heading */}
                    <div className="flex justify-center mb-6">
                        <MioLogo size="xl" showText={false} />
                    </div>

                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-tight tracking-tight mb-6" style={{ fontFamily: "'Lexend', sans-serif" }}>
                        Turn Your Audience Into
                        <span className="block bg-gradient-to-r from-[#6786f5] via-blue-500 to-indigo-500 bg-clip-text text-transparent">
                            Revenue ✦
                        </span>
                    </h1>

                    <p className="max-w-2xl mx-auto text-lg sm:text-xl text-gray-600 mb-10 leading-relaxed">
                        Sell digital products, online courses, and coaching sessions — all from your
                        own beautiful link-in-bio storefront. Set up in minutes, start earning today.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <a
                            href="/login"
                            className="group relative inline-flex items-center gap-2 rounded-full bg-[#6786f5] px-8 py-4 text-lg font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105 hover:bg-[#5570e0]"
                        >
                            <Rocket className="w-5 h-5" />
                            Start Selling for Free
                            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                        </a>
                        <a
                            href="/login"
                            className="inline-flex items-center gap-2 rounded-full border-2 border-gray-200 bg-white px-8 py-4 text-lg font-semibold text-gray-700 transition-all hover:border-[#6786f5] hover:bg-blue-50 hover:text-[#6786f5]"
                        >
                            Sign In →
                        </a>
                    </div>

                    {/* Social proof mini */}
                    <div className="mt-12 flex items-center justify-center gap-2 text-gray-500 text-sm">
                        <div className="flex -space-x-2">
                            {[
                                'bg-blue-400', 'bg-indigo-400', 'bg-sky-400', 'bg-emerald-400', 'bg-violet-400'
                            ].map((color, i) => (
                                <div
                                    key={i}
                                    className={`w-8 h-8 rounded-full ${color} border-2 border-white flex items-center justify-center text-white text-xs font-bold`}
                                >
                                    {String.fromCharCode(65 + i)}
                                </div>
                            ))}
                        </div>
                        <span className="ml-2">
                            <span className="font-semibold text-gray-700">10,000+</span> creators already selling
                        </span>
                    </div>
                </div>
            </section>

            {/* ════════════════ STATS BANNER ════════════════ */}
            <section className="relative py-16 bg-gradient-to-r from-[#0f111a] via-[#1a1d2b] to-[#0f111a]">
                <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
                    {stats.map((stat) => (
                        <div key={stat.label} className="text-center">
                            <div className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                                {stat.value}
                            </div>
                            <div className="text-gray-400 text-sm font-medium mt-1">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ════════════════ FEATURES SECTION ════════════════ */}
            <section className="py-24 px-4 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 rounded-full bg-[#6786f51a] px-4 py-1.5 mb-4">
                            <Zap className="w-4 h-4 text-[#6786f5]" />
                            <span className="text-sm font-semibold text-[#6786f5]">Powerful Features</span>
                        </div>
                        <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4" style={{ fontFamily: "'Lexend', sans-serif" }}>
                            Everything You Need to Sell Online
                        </h2>
                        <p className="max-w-2xl mx-auto text-lg text-gray-500">
                            From product listings to payment processing — Mio Store handles it all so you can focus on creating.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature) => (
                            <div
                                key={feature.title}
                                className="group relative p-8 rounded-2xl border border-gray-100 bg-white hover:border-transparent hover:shadow-2xl hover:shadow-blue-100/50 transition-all duration-300"
                            >
                                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} text-white mb-5 group-hover:scale-110 transition-transform duration-300`}>
                                    <feature.icon className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                                <p className="text-gray-500 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ════════════════ HOW IT WORKS ════════════════ */}
            <section className="py-24 px-4 bg-gradient-to-b from-[#f8f9ff] to-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-1.5 mb-4">
                            <Star className="w-4 h-4 text-sky-500" />
                            <span className="text-sm font-semibold text-sky-600">Simple Setup</span>
                        </div>
                        <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4" style={{ fontFamily: "'Lexend', sans-serif" }}>
                            Start Selling in 4 Easy Steps
                        </h2>
                        <p className="max-w-2xl mx-auto text-lg text-gray-500">
                            No coding required. No monthly fees. Just create, share, and earn.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {steps.map((s, i) => (
                            <div key={s.step} className="relative text-center group">
                                {/* Connector line */}
                                {i < steps.length - 1 && (
                                    <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-blue-200 to-indigo-200" />
                                )}
                                <div className="relative z-10 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#6786f5] to-indigo-500 text-white text-2xl font-extrabold mb-5 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                                    {s.step}
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{s.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ════════════════ WHY CREATORS LOVE US ════════════════ */}
            <section className="py-24 px-4 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4" style={{ fontFamily: "'Lexend', sans-serif" }}>
                            Why Creators Love <span className="bg-gradient-to-r from-[#6786f5] to-indigo-500 bg-clip-text text-transparent">Mio Store</span>
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {[
                            { text: 'Zero monthly fees — we only earn when you earn', icon: CheckCircle },
                            { text: 'Beautiful, mobile-first storefront out of the box', icon: CheckCircle },
                            { text: 'Instant payouts to your Indian bank account', icon: CheckCircle },
                            { text: 'Built-in affiliate & referral program', icon: CheckCircle },
                            { text: 'Advanced analytics to grow your business', icon: CheckCircle },
                            { text: 'Automated email campaigns & cart recovery', icon: CheckCircle },
                        ].map((item, i) => (
                            <div key={i} className="flex items-start gap-4 p-5 rounded-xl hover:bg-blue-50/50 transition-colors">
                                <item.icon className="w-6 h-6 text-emerald-500 mt-0.5 shrink-0" />
                                <span className="text-gray-700 text-lg">{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ════════════════ FINAL CTA ════════════════ */}
            <section className="py-24 px-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#6786f5] via-blue-600 to-indigo-600" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />

                <div className="relative z-10 max-w-3xl mx-auto text-center">
                    <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-6 leading-tight" style={{ fontFamily: "'Lexend', sans-serif" }}>
                        Ready to Launch Your Creator Store?
                    </h2>
                    <p className="text-lg text-white/80 mb-10 max-w-xl mx-auto">
                        Join thousands of creators who are turning their passion into profit with Mio Store.
                        It's free to start — no credit card required.
                    </p>
                    <a
                        href="/login"
                        className="inline-flex items-center gap-2 rounded-full bg-white px-10 py-4 text-lg font-bold text-[#6786f5] shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
                    >
                        <Rocket className="w-5 h-5" />
                        Get Started Free
                        <ArrowRight className="w-5 h-5" />
                    </a>
                </div>
            </section>
        </div>
    );
}
