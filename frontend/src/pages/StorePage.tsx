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
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Store Not Found</h1>
                <p className="text-slate-600 max-w-md">
                    The storefront you are looking for does not exist or has been removed.
                </p>
            </div>
        );
    }

    // Apply brand color as CSS custom property override
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
            className={`min-h-screen pb-20 ${store.creator.theme === 'gradient' ? 'bg-gradient-to-br from-purple-100 to-pink-100' : ''}`}
            data-theme={store.creator.theme || 'minimal'}
            style={{
                ...styleOverrides,
                // Override accent color if brand color is set
                ...(brandColor ? {
                    '--theme-accent': brandColor,
                    '--theme-accent-hover': brandColor,
                } as React.CSSProperties : {}),
            }}
        >
            {/* Mobile-optimized Layout */}
            <main className="container mx-auto px-4 max-w-3xl">
                <div className="pt-4">
                    <StoreHeader profile={store.creator} />
                </div>

                <div className="mt-6 space-y-4">
                    {store.products.length > 0 ? (
                        store.products.map((product) => (
                            <div key={product.id}>
                                <ProductCard
                                    product={product}
                                    onBuy={handleBuy}
                                />
                                <PublicTestimonials productId={product.id} />
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 rounded-xl border shadow-sm" style={{
                            backgroundColor: 'var(--theme-surface, #fff)',
                            borderColor: 'var(--theme-border, #e2e8f0)',
                        }}>
                            <p style={{ color: 'var(--theme-text-secondary, #64748b)' }}>No products available yet.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Powered By Footer */}
            <footer className="mt-12 text-center pb-8">
                <p className="text-xs" style={{ color: 'var(--theme-text-secondary, #94a3b8)' }}>
                    Powered by <span className="font-bold" style={{ color: 'var(--theme-text-primary, #475569)' }}>Mio Store</span>
                </p>
            </footer>

            {/* Checkout Modal */}
            {selectedProduct && (
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
