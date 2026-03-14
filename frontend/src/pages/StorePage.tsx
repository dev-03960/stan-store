import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getStoreByUsername, type Product } from '../lib/api/store';
import StoreHeader from '../components/store/StoreHeader';
import ProductCard from '../components/store/ProductCard';
import StoreSkeleton from '../components/store/StoreSkeleton';
import CheckoutModal from '../components/store/CheckoutModal';
import { PublicTestimonials } from '../components/store/PublicTestimonials';
import { AlertCircle } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1
        }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            duration: 0.8,
            bounce: 0.3
        }
    }
};

const StorePage: React.FC = () => {
    const { username } = useParams<{ username: string }>();
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

    const { data: store, isLoading, error } = useQuery({
        queryKey: ['store', username],
        queryFn: () => getStoreByUsername(username!),
        enabled: !!username,
        retry: 1
    });

    const handleBuy = (product: Product) => {
        setSelectedProduct(product);
        setIsCheckoutOpen(true);
    };

    const handleCloseCheckout = () => {
        setIsCheckoutOpen(false);
        setSelectedProduct(null);
    };

    if (isLoading) {
        return <StoreSkeleton />;
    }

    if (error || !store) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#0f111a] flex flex-col items-center justify-center p-6 text-center">
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-20 h-20 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mb-6"
                >
                    <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                </motion.div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Store Not Found</h1>
                <p className="text-slate-600 dark:text-slate-400 max-w-md font-medium">
                    The storefront you are looking for does not exist or has been removed.
                </p>
            </div>
        );
    }

    const brandColor = store.creator.brandColor;
    const fontFamily = store.creator.fontFamily;
    const styleOverrides: React.CSSProperties = {
        color: 'var(--theme-text-primary)',
    };

    if (store.creator.theme !== 'gradient') {
        styleOverrides.backgroundColor = 'var(--theme-bg)';
    }

    if (fontFamily) {
        styleOverrides.fontFamily = fontFamily;
    }

    return (
        <div
            className={`min-h-screen pb-24 selection:bg-indigo-500 selection:text-white ${store.creator.theme === 'gradient' ? 'bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-[#0f111a] dark:via-[#1a1d2b] dark:to-[#0f111a]' : ''}`}
            data-theme={store.creator.theme || 'minimal'}
            style={{
                ...styleOverrides,
                ...(brandColor ? {
                    '--theme-accent': brandColor,
                    '--theme-accent-hover': brandColor,
                } as React.CSSProperties : {}),
            }}
        >
            <main className="container mx-auto px-4 sm:px-6 max-w-2xl lg:max-w-3xl">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="pt-6 sm:pt-12"
                >
                    <motion.div variants={itemVariants}>
                        <StoreHeader profile={store.creator} />
                    </motion.div>

                    <motion.div
                        variants={containerVariants}
                        className="mt-10 sm:mt-16 space-y-6 sm:space-y-8"
                    >
                        {store.products.length > 0 ? (
                            store.products.map((product) => (
                                <motion.div key={product.id} variants={itemVariants} className="group">
                                    <ProductCard
                                        product={product}
                                        onBuy={handleBuy}
                                    />
                                    <div className="mt-4 px-2">
                                        <PublicTestimonials productId={product.id} />
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <motion.div
                                variants={itemVariants}
                                className="text-center py-20 px-6 rounded-[2rem] border-2 border-dashed border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-white/5 backdrop-blur-sm"
                            >
                                <p className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--theme-text-secondary, #64748b)' }}>
                                    No products available yet.
                                </p>
                            </motion.div>
                        )}
                    </motion.div>
                </motion.div>
            </main>

            <footer className="mt-20 text-center pb-12">
                <p className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: 'var(--theme-text-secondary, #94a3b8)' }}>
                    Powered by <span className="text-indigo-600 dark:text-indigo-400">Miostore</span>
                </p>
            </footer>

            {isCheckoutOpen && selectedProduct && (
                <CheckoutModal
                    isOpen={isCheckoutOpen}
                    onClose={handleCloseCheckout}
                    product={selectedProduct}
                    allProducts={store.products}
                />
            )}
        </div>
    );
};

export default StorePage;
