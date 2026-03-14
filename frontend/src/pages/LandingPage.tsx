import {
    ShoppingBag, Zap, TrendingUp, Users, CreditCard,
    ArrowRight, Star, Sparkles, Rocket, CheckCircle,
    MessageSquare, Smartphone, Globe, Layers, AlertCircle, BarChart3,
    Youtube, Instagram, PenTool, GraduationCap
} from 'lucide-react';
import { motion } from 'framer-motion';

const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
};

const staggerContainer = {
    initial: { opacity: 0 },
    whileInView: { opacity: 1 },
    viewport: { once: true },
    transition: { staggerChildren: 0.1 }
};

const features = [
    {
        icon: ShoppingBag,
        title: 'Sell Anything',
        description: 'Sell digital products, courses, coaching calls, memberships, and physical products like books, merch, or accessories.',
        gradient: 'from-blue-500 to-indigo-500',
    },
    {
        icon: PenTool,
        title: 'Premium Storefront',
        description: 'Your storefront is designed to look professional and premium with custom themes and mobile-optimized pages.',
        gradient: 'from-sky-500 to-blue-500',
    },
    {
        icon: MessageSquare,
        title: 'Marketing Automation',
        description: 'Grow your business automatically with built-in email, Instagram, and WhatsApp automation tools.',
        gradient: 'from-indigo-500 to-violet-500',
    },
    {
        icon: BarChart3,
        title: 'Advanced Analytics',
        description: 'Track your creator business with powerful insights into revenue, product performance, and customer behavior.',
        gradient: 'from-emerald-500 to-teal-500',
    },
];

const useCases = [
    {
        icon: Instagram,
        title: 'Instagram Coaches',
        description: 'Sell coaching programs and digital products directly from your bio.',
        color: 'text-pink-500',
        bg: 'bg-pink-50 dark:bg-pink-500/10'
    },
    {
        icon: Youtube,
        title: 'YouTubers',
        description: 'Turn your subscribers into paying customers with courses and memberships.',
        color: 'text-red-500',
        bg: 'bg-red-50 dark:bg-red-500/10'
    },
    {
        icon: PenTool,
        title: 'Freelancers',
        description: 'Sell templates, guides, and digital tools.',
        color: 'text-blue-500',
        bg: 'bg-blue-50 dark:bg-blue-500/10'
    },
    {
        icon: GraduationCap,
        title: 'Educators',
        description: 'Launch full online courses and monetize your expertise.',
        color: 'text-emerald-500',
        bg: 'bg-emerald-50 dark:bg-emerald-500/10'
    }
];

const steps = [
    { step: '1', title: 'Create Your Account', description: 'Sign up and set up your creator profile in minutes.' },
    { step: '2', title: 'Add Your Products', description: 'Upload digital products, courses, coaching packages, or physical items.' },
    { step: '3', title: 'Share Your Store Link', description: 'Share your storefront link across Instagram, YouTube, and social media.' },
    { step: '4', title: 'Start Earning', description: 'Accept payments globally and grow your creator business.' },
];

