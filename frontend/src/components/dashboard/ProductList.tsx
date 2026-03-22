import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getMyProducts, updateVisibility, deleteProduct, reorderProducts } from '../../lib/api/products';
import type { Product } from '../../lib/api/store';
import { Loader2, Plus, GripVertical, Edit2, Trash2, Eye, EyeOff, Mail, FileText, Video, BookOpen, Users, ArrowLeft, BarChart3 } from 'lucide-react';
import ProductForm from './ProductForm';
import { AffiliateAnalyticsModal } from './AffiliateAnalyticsModal';

// Category definitions (matching ProductForm PRODUCT_TYPES)
const CATEGORIES = [
    {
        id: 'lead_magnet',
        name: 'Lead Magnets',
        icon: Mail,
        color: 'from-blue-600 to-indigo-700',
        bgLight: 'bg-indigo-50',
        bgDark: 'dark:bg-indigo-500/10',
    },
    {
        id: 'download',
        name: 'Digital Products',
        icon: FileText,
        color: 'from-blue-400 to-indigo-500',
        bgLight: 'bg-blue-50',
        bgDark: 'dark:bg-blue-500/10',
    },
    {
        id: 'booking',
        name: 'Coaching Calls',
        icon: Video,
        color: 'from-green-400 to-emerald-500',
        bgLight: 'bg-green-50',
        bgDark: 'dark:bg-green-500/10',
    },
    {
        id: 'course',
        name: 'eCourses',
        icon: BookOpen,
        color: 'from-purple-400 to-violet-500',
        bgLight: 'bg-[#6786f50d]',
        bgDark: 'dark:bg-indigo-500/10',
    },
    {
        id: 'membership',
        name: 'Memberships',
        icon: Users,
        color: 'from-cyan-400 to-teal-500',
        bgLight: 'bg-cyan-50',
        bgDark: 'dark:bg-cyan-500/10',
    },
];

interface SortableProductItemProps {
    product: Product;
    onEdit: (product: Product) => void;
    onToggleVisibility: (id: string, current: boolean) => void;
    onDelete: (id: string) => void;
    onViewAnalytics: (product: Product) => void;
}

