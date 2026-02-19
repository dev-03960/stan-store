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
import { Loader2, Plus, GripVertical, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import ProductForm from './ProductForm';

interface SortableProductItemProps {
    product: Product;
    onEdit: (product: Product) => void;
    onToggleVisibility: (id: string, current: boolean) => void;
    onDelete: (id: string) => void;
}

const SortableProductItem = ({ product, onEdit, onToggleVisibility, onDelete }: SortableProductItemProps) => {
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
            className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 group hover:shadow-sm transition-all mb-3"
        >
            <div {...attributes} {...listeners} className="cursor-grab text-slate-400 hover:text-slate-600">
                <GripVertical className="w-5 h-5" />
            </div>

            <div className="w-12 h-12 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden">
                {product.image_url ? (
                    <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-indigo-50 flex items-center justify-center text-indigo-500 font-bold">
                        {product.title.charAt(0)}
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 truncate">{product.title}</h3>
                <p className="text-sm text-slate-500 truncate">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(product.price / 100)} • {product.product_type}
                </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-2 ml-auto sm:ml-0">
                <button
                    onClick={() => onToggleVisibility(product.id, product.is_visible ?? true)}
                    className={`p-2 rounded-full transition-colors ${product.is_visible ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:bg-slate-100'
                        }`}
                    title={product.is_visible ? 'Visible' : 'Hidden'}
                >
                    {product.is_visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
                <button
                    onClick={() => onEdit(product)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                    title="Edit"
                >
                    <Edit2 className="w-5 h-5" />
                </button>
                <button
                    onClick={() => onDelete(product.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
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
    const [isFormOpen, setIsFormOpen] = useState(false);

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
            // Optimistic update would be better here, but for simplicity we'll just mutate
            const oldIndex = products.findIndex((p) => p.id === active.id);
            const newIndex = products.findIndex((p) => p.id === over?.id);

            const newOrder = arrayMove(products, oldIndex, newIndex);

            // Trigger generic reorder API
            reorderMutation.mutate(
                newOrder.map((p, index) => ({ id: p.id, sort_order: index }))
            );
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold font-heading text-slate-900">Products</h1>
                    <p className="text-slate-500">Manage your digital products and services</p>
                </div>
                <button
                    onClick={() => { setEditingProduct(undefined); setIsFormOpen(true); }}
                    className="bg-slate-900 text-white px-4 py-2 rounded-full hover:bg-indigo-600 transition-colors flex items-center gap-2 font-medium shadow-sm hover:shadow-md"
                >
                    <Plus className="w-5 h-5" />
                    Add Product
                </button>
            </div>

            <div className="space-y-4">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={products.map((p) => p.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {products.map((product) => (
                            <SortableProductItem
                                key={product.id}
                                product={product}
                                onEdit={(p) => { setEditingProduct(p); setIsFormOpen(true); }}
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

                {products.length === 0 && (
                    <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                        <p className="text-slate-500">No products yet. Add your first product!</p>
                    </div>
                )}
            </div>

            {isFormOpen && (
                <ProductForm
                    product={editingProduct}
                    onClose={() => setIsFormOpen(false)}
                />
            )}
        </div>
    );
};

export default ProductList;