export default function LandingPage() {
    return (
        <div className="overflow-hidden">
            {/* ════════════════ HERO SECTION ════════════════ */}
            <section className="relative min-h-[95vh] flex items-center justify-center px-4 pt-12 pb-20">
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-950 dark:via-[#0f111a] dark:to-slate-900" />
                <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative z-10 max-w-6xl mx-auto text-center"
                >
                    {/* Badge */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-500/10 dark:to-indigo-500/10 px-5 py-2 mb-8 border border-blue-200/50 dark:border-blue-500/20 shadow-sm"
                    >
                        <Sparkles className="w-4 h-4 text-[#6786f5]" />
                        <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                            Launch your creator store in minutes
                        </span>
                    </motion.div>

                    <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black text-gray-900 dark:text-white leading-[1.1] tracking-tight mb-8" style={{ fontFamily: "'Lexend', sans-serif" }}>
                        Turn Your Audience Into a <br className="hidden lg:block" />
                        <span className="bg-gradient-to-r from-[#6786f5] via-blue-500 to-indigo-500 bg-clip-text text-transparent">
                            Business ✦
                        </span>
                    </h1>

                    <p className="max-w-3xl mx-auto text-xl sm:text-2xl text-gray-600 dark:text-gray-400 mb-6 leading-relaxed font-medium">
                        Sell digital products, courses, coaching sessions, memberships, and even physical products — all from one powerful creator storefront.
                    </p>
                    <p className="max-w-2xl mx-auto text-lg text-gray-500 dark:text-gray-500 mb-12">
                        Build your creator business, automate your marketing, and start earning from Day 1.
                    </p>

                    {/* Features checklist */}
                    <motion.div 
                        variants={staggerContainer}
                        initial="initial"
                        whileInView="whileInView"
                        viewport={{ once: true }}
                        className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 mb-12"
                    >
                        {[
                            'Sell globally',
                            'Premium storefront for your brand',
                            'Built-in marketing automation',
                            'Affiliate system to grow faster'
                        ].map((item) => (
                            <motion.div variants={fadeInUp} key={item} className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium">
                                <div className="p-0.5 rounded-full bg-emerald-500">
                                    <CheckCircle className="w-4 h-4 text-white" />
                                </div>
                                <span>{item}</span>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <a
                            href="/login"
                            className="group relative inline-flex items-center gap-3 rounded-full bg-[#6786f5] px-10 py-5 text-xl font-bold text-white shadow-2xl shadow-blue-500/30 transition-all hover:shadow-blue-500/40 hover:scale-105 hover:bg-[#5570e0]"
                        >
                            <Rocket className="w-6 h-6" />
                            Start Your Store
                            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                        </a>
                        <a
                            href="#how-it-works"
                            className="inline-flex items-center gap-2 rounded-full border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-white/5 px-10 py-5 text-xl font-bold text-gray-700 dark:text-gray-300 transition-all hover:border-[#6786f5] hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-[#6786f5]"
                        >
                            See How It Works
                            <ArrowRight className="w-5 h-5" />
                        </a>
                    </div>
                </motion.div>
            </section>

            {/* ════════════════ TRUST SECTION ════════════════ */}
            <motion.section 
                {...fadeInUp}
                className="py-24 px-4 bg-white dark:bg-[#0f111a] border-y border-gray-100 dark:border-gray-800"
            >
                <div className="max-w-5xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-500/10 px-4 py-1.5 mb-8 border border-blue-100 dark:border-blue-500/20">
                        <Users className="w-4 h-4 text-[#6786f5]" />
                        <span className="text-sm font-semibold text-[#6786f5]">Creator-First Platform</span>
                    </div>
                    <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-6" style={{ fontFamily: "'Lexend', sans-serif" }}>
                        Built for the Modern Creator Economy
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed mb-8">
                        From Instagram creators to YouTubers, educators, and freelancers — Mio Store helps creators turn attention into income.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-8 text-left max-w-3xl mx-auto">
                        <motion.div 
                            whileHover={{ scale: 1.02 }}
                            className="p-6 rounded-2xl bg-gray-50 dark:bg-[#1a1d2b] border border-gray-100 dark:border-gray-800"
                        >
                            <p className="text-gray-600 dark:text-gray-400 italic">"Creators no longer depend only on ads or brand deals."</p>
                        </motion.div>
                        <motion.div 
                            whileHover={{ scale: 1.02 }}
                            className="p-6 rounded-2xl bg-[#6786f510] border border-[#6786f520]"
                        >
                            <p className="text-[#6786f5] font-semibold text-lg">Now they build real businesses with their audience.</p>
                        </motion.div>
                    </div>
                </div>
            </motion.section>

            {/* ════════════════ CREATOR PROBLEM SECTION ════════════════ */}
            <motion.section 
                {...fadeInUp}
                className="py-24 px-4 bg-gray-50 dark:bg-[#1a1d2b]"
            >
                <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-red-50 dark:bg-red-500/10 px-4 py-1.5 mb-6 border border-red-100 dark:border-red-500/20">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            <span className="text-sm font-semibold text-red-600 dark:text-red-400">The Problem</span>
                        </div>
                        <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-6 leading-tight" style={{ fontFamily: "'Lexend', sans-serif" }}>
                            Creators Shouldn't Need 5 Different Tools
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                            Most creators today use multiple platforms just to run their business. Managing everything becomes complicated and expensive.
                        </p>
                        <motion.div 
                            variants={staggerContainer}
                            initial="initial"
                            whileInView="whileInView"
                            className="space-y-4"
                        >
                            {[
                                { tool: 'Linktree', for: 'bio links' },
                                { tool: 'Gumroad', for: 'selling products' },
                                { tool: 'Stan Store', for: 'coaching and courses' },
                                { tool: 'Email tools', for: 'marketing' }
                            ].map((item) => (
                                <motion.div variants={fadeInUp} key={item.tool} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                                    <span><span className="font-bold">{item.tool}</span> for {item.for}</span>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#6786f5] to-indigo-600 blur-[80px] opacity-20" />
                        <motion.div 
                            whileHover={{ y: -5 }}
                            className="relative p-10 rounded-3xl bg-white dark:bg-[#0f111a] border border-gray-100 dark:border-gray-800 shadow-2xl"
                        >
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Mio Store replaces all of them with one powerful platform.</h3>
                            <div className="grid grid-cols-1 gap-4">
                                {[
                                    { text: 'One platform', icon: Globe },
                                    { text: 'One storefront', icon: Smartphone },
                                    { text: 'One subscription', icon: CreditCard }
                                ].map((item) => (
                                    <motion.div 
                                        whileHover={{ x: 10 }}
                                        key={item.text} 
                                        className="flex items-center gap-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 cursor-default"
                                    >
                                        <item.icon className="w-6 h-6 text-[#6786f5]" />
                                        <span className="font-bold text-gray-800 dark:text-gray-200">{item.text}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </motion.section>

            {/* ════════════════ ECONOMY OPPORTUNITY SECTION ════════════════ */}
            <motion.section 
                {...fadeInUp}
                className="py-24 px-4 bg-white dark:bg-[#0f111a]"
            >
                <div className="max-w-6xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <motion.div 
                            initial={{ x: -50, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            className="order-2 lg:order-1"
                        >
                            <div className="p-8 rounded-3xl bg-gradient-to-br from-[#6786f5] to-indigo-700 text-white shadow-2xl">
                                <h3 className="text-2xl font-bold mb-6">Today creators sell:</h3>
                                <ul className="space-y-4">
                                    {[
                                        'Digital products', 'Online courses', 'Coaching programs',
                                        'Membership communities', 'Merchandise and physical products'
                                    ].map((item) => (
                                        <li key={item} className="flex items-center gap-3">
                                            <div className="p-1 rounded-full bg-white/20">
                                                <CheckCircle className="w-4 h-4 text-white" />
                                            </div>
                                            <span className="font-medium">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </motion.div>
                        <motion.div 
                            initial={{ x: 50, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            className="order-1 lg:order-2"
                        >
                            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-4 py-1.5 mb-6 border border-emerald-100 dark:border-emerald-500/20">
                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">The Opportunity</span>
                            </div>
                            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-6 leading-tight" style={{ fontFamily: "'Lexend', sans-serif" }}>
                                The Creator Economy Is Exploding
                            </h2>
                            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                                Millions of creators are building businesses by selling their knowledge. Your audience already trusts you.
                            </p>
                            <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20">
                                <p className="text-emerald-700 dark:text-emerald-400 font-bold text-xl">
                                    Mio Store gives you the tools to turn that trust into revenue.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </motion.section>

            {/* ════════════════ PRODUCT SHOWCASE ════════════════ */}
            <motion.section 
                {...fadeInUp}
                className="py-24 px-4 bg-gray-50 dark:bg-[#1a1d2b]"
            >
                <div className="max-w-6xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 dark:bg-indigo-500/10 px-4 py-1.5 mb-8 border border-indigo-100 dark:border-indigo-500/20">
                        <Smartphone className="w-4 h-4 text-indigo-500" />
                        <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">High-Converting Design</span>
                    </div>
                    <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-6" style={{ fontFamily: "'Lexend', sans-serif" }}>
                        Your Creator Storefront
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed mb-12">
                        A beautiful, high-converting storefront designed to turn followers into customers.
                        Your store works perfectly across Instagram, YouTube, and social media.
                    </p>

                    <motion.div 
                        variants={staggerContainer}
                        initial="initial"
                        whileInView="whileInView"
                        className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4"
                    >
                        {[
                            { text: 'Mobile-first design', icon: Smartphone },
                            { text: 'Link-in-bio storefront', icon: Globe },
                            { text: 'Custom domains', icon: Layers },
                            { text: 'Custom themes', icon: PenTool },
                            { text: 'Optimized checkout', icon: Zap }
                        ].map((item) => (
                            <motion.div 
                                variants={fadeInUp}
                                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                                key={item.text} 
                                className="p-6 rounded-2xl bg-white dark:bg-[#0f111a] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center gap-4 transition-colors hover:border-[#6786f5]"
                            >
                                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-[#6786f5]">
                                    <item.icon className="w-6 h-6" />
                                </div>
                                <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">{item.text}</span>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </motion.section>

            {/* ════════════════ FEATURES SECTION ════════════════ */}
            <motion.section 
                {...fadeInUp}
                className="py-24 px-4 bg-white dark:bg-[#0f111a]"
            >
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 rounded-full bg-[#6786f51a] px-4 py-1.5 mb-4 border border-[#6786f520]">
                            <Zap className="w-4 h-4 text-[#6786f5]" />
                            <span className="text-sm font-semibold text-[#6786f5]">Everything You Need</span>
                        </div>
                        <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Lexend', sans-serif" }}>
                            Run Your Entire Creator Business
                        </h2>
                    </div>

                    <motion.div 
                        variants={staggerContainer}
                        initial="initial"
                        whileInView="whileInView"
                        className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto"
                    >
                        {features.map((feature) => (
                            <motion.div
                                variants={fadeInUp}
                                whileHover={{ y: -8 }}
                                key={feature.title}
                                className="group relative p-8 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1a1d2b] transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/5"
                            >
                                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} text-white mb-5 group-hover:scale-110 transition-transform duration-300`}>
                                    <feature.icon className="w-7 h-7" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                                <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed">{feature.description}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </motion.section>

            {/* ════════════════ USE CASES ════════════════ */}
            <section className="py-24 px-4 bg-gray-50 dark:bg-[#1a1d2b]">
                <div className="max-w-6xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 dark:bg-sky-500/10 px-4 py-1.5 mb-8 border border-sky-100 dark:border-sky-500/20">
                        <Star className="w-4 h-4 text-sky-500" />
                        <span className="text-sm font-semibold text-sky-600 dark:text-sky-400">Use Cases</span>
                    </div>
                    <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-16" style={{ fontFamily: "'Lexend', sans-serif" }}>
                        Built for Every Type of Creator
                    </h2>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {useCases.map((uc, index) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ y: -8 }}
                                key={uc.title} 
                                className="p-8 rounded-3xl bg-white dark:bg-[#0f111a] border border-gray-100 dark:border-gray-800 text-left hover:shadow-xl transition-all"
                            >
                                <div className={`w-14 h-14 rounded-2xl ${uc.bg} ${uc.color} flex items-center justify-center mb-6`}>
                                    <uc.icon className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{uc.title}</h3>
                                <p className="text-gray-500 dark:text-gray-400">{uc.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ════════════════ HOW IT WORKS ════════════════ */}
            <section id="how-it-works" className="py-24 px-4 bg-white dark:bg-[#0f111a]">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-500/10 px-4 py-1.5 mb-4 border border-blue-100 dark:border-blue-500/20">
                            <Rocket className="w-4 h-4 text-[#6786f5]" />
                            <span className="text-sm font-semibold text-[#6786f5]">Simple Flow</span>
                        </div>
                        <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Lexend', sans-serif" }}>
                            Launch in 4 Simple Steps
                        </h2>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12">
                        {steps.map((s) => (
                            <div key={s.step} className="relative group flex flex-col items-center text-center">
                                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#6786f5] to-indigo-600 text-white text-3xl font-black flex items-center justify-center mb-6 shadow-xl shadow-blue-500/20 group-hover:rotate-6 transition-transform">
                                    {s.step}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{s.title}</h3>
                                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{s.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ════════════════ FINAL CTA ════════════════ */}
            <motion.section 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="py-32 px-4 relative overflow-hidden bg-white dark:bg-[#0f111a]"
            >
                <div className="max-w-6xl mx-auto relative z-10">
                    <motion.div 
                        initial={{ y: 50, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="p-12 sm:p-20 rounded-[3rem] bg-gradient-to-br from-[#1a1d2b] to-[#0f111a] dark:from-[#6786f5] dark:to-indigo-700 text-white dark:text-white text-center shadow-3xl overflow-hidden relative"
                    >
                        {/* Decorative elements */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 blur-[100px]" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 blur-[100px]" />

                        <div className="relative z-10">
                            <h2 className="text-4xl sm:text-6xl font-black mb-8 leading-tight" style={{ fontFamily: "'Lexend', sans-serif" }}>
                                Build Your Creator <br className="hidden sm:block" /> Business Today
                            </h2>
                            <p className="text-xl text-gray-300 dark:text-white/90 mb-12 max-w-2xl mx-auto leading-relaxed">
                                Your audience already follows you. Now it’s time to monetize your knowledge and build a real business. Create your Mio Store and start selling today.
                            </p>
                            <a
                                href="/login"
                                className="group inline-flex items-center gap-3 rounded-full bg-white dark:bg-white px-10 py-5 text-xl font-black text-[#6786f5] dark:text-[#6786f5] shadow-2xl transition-all hover:scale-105 hover:bg-gray-50 active:scale-95"
                            >
                                Start Your Store
                                <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
                            </a>
                        </div>
                    </motion.div>
                </div>
            </motion.section>
        </div>
    );
}
