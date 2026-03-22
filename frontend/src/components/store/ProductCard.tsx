import { motion } from 'framer-motion';
import type { Product } from '../../lib/api/store';
import { ArrowRight, FileText, BookOpen, Video, Star, ExternalLink } from 'lucide-react';

interface ProductCardProps {
    product: Product;
    onBuy: (product: Product) => void;
}

const getProductTypeIcon = (type: string) => {
    switch (type) {
        case 'course': return <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />;
        case 'coaching': return <Video className="w-5 h-5 sm:w-6 sm:h-6" />;
        case 'external_link': return <ExternalLink className="w-5 h-5 sm:w-6 sm:h-6" />;
        default: return <FileText className="w-5 h-5 sm:w-6 sm:h-6" />;
    }
};

const getProductTypeLabel = (type: string) => {
    switch (type) {
        case 'course': return 'Online Course';
        case 'coaching': return 'Coaching Call';
        case 'membership': return 'Membership';
        case 'external_link': return 'External Link';
        default: return 'Digital Download';
    }
};

const ProductCard: React.FC<ProductCardProps> = ({ product, onBuy }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="block w-full max-w-2xl mx-auto rounded-2xl shadow-sm hover:shadow-xl border overflow-hidden transition-shadow duration-300 group cursor-pointer"
            style={{
                backgroundColor: 'var(--theme-surface)',
                borderColor: 'var(--theme-border)',
            }}
            onClick={() => onBuy(product)}
        >
            <div className="flex p-3 sm:p-5 items-center gap-3 sm:gap-6">
                {/* Product Image / Placeholder */}
                <div
                    className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl overflow-hidden flex-shrink-0 relative"
                    style={{ backgroundColor: 'var(--theme-bg)', opacity: 0.8 }}
                >
                    {product.cover_image_url ? (
                        <img
                            src={product.cover_image_url}
                            alt={product.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                    ) : (
                        <div
                            className="w-full h-full flex flex-col items-center justify-center"
                            style={{ color: 'var(--theme-accent)' }}
                        >
                            {getProductTypeIcon(product.product_type)}
                            <span className="text-[8px] sm:text-[10px] mt-1 font-bold uppercase tracking-wider opacity-60">
                                {product.product_type}
                            </span>
                        </div>
                    )}
                </div>

                {/* Product Content */}
                <div className="flex-1 min-w-0 py-1">
                    <div className="flex items-center gap-1.5 mb-1 sm:mb-2">
                        <span
                            className="inline-flex items-center text-[10px] sm:text-[11px] font-bold uppercase tracking-tight"
                            style={{ color: 'var(--theme-accent)' }}
                        >
                            {getProductTypeLabel(product.product_type)}
                        </span>
                        {product.product_type === 'course' && (
                            <div className="flex items-center text-amber-500">
                                <Star className="w-3 h-3 fill-current" />
                                <span className="text-[10px] font-bold ml-0.5">PREMIUM</span>
                            </div>
                        )}
                    </div>
                    <h3
                        className="font-bold text-base sm:text-xl leading-snug truncate mb-1 transition-colors"
                        style={{ color: 'var(--theme-text-primary)' }}
                    >
                        {product.title}
                    </h3>
                    {product.subtitle && (
                        <p
                            className="text-xs sm:text-sm truncate leading-relaxed opacity-70"
                            style={{ color: 'var(--theme-text-secondary)' }}
                        >
                            {product.subtitle}
                        </p>
                    )}
                </div>

                {/* Price & CTA */}
                <div className="flex-shrink-0 flex flex-col items-end pl-2">
                    <div className="text-right mb-2">
                        {product.product_type === 'external_link' ? (
                            <span
                                className="block text-sm sm:text-base font-bold"
                                style={{ color: 'var(--theme-accent)' }}
                            >
                                {product.button_text || 'Visit Link'}
                            </span>
                        ) : (
                            <>
                                <span
                                    className="block text-base sm:text-2xl font-black tracking-tighter"
                                    style={{ color: 'var(--theme-text-primary)' }}
                                >
                                    {new Intl.NumberFormat('en-IN', {
                                        style: 'currency',
                                        currency: 'INR',
                                        minimumFractionDigits: 0
                                    }).format(product.price / 100)}
                                </span>
                                {product.product_type === 'membership' && (
                                    <span
                                        className="text-[10px] sm:text-xs font-medium block -mt-1 uppercase tracking-widest opacity-50"
                                        style={{ color: 'var(--theme-text-secondary)' }}
                                    >
                                        PER {product.subscription_interval === 'yearly' ? 'YEAR' : 'MONTH'}
                                    </span>
                                )}
                            </>
                        )}
                    </div>
                    <button
                        className="p-2 sm:p-3 rounded-full transition-all shadow-lg scale-90 sm:scale-100"
                        style={{
                            backgroundColor: 'var(--theme-accent)',
                            color: 'var(--theme-button-text, #fff)',
                        }}
                    >
                        {product.product_type === 'external_link'
                            ? <ExternalLink className="w-5 h-5 sm:w-6 sm:h-6" />
                            : <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                        }
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default ProductCard;
