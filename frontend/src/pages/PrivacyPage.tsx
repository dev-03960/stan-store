import { Lock, Mail, Globe, Clock } from 'lucide-react';

export default function PrivacyPage() {
    const sections = [
        {
            id: 1,
            title: 'About Mio Store',
            content: 'Mio Store is a creator commerce platform that allows creators, educators, freelancers, and influencers to sell digital products, courses, coaching services, memberships, and physical products through a customizable online storefront.\nThis Privacy Policy applies to all users of Mio Store including:\n• Creators using the platform to sell products\n• Customers purchasing products from creators\n• Visitors browsing the website'
        },
        {
            id: 2,
            title: 'Information We Collect',
            content: 'We collect different types of information to provide and improve our services.\n\nPersonal Information\nWhen you create an account or interact with the platform, we may collect name, email, phone number, login credentials, business profile details, and profile/cover images.\n\nPayment Information\nPayments are processed through third-party providers like Razorpay, PhonePe, and Stripe. Mio Store does not store your card details or banking information.\n\nCustomer Purchase Information\nWhen customers buy products, we collect their name, email, purchase history, and transaction details. This remains visible to the creator who sold the product.\n\nUsage Data\nWe collect data on how users interact with the platform, including pages visited, storefront activity, device info, browser type, and IP address.'
        },
        {
            id: 3,
            title: 'How We Use Your Information',
            content: 'We use the information we collect for the following purposes:\n• To create and manage user accounts\n• To enable creators to sell products and services\n• To process transactions and payments\n• To deliver digital products or course access\n• To provide analytics and performance insights\n• To improve platform functionality\n• To communicate important updates or service notifications\n• To prevent fraud or misuse of the platform'
        },
        {
            id: 4,
            title: 'Creator Access to Customer Data',
            content: 'When a customer purchases a product, certain information such as name, email address, and purchase details may be shared with the creator to help them manage customer relationships, deliver services, and provide support. Creators are responsible for using this information ethically and in compliance with privacy laws.'
        },
        {
            id: 5,
            title: 'Marketing Communications',
            content: 'We may send emails related to account notifications, product updates, and platform announcements. Users can unsubscribe at any time. Creators may also use Miostore tools to send emails or newsletters to their customers.'
        },
        {
            id: 6,
            title: 'Cookies & Tracking Technologies',
            content: 'Mio Store may use cookies to improve user experience, analyze usage, remember sessions, and personalize content. Users can disable cookies through browser settings, though some features may not function properly.'
        },
        {
            id: 7,
            title: 'Data Security',
            content: 'We take reasonable security measures to protect user data, including encrypted connections (HTTPS) and secure database systems. However, no online system is completely secure, and users share information at their own risk.'
        },
        {
            id: 8,
            title: 'Third-Party Services',
            content: 'Mio Store integrates with third-party services including payment gateways (Razorpay, PhonePe, Stripe), email delivery systems, social media integrations, and analytics tools. These services have their own privacy policies.'
        },
        {
            id: 9,
            title: 'Data Retention',
            content: 'We retain user data as long as necessary to provide services, comply with legal obligations, and resolve disputes. Users may request account deletion.'
        },
        {
            id: 10,
            title: 'User Rights',
            content: 'Users may have the right to access personal data, request corrections, request deletion of account data, or opt out of marketing communications.'
        },
        {
            id: 11,
            title: 'Children\'s Privacy',
            content: 'Mio Store is not intended for individuals under the age of 18. We do not knowingly collect personal data from children.'
        },
        {
            id: 12,
            title: 'Changes to This Privacy Policy',
            content: 'We may update this Privacy Policy periodically. The revised policy will be posted on this page with an updated "Last Updated" date. Continued use indicates acceptance.'
        },
        {
            id: 13,
            title: 'Contact Us',
            content: 'If you have questions regarding this Privacy Policy, please contact us:\nEmail: support@miostore.com\nWebsite: www.miostore.com'
        }
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-[#0f111a] py-20 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-16 border-b border-gray-100 dark:border-gray-800 pb-12 text-center sm:text-left">
                    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-4 py-1.5 mb-6 border border-emerald-100 dark:border-emerald-500/20">
                        <Lock className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Data Protection</span>
                    </div>
                    <h1 className="text-4xl sm:text-6xl font-black text-gray-900 dark:text-white mb-6" style={{ fontFamily: "'Lexend', sans-serif" }}>
                        Privacy Policy
                    </h1>
                    <div className="flex items-center justify-center sm:justify-start gap-4 text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>Last Updated: March 2026</span>
                        </div>
                    </div>
                </div>

                {/* Content Intro */}
                <div className="prose prose-lg dark:prose-invert max-w-none mb-16">
                    <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                        Welcome to Mio Store. Your privacy is important to us. This Privacy Policy explains how Mio Store collects, uses, stores, and protects your information when you use our platform, website, and services.
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                        By accessing or using Mio Store, you agree to the terms outlined in this Privacy Policy.
                    </p>
                </div>

                {/* Sections Grid/Stack */}
                <div className="grid gap-12 sm:gap-16">
                    {sections.map((section) => (
                        <div key={section.id} className="relative group p-8 rounded-3xl bg-gray-50/50 dark:bg-white/[0.02] border border-gray-100 dark:border-gray-800/50 hover:border-emerald-500/30 transition-colors">
                            <div className="flex flex-col sm:flex-row gap-6">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-emerald-500/20">
                                        {section.id}
                                    </div>
                                </div>
                                <div className="flex-grow">
                                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4">
                                        {section.title}
                                    </h3>
                                    <div className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line text-lg">
                                        {section.content}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Contact Card */}
                <div className="mt-24 p-12 rounded-[3rem] bg-gradient-to-br from-[#1a1d2b] to-[#0f111a] text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px]" />
                    <div className="relative z-10">
                        <h2 className="text-3xl font-black mb-6">Questions about your data?</h2>
                        <p className="text-gray-400 mb-10 max-w-lg mx-auto">
                            Our privacy team is dedicated to protecting your information. Contact us for any clarifications.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-6">
                            <a 
                                href="mailto:support@miostore.com"
                                className="inline-flex items-center gap-3 bg-white text-[#1a1d2b] px-8 py-4 rounded-full font-bold hover:scale-105 transition-all"
                            >
                                <Mail className="w-5 h-5" />
                                Email Support
                            </a>
                            <a 
                                href="https://www.miostore.com"
                                className="inline-flex items-center gap-3 border border-white/20 hover:border-white px-8 py-4 rounded-full font-bold transition-all"
                            >
                                <Globe className="w-5 h-5" />
                                Our Website
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
