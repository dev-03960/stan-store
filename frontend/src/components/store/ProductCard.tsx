import React from 'react';
import type { Product } from '../../lib/api/store';
import { ArrowRight, FileText, BookOpen, Video } from 'lucide-react';

interface ProductCardProps {
    product: Product;
    onBuy: (product: Product) => void;
}

const getProductTypeIcon = (type: string) => {
    switch (type) {
        case 'course': return <BookOpen className="w-5 h-5" />;
        case 'coaching': return <Video className="w-5 h-5" />;
        default: return <FileText className="w-5 h-5" />;
    }
};

const getProductTypeLabel = (type: string) => {
    switch (type) {
        case 'course': return 'Online Course';
        case 'coaching': return 'Coaching Call';
        default: return 'Digital Download';
    }
};

const ProductCard: React.FC<ProductCardProps> = ({ product, onBuy }) => {
    return (
        <div
            className="block w-full max-w-2xl mx-auto bg-white rounded-xl shadow-sm hover:shadow-md border border-slate-100 overflow-hidden transition-all duration-200 hover:-translate-y-1 group cursor-pointer"
            onClick={() => onBuy(product)}
        >
            <div className="flex p-4 items-center gap-4">
                {/* Product Image / Placeholder */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-indigo-50 to-purple-50">
                    {product.image_url ? (
                        <img
                            src={product.image_url}
                            alt={product.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-indigo-400">
                            {getProductTypeIcon(product.product_type)}
                            <span className="text-[10px] mt-1 font-medium text-indigo-300">
                                {getProductTypeLabel(product.product_type)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Product Content */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 text-base sm:text-lg leading-tight truncate">
                        {product.title}
                    </h3>
                    {product.subtitle && (
                        <p className="text-sm text-slate-500 mt-0.5 truncate">
                            {product.subtitle}
                        </p>
                    )}
                    {product.description && (
                        <p className="text-xs sm:text-sm text-slate-400 mt-1 line-clamp-2 hidden sm:block">
                            {product.description}
                        </p>
                    )}
                    <span className="inline-block mt-1.5 text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                        {getProductTypeLabel(product.product_type)}
                    </span>
                </div>

                {/* Price & CTA */}
                <div className="flex-shrink-0 flex flex-col items-end">
                    <span className="text-lg font-bold text-slate-900 mb-2">
                        {new Intl.NumberFormat('en-IN', {
                            style: 'currency',
                            currency: 'INR',
                            minimumFractionDigits: 0
                        }).format(product.price / 100)}
                    </span>
                    <button className="bg-slate-900 text-white p-2 rounded-full group-hover:bg-indigo-600 transition-colors">
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
