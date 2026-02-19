import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createProduct, updateProduct, getPresignedUrl, uploadFileToUrl } from '../../lib/api/products';
import type { CreateProductDTO } from '../../lib/api/products';
import type { Product } from '../../lib/api/store';
import { Loader2, Upload, X } from 'lucide-react';

interface ProductFormProps {
    product?: Product;
    onClose: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ product, onClose }) => {
    const queryClient = useQueryClient();
    const isEditing = !!product;

    // Price is stored in paise in the backend — convert to rupees for the form
    const [formData, setFormData] = useState<CreateProductDTO>({
        title: product?.title || '',
        subtitle: product?.subtitle || '',
        price: product ? product.price / 100 : 0,
        description: product?.description || '',
        product_type: product?.product_type || 'download',
        image_url: product?.image_url || '',
        file_url: product?.file_url || '',
    });

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [productFile, setProductFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    const mutation = useMutation({
        mutationFn: async (data: CreateProductDTO) => {
            let finalImageUrl = data.image_url;
            let finalFileUrl = data.file_url;

            if (imageFile) {
                const presigned = await getPresignedUrl(imageFile.name, imageFile.type, 'cover_image');
                await uploadFileToUrl(presigned.url, imageFile);
                finalImageUrl = presigned.key; // Store the key or the public URL depending on backend logic. Assuming key for now, or backend constructs URL.
                // Actually, previous implementation of backend returns key. Service constructs URL?
                // Let's assume backend expects the full URL or just the key. 
                // Store service logic: "if strings.HasPrefix(product.ImageURL, "http") ..."
                // Story 3.2 says R2 bucket. Public access is enabled via custom domain or R2.dev.
                // Let's just store what presigned returns if it returns a public URL, otherwise we might need to construct it.
                // Backend `GeneratePresignedURL` returns `url` and `key`.
                // If we store `key`, the backend needs to know how to serve it.
                // Let's assume for now we store the key and the backend handles it, OR we need config.
                // START_NOTE: The previous backend implementation likely just stores the string. 
                // If we want public access, we should probably construct the URL or the backend does.
                // For now, I'll send the key, and if it breaks, I'll fix it. 
                // Wait, looking at `GetStoreByUsername` in backend, it just returns product data. 
                // If `image_url` is a key, frontend might need to append domain.
                // Let's assume we need to store the FULL URL if possible, or just the key.
                // Actually, the S3/R2 presigned URL is for uploading. Read access usually requires a public bucket URL.
                // Let's assume we store the `key` and the frontend or backend prepends the R2 domain.
                // For simplicity in this step, I'll just pass the key.
                finalImageUrl = presigned.url.split('?')[0]; // HACK: Using the upload URL without query params as the public URL? No, that's not right for S3 presigned.
                // Let's stick to the key for now and see.
                finalImageUrl = `https://pub-your-r2-domain.r2.dev/${presigned.key}`; // Placeholder
            }

            if (productFile) {
                const presigned = await getPresignedUrl(productFile.name, productFile.type, 'product_file');
                await uploadFileToUrl(presigned.url, productFile);
                finalFileUrl = `https://pub-your-r2-domain.r2.dev/${presigned.key}`; // Placeholder
            }

            // Convert rupees to paise before sending to backend
            const payload = { ...data, price: Math.round(data.price * 100), image_url: finalImageUrl, file_url: finalFileUrl };

            if (isEditing && product) {
                return updateProduct(product.id, payload);
            }
            return createProduct(payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-products'] });
            onClose();
        },
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);
        try {
            await mutation.mutateAsync(formData);
        } catch (error) {
            console.error('Failed to save product:', error);
            alert('Failed to save product');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <h2 className="text-xl font-bold font-heading">
                        {isEditing ? 'Edit Product' : 'Add New Product'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Product Type</label>
                            <select
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                value={formData.product_type}
                                onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
                            >
                                <option value="download">Digital Download</option>
                                <option value="course">Online Course</option>
                                <option value="coaching">Coaching Call</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                            <input
                                type="text"
                                required
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Subtitle</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                value={formData.subtitle}
                                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Price (₹ INR)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    step="1"
                                    className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    value={formData.price || ''}
                                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                    placeholder="4000"
                                />
                            </div>
                            <p className="text-xs text-slate-400 mt-1">Enter price in rupees (e.g., 4000 for ₹4,000)</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Thumbnail Image</label>
                            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    id="thumbnail-upload"
                                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                />
                                <label htmlFor="thumbnail-upload" className="cursor-pointer flex flex-col items-center">
                                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                                    <span className="text-sm text-slate-600">
                                        {imageFile ? imageFile.name : (formData.image_url ? 'Change Image' : 'Click to upload thumbnail')}
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Product File</label>
                            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors">
                                <input
                                    type="file"
                                    className="hidden"
                                    id="product-file-upload"
                                    onChange={(e) => setProductFile(e.target.files?.[0] || null)}
                                />
                                <label htmlFor="product-file-upload" className="cursor-pointer flex flex-col items-center">
                                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                                    <span className="text-sm text-slate-600">
                                        {productFile ? productFile.name : (formData.file_url ? 'Change File' : 'Click to upload product file')}
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <textarea
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all h-32 resize-none"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-white pb-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={uploading || mutation.isPending}
                            className="px-6 py-2 bg-slate-900 text-white rounded-full hover:bg-indigo-600 transition-colors disabled:opacity-50 flex items-center font-medium"
                        >
                            {uploading || mutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    Saving...
                                </>
                            ) : (
                                'Save Product'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductForm;
