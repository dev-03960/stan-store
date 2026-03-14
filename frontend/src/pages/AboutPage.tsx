import React from 'react';
import { Target, Eye, Heart, Globe, CheckCircle, ArrowRight, Rocket, Shield, Zap, Sparkles, TrendingUp, X, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.8, ease: "easeOut" as const }
};

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

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-[#0f111a] py-20 px-4 overflow-hidden">
            {/* ════════════════ HERO SECTION ════════════════ */}
            <section className="relative max-w-6xl mx-auto mb-32 pt-12">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-500/5 blur-[120px] rounded-full -z-10" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-500/5 blur-[120px] rounded-full -z-10" />
                
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative z-10 text-center"
                >
                    <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-500/10 px-5 py-2 mb-8 border border-blue-100 dark:border-blue-500/20 shadow-sm">
                        <Rocket className="w-4 h-4 text-[#6786f5]" />
                        <span className="text-sm font-black text-[#6786f5] uppercase tracking-widest">About Miostore</span>
                    </div>
                    <h1 className="text-5xl sm:text-8xl font-black text-gray-900 dark:text-white mb-8 leading-[1.1] tracking-tighter" style={{ fontFamily: "'Lexend', sans-serif" }}>
                        Building the Future of <br className="hidden lg:block" />
                        <span className="bg-gradient-to-r from-[#6786f5] via-blue-500 to-indigo-600 bg-clip-text text-transparent">Creator Economy</span>
                    </h1>
                    <p className="max-w-3xl mx-auto text-xl sm:text-2xl text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                        Miostore was created with a simple belief: <br />
                        <span className="text-gray-900 dark:text-white font-black underline decoration-[#6786f5]/30 decoration-8 underline-offset-4">Creators should own their audience and their income.</span>
                    </p>
                </motion.div>
            </section>

            {/* ════════════════ PROBLEM/STORY INTRO ════════════════ */}
            <motion.section 
                {...fadeInUp}
                className="max-w-4xl mx-auto mb-32"
            >
                <div className="group relative p-8 sm:p-12 rounded-[3rem] bg-gray-50 dark:bg-[#1a1d2b] border border-gray-100 dark:border-gray-800 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/5">
                    <div className="absolute top-0 right-0 p-8 text-gray-100 dark:text-white/5 font-black text-8xl pointer-events-none select-none">"</div>
                    <div className="relative z-10">
                        <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
                            Today millions of creators share knowledge online, but most of them still struggle to monetize their audience efficiently. They are forced to use multiple tools, complicated platforms, and expensive software just to sell their products.
                        </p>
                        <p className="text-3xl font-black text-[#6786f5] mb-8 leading-tight">
                            Miostore exists to change that.
                        </p>
                        <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed font-medium italic">
                            We are building a platform where creators can launch, manage, and grow their business from one place.
                        </p>
                    </div>
                </div>
            </motion.section>

            {/* ════════════════ OUR STORY / FOUNDERS ════════════════ */}
            <section className="max-w-6xl mx-auto mb-40">
                <div className="text-center mb-20">
                    <h2 className="text-4xl sm:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight" style={{ fontFamily: "'Lexend', sans-serif" }}>Our Story</h2>
                    <div className="w-24 h-2 bg-gradient-to-r from-[#6786f5] to-indigo-600 mx-auto rounded-full shadow-lg shadow-blue-500/20" />
                </div>

                <div className="grid lg:grid-cols-2 gap-16 items-center mb-32">
                    <motion.div 
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="space-y-8"
                    >
                        <div className="p-8 rounded-[2.5rem] bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#6786f5]/10 blur-3xl rounded-full" />
                            <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-4">The Founders</h3>
                            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                                Miostore was founded by <span className="text-[#6786f5] font-black">Ravi Gupta</span> and <span className="text-[#6786f5] font-black">Devansh</span> after working closely with the creator and startup ecosystem.
                            </p>
                        </div>
                        <div className="space-y-6 px-4">
                            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                                Ravi comes from a strong sales background with over 4 years of experience. He has worked in the EdTech and SaaS industries, selling high-ticket courses and digital products to creators. Through his work, he helped companies generate crores in revenue and built millions of sales pipeline opportunities.
                            </p>
                            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                                While working with creators and coaches, Ravi noticed a recurring problem. Creators had audiences and knowledge, but they didn't have the right tools to monetize easily. Many were forced to rely on multiple platforms like Linktree, Gumroad, or Stan Store, which meant managing several tools and complicated systems.
                            </p>
                        </div>
                    </motion.div>
                    <motion.div 
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        <div className="absolute -inset-6 bg-gradient-to-r from-[#6786f5] to-indigo-600 rounded-[4rem] blur-3xl opacity-10" />
                        <div className="relative p-10 rounded-[3rem] bg-white dark:bg-[#1a1d2b] border border-gray-100 dark:border-gray-800 shadow-2xl">
                            <div className="flex items-center gap-5 mb-8">
                                <div className="p-4 rounded-2xl bg-[#6786f51a] text-[#6786f5] shadow-inner">
                                    <Sparkles className="w-8 h-8" />
                                </div>
                                <h4 className="text-2xl font-black text-gray-800 dark:text-white">Technical Vision</h4>
                            </div>
                            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
                                Devansh was building products in the startup ecosystem with 3+ years of experience in technology and product development. He had already built platforms from scratch in the HR-tech space.
                            </p>
                            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                                A passionate developer with a B.Tech background, Devansh believed in transforming ideas into real products. Both founders met while working at a startup.
                            </p>
                        </div>
                    </motion.div>
                </div>

                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-5xl mx-auto text-center p-12 sm:p-20 rounded-[4rem] bg-gradient-to-br from-[#1a1d2b] via-[#0f111a] to-black text-white relative overflow-hidden shadow-3xl"
                >
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/10 blur-[100px] -z-10" />
                    <p className="text-2xl sm:text-4xl font-black leading-tight mb-8">
                        "Creators didn't need more tools. They needed <span className="text-[#6786f5]">one powerful platform</span> that does everything."
                    </p>
                    <p className="text-[#6786f5] font-black tracking-[0.2em] uppercase text-sm">That idea became Miostore</p>
                </motion.div>
            </section>

            {/* ════════════════ MISSION & VISION ════════════════ */}
            <motion.section 
                variants={containerVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="max-w-6xl mx-auto mb-40"
            >
                <div className="grid md:grid-cols-2 gap-10">
                    <motion.div variants={itemVariants} className="p-12 rounded-[3.5rem] bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 group hover:border-emerald-500/30 transition-colors">
                        <div className="w-20 h-20 rounded-3xl bg-emerald-500 text-white flex items-center justify-center mb-10 shadow-2xl shadow-emerald-500/40 group-hover:scale-110 transition-transform">
                            <Target className="w-10 h-10" />
                        </div>
                        <h3 className="text-4xl font-black text-gray-900 dark:text-white mb-8">Our Mission</h3>
                        <p className="text-2xl text-gray-800 dark:text-gray-100 font-black mb-8 leading-tight">Help creators turn their <br /> knowledge into income.</p>
                        <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
                            We want to empower creators, coaches, educators, and freelancers to build real businesses online by giving them the tools they need to sell products, launch courses, and grow their audience.
                        </p>
                    </motion.div>
                    <motion.div variants={itemVariants} className="p-12 rounded-[3.5rem] bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 group hover:border-blue-500/30 transition-colors">
                        <div className="w-20 h-20 rounded-3xl bg-blue-500 text-white flex items-center justify-center mb-10 shadow-2xl shadow-blue-500/40 group-hover:scale-110 transition-transform">
                            <Eye className="w-10 h-10" />
                        </div>
                        <h3 className="text-4xl font-black text-gray-900 dark:text-white mb-8">Our Vision</h3>
                        <p className="text-2xl text-gray-800 dark:text-gray-100 font-black mb-8 leading-tight">The future belongs <br /> to creators.</p>
                        <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
                            Our long-term vision is to build a global platform for the creator economy, where anyone can monetize their expertise and build a sustainable online business.
                        </p>
                        <ul className="space-y-4">
                            {['Own their audience', 'Monetize their knowledge', 'Build independent digital businesses'].map((item) => (
                                <li key={item} className="flex items-center gap-4 text-gray-700 dark:text-gray-300 font-black text-lg">
                                    <div className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-sm" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                </div>
            </motion.section>

            {/* ════════════════ ECONOMY INSIGHTS ════════════════ */}
            <motion.section 
                {...fadeInUp}
                className="py-32 bg-gray-50 dark:bg-[#1a1d2b] -mx-4 px-4 mb-32 relative overflow-hidden"
            >
                <div className="max-w-6xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <div>
                            <div className="inline-flex items-center gap-3 rounded-full bg-indigo-50 dark:bg-indigo-500/10 px-5 py-2 mb-8 border border-indigo-100 dark:border-indigo-500/20">
                                <TrendingUp className="w-5 h-5 text-indigo-500" />
                                <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Industry Insights</span>
                            </div>
                            <h2 className="text-5xl font-black text-gray-900 dark:text-white mb-8 tracking-tight" style={{ fontFamily: "'Lexend', sans-serif" }}>The Creator Economy</h2>
                            <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 leading-relaxed font-medium">
                                The creator economy is growing faster than ever. Millions are selling digital products, but many still struggle with complex tools, expensive software, and poor integrations.
                            </p>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {['Complex tools', 'Expensive software', 'Poor integrations', 'Difficult setup'].map((item) => (
                                    <motion.div 
                                        whileHover={{ scale: 1.05 }}
                                        key={item} 
                                        className="flex items-center gap-3 p-5 rounded-2xl bg-white dark:bg-[#0f111a] border border-gray-100 dark:border-gray-800 shadow-sm"
                                    >
                                        <div className="p-1 rounded-full bg-red-500/10 text-red-500">
                                            <X className="w-4 h-4" />
                                        </div>
                                        <span className="font-bold text-gray-700 dark:text-gray-300">{item}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                        <motion.div 
                            whileHover={{ y: -5 }}
                            className="p-10 rounded-[4rem] bg-gradient-to-br from-[#6786f5] to-indigo-700 text-white shadow-3xl relative"
                        >
                            <div className="absolute top-0 right-0 p-10 opacity-10">
                                <Zap className="w-32 h-32" />
                            </div>
                            <h3 className="text-3xl font-black mb-8">Miostore simplifies everything</h3>
                            <p className="text-xl mb-10 leading-relaxed opacity-95 font-medium">
                                With one platform, creators can build their store, sell their products, automate marketing, and grow their business globally.
                            </p>
                            <div className="space-y-5">
                                {['Build your store', 'Sell globally', 'Automate marketing', 'Grow business'].map((item) => (
                                    <div key={item} className="flex items-center gap-5">
                                        <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center border border-white/30">
                                            <CheckCircle className="w-6 h-6 text-white" />
                                        </div>
                                        <span className="text-xl font-black">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </motion.section>

            {/* ════════════════ VALUES ════════════════ */}
            <section className="max-w-6xl mx-auto mb-40">
                <div className="text-center mb-20">
                    <h2 className="text-4xl sm:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight" style={{ fontFamily: "'Lexend', sans-serif" }}>Our Values</h2>
                    <p className="text-xl text-gray-500 dark:text-gray-400 font-medium">The core principles that guide everything we do.</p>
                </div>

                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8"
                >
                    {[
                        { title: 'Creator First', icon: Heart, iconRaw: null, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-500/5' },
                        { title: 'Simplicity', icon: Zap, iconRaw: null, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/5' },
                        { title: 'Transparency', icon: Shield, iconRaw: null, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/5' },
                        { title: 'Affordable Access', icon: null, iconRaw: CreditCard, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/5' },
                        { title: 'Global Opportunity', icon: Globe, iconRaw: null, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/5' },
                    ].map((v) => (
                        <motion.div 
                            key={v.title} 
                            variants={itemVariants}
                            className={`p-10 rounded-[2.5rem] ${v.bg} border border-gray-100 dark:border-gray-800/50 flex flex-col items-center text-center transition-all hover:-translate-y-3 cursor-default active:scale-95`}
                        >
                            <div className={`w-20 h-20 rounded-3xl bg-white dark:bg-[#0f111a] shadow-xl flex items-center justify-center mb-8 ${v.color}`}>
                                {v.iconRaw ? <v.iconRaw className="w-10 h-10" /> : v.icon && <v.icon className="w-10 h-10" />}
                            </div>
                            <h4 className="text-lg font-black text-gray-900 dark:text-white leading-tight">{v.title}</h4>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* ════════════════ ROADMAP ════════════════ */}
            <section className="max-w-4xl mx-auto mb-40">
                <div className="text-center mb-20">
                    <h2 className="text-4xl sm:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight" style={{ fontFamily: "'Lexend', sans-serif" }}>What's Next?</h2>
                    <p className="text-xl text-gray-500 dark:text-gray-400 font-medium">The roadmap to building the operating system for creator businesses.</p>
                </div>
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    className="space-y-6"
                >
                    {[
                        'Advanced marketing automation',
                        'Creator affiliate networks',
                        'AI tools for creators',
                        'Global payment integrations',
                        'Better analytics and growth tools'
                    ].map((item, i) => (
                        <motion.div 
                            key={i} 
                            variants={itemVariants}
                            className="flex items-center gap-8 p-8 rounded-[2rem] bg-white dark:bg-[#1a1d2b] border border-gray-100 dark:border-gray-800 group hover:border-[#6786f5] transition-all hover:shadow-xl hover:shadow-blue-500/5 cursor-default"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center font-black text-2xl group-hover:bg-[#6786f5] group-hover:text-white transition-all shadow-inner">
                                {i + 1}
                            </div>
                            <span className="text-2xl font-black text-gray-800 dark:text-gray-200 tracking-tight">{item}</span>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* ════════════════ FINAL CTA ════════════════ */}
            <section className="max-w-6xl mx-auto mb-40 px-4">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="p-12 sm:p-24 rounded-[5rem] bg-gradient-to-br from-[#1a1d2b] via-[#0f111a] to-black text-white text-center shadow-3xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 blur-[150px] -z-10" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/5 blur-[100px] -z-10" />
                    
                    <div className="relative z-10">
                        <h2 className="text-5xl sm:text-8xl font-black mb-10 leading-[1.1] tracking-tighter" style={{ fontFamily: "'Lexend', sans-serif" }}>
                            Join the Creator <br className="hidden sm:block" /> Movement
                        </h2>
                        <p className="text-2xl text-indigo-100/60 mb-16 max-w-3xl mx-auto leading-relaxed font-medium">
                            Mio Store is more than a platform. It's a movement to help creators build independent businesses and control their own income.
                        </p>
                        <motion.a 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            href="/login" 
                            className="group inline-flex items-center gap-5 bg-white text-[#1a1d2b] px-14 py-8 rounded-full text-3xl font-black hover:shadow-2xl hover:shadow-white/10 transition-all"
                        >
                            Start Your Store
                            <ArrowRight className="w-8 h-8 transform group-hover:translate-x-3 transition-transform" />
                        </motion.a>
                    </div>
                </motion.div>
            </section>
        </div>
    );
}