const SortableProductItem = ({ product, onEdit, onToggleVisibility, onDelete, onViewAnalytics }: SortableProductItemProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: product.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-white dark:bg-[#1e2135] border border-slate-200 dark:border-gray-700 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 group hover:shadow-sm transition-all mb-3"
        >
            <div {...attributes} {...listeners} className="cursor-grab text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300">
                <GripVertical className="w-5 h-5" />
            </div>

            <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-gray-700 flex-shrink-0 overflow-hidden">
                {product.cover_image_url ? (
                    <img src={product.cover_image_url} alt={product.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-500 font-bold">
                        {product.title.charAt(0)}
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 dark:text-white truncate">{product.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-slate-500 dark:text-gray-400 truncate">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(product.price / 100)}
                    </p>
                    <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${product.product_type === 'lead_magnet' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' :
                                product.product_type === 'course' ? 'bg-[#6786f51a] text-[#5570e0] dark:bg-indigo-500/20 dark:text-indigo-400' :
                                    product.product_type === 'booking' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                        product.product_type === 'membership' ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400' :
                                            'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                            }`}
                    >
                        {product.product_type === 'lead_magnet' ? 'Lead Magnet' :
                            product.product_type === 'course' ? 'Course' :
                                product.product_type === 'booking' ? 'Coaching' :
                                    product.product_type === 'membership' ? 'Membership' :
                                        'Digital Download'}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-2 ml-auto sm:ml-0">
                <button
                    onClick={() => onToggleVisibility(product.id, product.is_visible ?? true)}
                    className={`p-2 rounded-full transition-colors ${product.is_visible ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/20' : 'text-slate-400 dark:text-gray-500 hover:bg-slate-100 dark:hover:bg-white/5'
                        }`}
                    title={product.is_visible ? 'Visible' : 'Hidden'}
                >
                    {product.is_visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
                {product.affiliate_enabled && (
                    <button
                        onClick={() => onViewAnalytics(product)}
                        className="p-2 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-full transition-colors"
                        title="Affiliate Analytics"
                    >
                        <BarChart3 className="w-5 h-5" />
                    </button>
                )}
                <button
                    onClick={() => onEdit(product)}
                    className="p-2 text-slate-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-full transition-colors"
                    title="Edit"
                >
                    <Edit2 className="w-5 h-5" />
                </button>
                <button
                    onClick={() => onDelete(product.id)}
                    className="p-2 text-slate-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors"
                    title="Delete"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

const ProductList: React.FC = () => {
    const queryClient = useQueryClient();
    const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
    const [analyticsProduct, setAnalyticsProduct] = useState<Product | undefined>(undefined);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const { data: products = [], isLoading } = useQuery({
        queryKey: ['my-products'],
        queryFn: getMyProducts,
    });

    const visibilityMutation = useMutation({
        mutationFn: ({ id, isVisible }: { id: string; isVisible: boolean }) =>
            updateVisibility(id, isVisible),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-products'] }),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteProduct,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-products'] }),
    });

    const reorderMutation = useMutation({
        mutationFn: reorderProducts,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-products'] }),
    });

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = filteredProducts.findIndex((p) => p.id === active.id);
            const newIndex = filteredProducts.findIndex((p) => p.id === over?.id);

            const newOrder = arrayMove(filteredProducts, oldIndex, newIndex);

            reorderMutation.mutate(
                newOrder.map((p, index) => ({ id: p.id, sort_order: index }))
            );
        }
    };

    // Count products per category
    const categoryCounts = CATEGORIES.reduce((acc, cat) => {
        acc[cat.id] = products.filter(p => p.product_type === cat.id).length;
        return acc;
    }, {} as Record<string, number>);

    // Filter products by selected category
    const filteredProducts = selectedCategory
        ? products.filter(p => p.product_type === selectedCategory)
        : products;

    const handleAddProduct = () => {
        setEditingProduct(undefined);
        setIsFormOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold font-heading text-slate-900 dark:text-white">Products</h1>
                    <p className="text-slate-500 dark:text-gray-400">Manage your digital products and services</p>
                </div>
                {!selectedCategory && (
                    <button
                        onClick={handleAddProduct}
                        className="bg-slate-900 dark:bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-colors flex items-center gap-2 font-medium shadow-sm hover:shadow-md"
                    >
                        <Plus className="w-5 h-5" />
                        Add Product
                    </button>
                )}
            </div>

            {/* Category Cards */}
            {!selectedCategory ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
                    {CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        const count = categoryCounts[cat.id] || 0;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`${cat.bgLight} ${cat.bgDark} border border-transparent hover:border-gray-200 dark:hover:border-gray-600 rounded-xl p-4 text-left transition-all hover:shadow-md group`}
                            >
                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-sm mb-3`}>
                                    <Icon className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="font-semibold text-slate-800 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                    {cat.name}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                                    {count} {count === 1 ? 'product' : 'products'}
                                </p>
                            </button>
                        );
                    })}
                </div>
            ) : (
                /* Category Header with Back + Add */
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className="flex items-center gap-2 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        All Categories
                    </button>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-500 dark:text-gray-400">
                            {CATEGORIES.find(c => c.id === selectedCategory)?.name}
                        </span>
                        <button
                            onClick={handleAddProduct}
                            className="bg-slate-900 dark:bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-colors flex items-center gap-2 font-medium shadow-sm hover:shadow-md text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Add Product
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={filteredProducts.map((p) => p.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {filteredProducts.map((product) => (
                            <SortableProductItem
                                key={product.id}
                                product={product}
                                onEdit={(p) => { setEditingProduct(p); setIsFormOpen(true); }}
                                onViewAnalytics={(p) => setAnalyticsProduct(p)}
                                onToggleVisibility={(id, current) => visibilityMutation.mutate({ id, isVisible: !current })}
                                onDelete={(id) => {
                                    if (confirm('Are you sure you want to delete this product?')) {
                                        deleteMutation.mutate(id);
                                    }
                                }}
                            />
                        ))}
                    </SortableContext>
                </DndContext>

                {filteredProducts.length === 0 && (
                    <div className="text-center py-12 bg-slate-50 dark:bg-[#1e2135] rounded-xl border-2 border-dashed border-slate-200 dark:border-gray-700">
                        <p className="text-slate-500 dark:text-gray-400">
                            {selectedCategory
                                ? `No ${CATEGORIES.find(c => c.id === selectedCategory)?.name.toLowerCase()} yet. Add your first one!`
                                : 'No products yet. Add your first product!'}
                        </p>
                    </div>
                )}
            </div>

            {isFormOpen && (
                <ProductForm
                    product={editingProduct}
                    defaultProductType={selectedCategory || undefined}
                    onClose={() => setIsFormOpen(false)}
                />
            )}

            {analyticsProduct && (
                <AffiliateAnalyticsModal 
                    isOpen={!!analyticsProduct}
                    onClose={() => setAnalyticsProduct(undefined)}
                    product={analyticsProduct}
                />
            )}
        </div>
    );
};

export default ProductList;
