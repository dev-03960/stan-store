import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getStoreByUsername, type Product } from '../lib/api/store';
import StoreHeader from '../components/store/StoreHeader';
import ProductCard from '../components/store/ProductCard';
import StoreSkeleton from '../components/store/StoreSkeleton';
import CheckoutModal from '../components/store/CheckoutModal';
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

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Mobile-optimized Layout */}
            <main className="container mx-auto px-4 max-w-3xl">
                <StoreHeader profile={store.creator} />

                <div className="mt-6 space-y-4">
                    {store.products.length > 0 ? (
                        store.products.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onBuy={handleBuy}
                            />
                        ))
                    ) : (
                        <div className="text-center py-12 bg-white rounded-xl border border-slate-100 shadow-sm">
                            <p className="text-slate-500">No products available yet.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Powered By Footer */}
            <footer className="mt-12 text-center pb-8">
                <p className="text-xs text-slate-400">
                    Powered by <span className="font-bold text-slate-600">Stan Store Clone</span>
                </p>
            </footer>

            {/* Checkout Modal */}
            {selectedProduct && (
                <CheckoutModal
                    isOpen={isCheckoutOpen}
                    onClose={handleCloseCheckout}
                    product={selectedProduct}
                />
            )}
        </div>
    );
};

export default StorePage;
