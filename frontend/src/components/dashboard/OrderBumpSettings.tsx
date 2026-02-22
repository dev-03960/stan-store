import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMyProducts } from '../../lib/api/products';
import type { BumpConfig } from '../../lib/api/store';
import { Tag, Loader2 } from 'lucide-react';

interface OrderBumpSettingsProps {
    currentProductId?: string;
    bumpConfig?: BumpConfig;
    onChange: (bump: BumpConfig | null) => void;
}

export const OrderBumpSettings: React.FC<OrderBumpSettingsProps> = ({ currentProductId, bumpConfig, onChange }) => {
    const [enabled, setEnabled] = useState(!!bumpConfig);

    const { data: products, isLoading } = useQuery({
        queryKey: ['products'],
        queryFn: getMyProducts
    });

    // Filter out the current product from being its own bump
    const availableProducts = products?.filter(p => p.id !== currentProductId) || [];

    const handleToggle = (checked: boolean) => {
        setEnabled(checked);
        if (!checked) {
            onChange(null);
        } else if (availableProducts.length > 0) {
            onChange({
                bump_product_id: availableProducts[0].id,
                bump_discount: 0
            });
        }
    };

    const updateBump = (updates: Partial<BumpConfig>) => {
        if (!bumpConfig && availableProducts.length > 0) {
            onChange({
                bump_product_id: availableProducts[0].id,
                bump_discount: 0,
                ...updates
            });
        } else if (bumpConfig) {
            onChange({ ...bumpConfig, ...updates });
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-sm text-slate-500 p-4 border rounded-xl bg-slate-50">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading products...
            </div>
        );
    }

    if (availableProducts.length === 0) {
        return (
            <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-500">
                You need at least one other active product to configure an order bump.
            </div>
        );
    }

    return (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                        <Tag className="w-4 h-4 text-indigo-500" />
                        Order Bump
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                        Offer an add-on product at checkout to increase order value
                    </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={enabled}
                        onChange={(e) => handleToggle(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
            </div>

            {enabled && (
                <div className="p-4 space-y-4 bg-white animate-in slide-in-from-top-2 duration-200">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Select Product to Offer
                        </label>
                        <select
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            value={bumpConfig?.bump_product_id || ''}
                            onChange={(e) => updateBump({ bump_product_id: e.target.value })}
                        >
                            {availableProducts.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.title} (₹{p.price / 100})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Discount (₹ INR)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                            <input
                                type="number"
                                min="0"
                                step="1"
                                className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                value={bumpConfig?.bump_discount ? bumpConfig.bump_discount / 100 : ''}
                                onChange={(e) => updateBump({ bump_discount: Number(e.target.value) * 100 })}
                                placeholder="0"
                            />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                            Amount to discount the bump product by when purchased together
                        </p>
                    </div>

                    {bumpConfig?.bump_product_id && (
                        <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                            <p className="text-sm text-indigo-800">
                                <strong>Preview:</strong> The selected product will be offered at{' '}
                                <strong>
                                    ₹{Math.max(0, ((availableProducts.find(p => p.id === bumpConfig.bump_product_id)?.price || 0) - (bumpConfig.bump_discount || 0)) / 100)}
                                </strong>{' '}
                                instead of its normal price.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
