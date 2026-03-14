import { Shield, Clock, Mail, Globe, ArrowRight } from 'lucide-react';

export default function TermsPage() {
    const sections = [
        {
            id: 1,
            title: 'About Mio Store',
            content: 'Mio Store is a creator commerce platform that allows creators, educators, coaches, and freelancers to sell digital products, courses, coaching sessions, memberships, and physical products through a customizable storefront. Mio Store provides the tools and infrastructure for creators to monetize their audience, manage customers, and grow their online business.'
        },
        {
            id: 2,
            title: 'Eligibility',
            content: 'To use Mio Store, you must:\n• Be at least 18 years old\n• Have the legal authority to enter into a binding agreement\n• Provide accurate account information\nBy using the platform, you confirm that you meet these requirements.'
        },
        {
            id: 3,
            title: 'Creator Accounts',
            content: 'Creators who sign up on Mio Store can create a storefront and sell products to their audience.\nCreators are responsible for:\n• Maintaining the security of their account\n• Providing accurate product information\n• Delivering products or services promised to customers\n• Managing their own customer relationships\nMio Store is not responsible for disputes between creators and their customers.'
        },
        {
            id: 4,
            title: 'Products & Content',
            content: 'Creators may sell various types of products including:\n• Digital downloads (ebooks, templates, guides)\n• Online courses\n• Coaching sessions\n• Membership programs\n• Physical products\nCreators retain ownership of their content and products.\nHowever, creators must ensure that their content:\n• Does not violate copyright laws\n• Does not contain illegal or harmful material\n• Does not infringe intellectual property rights\nMio Store reserves the right to remove any content that violates these policies.'
        },
        {
            id: 5,
            title: 'Payments',
            content: 'Mio Store allows creators to accept payments through supported payment providers such as:\n• Razorpay\n• PhonePe\n• Stripe (for global payments)\nPayment processing is handled by third-party payment gateways. Their own terms and processing fees may apply.\nMio Store does not control payment processing delays, disputes, or bank issues caused by payment providers.'
        },
        {
            id: 6,
            title: 'Subscription Pricing',
            content: 'Mio Store currently offers the following pricing:\nMio Store Pro – ₹499 per month\nThis subscription provides access to the platform features including:\n• Creator storefront\n• Digital product selling\n• Course hosting\n• Marketing tools\n• Affiliate system\n• Analytics dashboard\nSubscription fees are billed monthly and may change in the future with prior notice.'
        },
        {
            id: 7,
            title: 'No Transaction Fees',
            content: 'Mio Store does not charge transaction fees on sales made through the platform. However, payment gateways may charge standard processing fees.'
        },
        {
            id: 8,
            title: 'Affiliate Program',
            content: 'Mio Store offers an affiliate program that allows users to invite other creators to the platform.\nAffiliates may earn 20% recurring commission when a referred creator subscribes to Mio Store.\nAffiliate commissions are subject to:\n• Active paid subscriptions\n• Compliance with platform policies\n• Accurate tracking through referral links\nMio Store reserves the right to modify or terminate the affiliate program at any time.'
        },
        {
            id: 9,
            title: 'Creator Responsibilities',
            content: 'Creators are responsible for:\n• Product delivery\n• Customer support\n• Refund policies\n• Legal compliance in their region\nMio Store acts only as a platform provider and does not take responsibility for creator business operations.'
        },
        {
            id: 10,
            title: 'Prohibited Activities',
            content: 'Users may not use Mio Store for:\n• Illegal products or services\n• Fraudulent activity\n• Spam or abusive behavior\n• Copyright infringement\n• Misleading or deceptive content\nAccounts violating these rules may be suspended or permanently removed.'
        },
        {
            id: 11,
            title: 'Platform Availability',
            content: 'We strive to keep Mio Store available at all times. However, we cannot guarantee uninterrupted access due to:\n• System maintenance\n• Technical issues\n• Third-party service interruptions\nMio Store is not liable for any revenue loss caused by temporary downtime.'
        },
        {
            id: 12,
            title: 'Intellectual Property',
            content: 'All platform technology, branding, and design elements of Mio Store are the intellectual property of Mio Store. Users may not copy, reproduce, or distribute platform materials without permission. Creators retain ownership of their own products and content uploaded to the platform.'
        },
        {
            id: 13,
            title: 'Termination',
            content: 'Mio Store reserves the right to suspend or terminate accounts that violate these Terms. Users may also cancel their subscription at any time. Upon termination, access to platform features may be restricted.'
        },
        {
            id: 14,
            title: 'Limitation of Liability',
            content: 'Mio Store is provided "as is" without warranties of any kind.\nWe are not responsible for:\n• Loss of revenue\n• Creator-customer disputes\n• Payment gateway issues\n• Third-party integrations\nUsers agree that they use the platform at their own risk.'
        },
        {
            id: 15,
            title: 'Changes to Terms',
            content: 'Mio Store may update these Terms & Conditions periodically. Users will be notified of significant changes through the platform or email. Continued use of the platform means you accept the updated Terms.'
        },
        {
            id: 16,
            title: 'Contact Information',
            content: 'For questions regarding these Terms & Conditions, you can contact us at:\nEmail: support@miostore.com\nWebsite: www.miostore.com'
        }
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-[#0f111a] py-20 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-16 border-b border-gray-100 dark:border-gray-800 pb-12">
                    <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-500/10 px-4 py-1.5 mb-6 border border-blue-100 dark:border-blue-500/20">
                        <Shield className="w-4 h-4 text-[#6786f5]" />
                        <span className="text-sm font-semibold text-[#6786f5]">Legal Documentation</span>
                    </div>
                    <h1 className="text-4xl sm:text-6xl font-black text-gray-900 dark:text-white mb-6" style={{ fontFamily: "'Lexend', sans-serif" }}>
                        Terms & Conditions
                    </h1>
                    <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>Last Updated: March 2026</span>
                        </div>
                    </div>
                </div>

                {/* Content Intro */}
                <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
                    <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                        Welcome to Mio Store. These Terms & Conditions govern your access to and use of the Mio Store platform, including our website, services, tools, and creator storefront features.
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                        By accessing or using Mio Store, you agree to be bound by these Terms. If you do not agree, please do not use the platform.
                    </p>
                </div>

                {/* Sections */}
                <div className="space-y-12">
                    {sections.map((section) => (
                        <div key={section.id} className="group">
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                                <span className="text-[#6786f5] tabular-nums">{section.id}.</span>
                                {section.title}
                            </h3>
                            <div className="pl-8 sm:pl-10 relative">
                                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-100 dark:bg-gray-800 group-hover:bg-[#6786f5] transition-colors" />
                                <div className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                                    {section.content}
                                </div>
                                {section.id === 16 && (
                                    <div className="mt-8 flex flex-wrap gap-4">
                                        <a 
                                            href="mailto:support@miostore.com"
                                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-[#6786f5] hover:text-[#6786f5] transition-all"
                                        >
                                            <Mail className="w-5 h-5" />
                                            support@miostore.com
                                        </a>
                                        <a 
                                            href="https://www.miostore.com"
                                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-[#6786f5] hover:text-[#6786f5] transition-all"
                                        >
                                            <Globe className="w-5 h-5" />
                                            www.miostore.com
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer CTA */}
                <div className="mt-24 p-12 rounded-[3rem] bg-gradient-to-br from-[#1a1d2b] to-[#0f111a] text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px]" />
                    <div className="relative z-10">
                        <h2 className="text-3xl font-black mb-6">Have questions about our terms?</h2>
                        <p className="text-gray-400 mb-10 max-w-lg mx-auto">
                            Our team is here to help you understand how Miostore works and how we protect our creators.
                        </p>
                        <a 
                            href="mailto:support@miostore.com"
                            className="inline-flex items-center gap-3 bg-[#6786f5] hover:bg-[#5570e0] px-10 py-4 rounded-full font-bold transition-all"
                        >
                            Get in Touch
                            <ArrowRight className="w-5 h-5" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
