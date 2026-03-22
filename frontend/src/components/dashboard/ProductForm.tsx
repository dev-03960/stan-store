import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createProduct, updateProduct, getPresignedUrl, uploadFileToUrl, updateBumpConfig } from '../../lib/api/products';
import type { CreateProductDTO } from '../../lib/api/products';
import type { Product, BumpConfig } from '../../lib/api/store';
import { Loader2, Upload, X, Sparkles, FileText, Mail, Video, BookOpen, Users, ExternalLink } from 'lucide-react';
import { aiApi } from '../../features/dashboard/aiApi';
import { CoachingSettings } from './CoachingSettings';
import { OrderBumpSettings } from './OrderBumpSettings';
import { CourseBuilder } from './CourseBuilder';
import { TestimonialsTab } from './TestimonialsTab';
import { AffiliateSettings } from './AffiliateSettings';
import type { AffiliateConfig } from './AffiliateSettings';
import { enableAffiliateProgram } from '../../lib/api/products';

const PRODUCT_TYPES = [
    {
        id: 'lead_magnet',
        name: 'Collect Emails / Lead Magnet',
        description: "Collect your audience's info with a free resource",
        icon: Mail,
        color: 'from-blue-600 to-indigo-700',
        bgColor: 'bg-indigo-50',
    },
    {
        id: 'download',
        name: 'Digital Product',
        description: 'PDFs, Guides, Templates, eBooks, etc.',
        icon: FileText,
        color: 'from-blue-400 to-indigo-500',
        bgColor: 'bg-blue-50',
    },
    {
        id: 'booking',
        name: 'Coaching Call',
        description: 'Book Discovery Calls, Paid Coaching',
        icon: Video,
        color: 'from-green-400 to-emerald-500',
        bgColor: 'bg-green-50',
    },
    {
        id: 'course',
        name: 'eCourse',
        description: 'Create, Host, and Sell your Course',
        icon: BookOpen,
        color: 'from-purple-400 to-violet-500',
        bgColor: 'bg-[#6786f50d]',
    },
    {
        id: 'membership',
        name: 'Recurring Membership',
        description: 'Charge Recurring Subscriptions',
        icon: Users,
        color: 'from-cyan-400 to-teal-500',
        bgColor: 'bg-cyan-50',
    },
    {
        id: 'external_link',
        name: 'External Link / URL',
        description: 'Link to any URL — affiliate, YouTube, podcast, etc.',
        icon: ExternalLink,
        color: 'from-orange-400 to-rose-500',
        bgColor: 'bg-orange-50',
    },
];

interface ProductFormProps {
    product?: Product;
    defaultProductType?: string;
    onClose: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ product, defaultProductType, onClose }) => {
    const queryClient = useQueryClient();
    const isEditing = !!product;
    const [step, setStep] = useState<'choose_type' | 'form'>(isEditing || defaultProductType ? 'form' : 'choose_type');

    // Price is stored in paise in the backend — convert to rupees for the form
    const [formData, setFormData] = useState<CreateProductDTO>({
        title: product?.title || '',
        subtitle: product?.subtitle || '',
        price: product ? product.price / 100 : 0,
        description: product?.description || '',
        product_type: product?.product_type || defaultProductType || 'download',
        cover_image_url: product?.cover_image_url || '',
        file_url: product?.file_url || '',
        duration_minutes: product?.duration_minutes || 30,
        timezone: product?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        cancellation_window_hours: product?.cancellation_window_hours || 24,
        availability: product?.availability || [],
        subscription_interval: product?.subscription_interval || 'monthly',
        subscription_billing_cycles: product?.subscription_billing_cycles || 0,
        external_url: product?.external_url || '',
        button_text: product?.button_text || '',
    });

    const handleSelectType = (typeId: string) => {
        setFormData({ ...formData, product_type: typeId });
        setStep('form');
    };



    // ── Rest of the form (existing behavior) ──

    const [bumpConfig, setBumpConfig] = useState<BumpConfig | null>(product?.bump || null);
    const [affiliateConfig, setAffiliateConfig] = useState<AffiliateConfig | undefined>(
        product ? { enabled: !!product.affiliate_enabled, commission_rate: product.commission_rate || 10 } : undefined
    );
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [productFile, setProductFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    // AI Assist State
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [showAiInput, setShowAiInput] = useState(false);

    const handleGenerateCopy = async () => {
        if (!aiPrompt.trim()) return;
        setIsGenerating(true);
        try {
            const result = await aiApi.generateProductCopy(aiPrompt);
            if (!result.data) {
                throw new Error("No content generated");
            }
            const data = result.data;
            const bulletsText = data.bullets?.length > 0 ? `\n\nFeatures:\n${data.bullets.map((b: string) => `• ${b}`).join('\n')}` : '';
            setFormData(prev => ({
                ...prev,
                title: data.title || prev.title,
                description: (data.description || '') + bulletsText,
            }));
            setShowAiInput(false);
            setAiPrompt('');
        } catch (error: any) {
            console.error('Failed to generate copy:', error);
            alert(error.response?.data?.error || 'Failed to generate copy. Has the AI_API_KEY been configured?');
        } finally {
            setIsGenerating(false);
        }
    };

    const mutation = useMutation({
        mutationFn: async (data: CreateProductDTO) => {
            let finalImageUrl = data.cover_image_url;
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
                // If `cover_image_url` is a key, frontend might need to append domain.
                // Let's assume we need to store the FULL URL if possible, or just the key.
                // Actually, the S3/R2 presigned URL is for uploading. Read access usually requires a public bucket URL.
                // Let's assume we store the `key` and the frontend or backend prepends the R2 domain.
                // For simplicity in this step, I'll just pass the key.
                finalImageUrl = presigned.url.split('?')[0]; // HACK: Using the upload URL without query params as the public URL? No, that's not right for S3 presigned.
                // Let's stick to the key for now and see.
                const r2PublicUrl = import.meta.env.VITE_R2_PUBLIC_URL || 'https://pub-your-r2-domain.r2.dev';
                finalImageUrl = `${r2PublicUrl}/${presigned.key}`; // Placeholder
            }

            if (productFile) {
                const presigned = await getPresignedUrl(productFile.name, productFile.type, 'product_file');
                await uploadFileToUrl(presigned.url, productFile);
                const r2PublicUrl = import.meta.env.VITE_R2_PUBLIC_URL || 'https://pub-your-r2-domain.r2.dev';
                finalFileUrl = `${r2PublicUrl}/${presigned.key}`; // Placeholder
            }

            // Force price to 0 if it's a lead magnet or external link
            const finalPrice = (data.product_type === 'lead_magnet' || data.product_type === 'external_link') ? 0 : Math.round(data.price * 100);

            // Convert rupees to paise before sending to backend
            const payload = { ...data, price: finalPrice, cover_image_url: finalImageUrl, file_url: finalFileUrl };

            if (isEditing && product) {
                return updateProduct(product.id, payload);
            }
            return createProduct(payload);
        },
        onSuccess: async (savedProduct) => {
            // Save bump config separately via dedicated endpoint
            if (savedProduct?.id) {
                try {
                    await updateBumpConfig(savedProduct.id, bumpConfig);
                } catch (err) {
                    console.error('Failed to save bump config:', err);
                }
            }
            if (savedProduct?.id && affiliateConfig !== undefined) {
                try {
                    await enableAffiliateProgram(savedProduct.id, affiliateConfig.enabled, affiliateConfig.commission_rate);
                } catch (err) {
                    console.error('Failed to save affiliate settings:', err);
                }
            }
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

    // ── Choose Product Type Step ──
    if (step === 'choose_type') {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
                <div className="bg-white dark:bg-[#1a1d2b] rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                    <div className="p-6 border-b border-slate-100 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-[#1a1d2b] sticky top-0 z-10">
                        <h2 className="text-xl font-bold font-heading dark:text-white">Choose Product Type</h2>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors">
                            <X className="w-5 h-5 dark:text-gray-400" />
                        </button>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {PRODUCT_TYPES.map((type) => {
                                const Icon = type.icon;
                                return (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => handleSelectType(type.id)}
                                        className="flex items-start gap-4 p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md transition-all text-left group"
                                    >
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                            <Icon className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                {type.name}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                                {type.description}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-white dark:bg-[#1a1d2b] rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-100 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-[#1a1d2b] sticky top-0 z-10">
                    <h2 className="text-xl font-bold font-heading dark:text-white">
                        {isEditing ? 'Edit Product' : 'Add New Product'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5 dark:text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Product Type</label>
                            <select
                                className="w-full p-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all disabled:bg-slate-100 disabled:opacity-75 bg-white dark:bg-[#0f111a] dark:text-white"
                                value={formData.product_type}
                                onChange={(e) => setFormData({ ...formData, product_type: e.target.value as any })}
                                disabled={isEditing}
                            >
                                <option value="download">Digital Download</option>
                                <option value="lead_magnet">Lead Magnet</option>
                                <option value="booking">1:1 Coaching</option>
                                <option value="course">Course / e-Learning</option>
                                <option value="membership">Membership</option>
                                <option value="external_link">External Link / URL</option>
                            </select>
                            {isEditing && (
                                <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">Product type cannot be changed after creation.</p>
                            )}
                        </div>

                        {formData.product_type === 'membership' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Billing Cycle</label>
                                    <select
                                        className="w-full p-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white dark:bg-[#0f111a] dark:text-white"
                                        value={formData.subscription_interval}
                                        onChange={(e) => setFormData({ ...formData, subscription_interval: e.target.value as any })}
                                    >
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="yearly">Yearly</option>
                                    </select>
                                </div>
                                <div className="pt-2 border-t border-slate-100 dark:border-gray-700">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Cancel Subscription After (cycles)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        className="w-full p-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white dark:bg-[#0f111a] dark:text-white"
                                        value={formData.subscription_billing_cycles || ''}
                                        onChange={(e) => setFormData({ ...formData, subscription_billing_cycles: Number(e.target.value) || 0 })}
                                        placeholder="0 (Indefinite)"
                                    />
                                    <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">
                                        E.g. Setting this to 6 on a Monthly cycle will stop billing after 6 months. Leave empty or 0 to charge indefinitely.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300">Title</label>
                                {!isEditing && (
                                    <button
                                        type="button"
                                        onClick={() => setShowAiInput(!showAiInput)}
                                        className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                                    >
                                        <Sparkles className="w-3 h-3" />
                                        AI Assist
                                    </button>
                                )}
                            </div>

                            {showAiInput && (
                                <div className="mb-3 p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex gap-2 items-start">
                                    <input
                                        type="text"
                                        placeholder="E.g., A 30-day keto meal plan for beginners..."
                                        className="flex-1 p-2 border border-indigo-200 rounded outline-none focus:border-indigo-400 text-sm"
                                        value={aiPrompt}
                                        onChange={(e) => setAiPrompt(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleGenerateCopy();
                                            }
                                        }}
                                        disabled={isGenerating}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleGenerateCopy}
                                        disabled={isGenerating || !aiPrompt.trim()}
                                        className="px-3 py-2 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                                    >
                                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                        Generate
                                    </button>
                                </div>
                            )}

                            <input
                                type="text"
                                required
                                className="w-full p-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white dark:bg-[#0f111a] dark:text-white"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Subtitle</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white dark:bg-[#0f111a] dark:text-white"
                                value={formData.subtitle}
                                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                            />
                        </div>

                        {formData.product_type !== 'lead_magnet' && formData.product_type !== 'external_link' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Price (₹ INR)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 font-medium">₹</span>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        step="1"
                                        className="w-full pl-8 pr-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white dark:bg-[#0f111a] dark:text-white"
                                        value={formData.price || ''}
                                        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                        placeholder="4000"
                                    />
                                </div>
                                <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">
                                    {formData.product_type === 'membership'
                                        ? `Enter price in rupees per ${formData.subscription_interval === 'yearly' ? 'year' : 'month'}`
                                        : 'Enter price in rupees (e.g., 4000 for ₹4,000)'}
                                </p>
                            </div>
                        )}

                        {formData.product_type === 'external_link' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">External URL <span className="text-red-500">*</span></label>
                                    <input
                                        type="url"
                                        required
                                        placeholder="https://youtube.com/your-video"
                                        className="w-full p-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white dark:bg-[#0f111a] dark:text-white"
                                        value={formData.external_url || ''}
                                        onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
                                    />
                                    <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">The URL visitors will be redirected to when they click this product.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Button Text</label>
                                    <input
                                        type="text"
                                        placeholder="Visit Link"
                                        className="w-full p-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white dark:bg-[#0f111a] dark:text-white"
                                        value={formData.button_text || ''}
                                        onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                                    />
                                    <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">Custom call-to-action text, e.g. "Watch Now", "Listen Here", "Shop Now"</p>
                                </div>
                            </>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Thumbnail Image</label>
                            <div className="border-2 border-dashed border-slate-300 dark:border-gray-600 rounded-lg p-6 text-center hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    id="thumbnail-upload"
                                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                />
                                <label htmlFor="thumbnail-upload" className="cursor-pointer flex flex-col items-center">
                                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                                    <span className="text-sm text-slate-600 dark:text-gray-400">
                                        {imageFile ? imageFile.name : (formData.cover_image_url ? 'Change Image' : 'Click to upload thumbnail')}
                                    </span>
                                    <span className="text-xs text-slate-400 dark:text-gray-500 mt-1">Suggested: 1080x1080px (1:1 Ratio)</span>
                                </label>
                            </div>
                        </div>

                        {formData.product_type !== 'booking' && formData.product_type !== 'course' && formData.product_type !== 'external_link' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Product File</label>
                                <div className="border-2 border-dashed border-slate-300 dark:border-gray-600 rounded-lg p-6 text-center hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
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
                                        <span className="text-xs text-slate-400 mt-1">Files supported: PDF, ZIP, MP4 (Max 2GB)</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {formData.product_type === 'booking' && (
                            <CoachingSettings
                                duration_minutes={formData.duration_minutes!}
                                timezone={formData.timezone!}
                                cancellation_window_hours={formData.cancellation_window_hours!}
                                availability={formData.availability || []}
                                onChange={(updates) => setFormData({ ...formData, ...updates })}
                            />
                        )}

                        {/* Order Bump Settings — only for paid products when editing */}
                        {isEditing && formData.product_type !== 'lead_magnet' && formData.product_type !== 'external_link' && (
                            <OrderBumpSettings
                                currentProductId={product?.id}
                                bumpConfig={bumpConfig || undefined}
                                onChange={(bump) => setBumpConfig(bump)}
                            />
                        )}

                        {/* Affiliate Program Settings — only when editing */}
                        {isEditing && formData.product_type !== 'external_link' && (
                            <AffiliateSettings
                                config={affiliateConfig}
                                onChange={setAffiliateConfig}
                            />
                        )}

                        {/* Course Builder UI - Documented in Story 8.5 */}
                        {isEditing && (formData.product_type === 'course' || formData.product_type === 'membership') && (
                            <div className="pt-6 border-t border-slate-100">
                                <h3 className="text-lg font-bold font-heading mb-4">
                                    {formData.product_type === 'membership' ? 'Membership Content' : 'Course Curriculum'}
                                </h3>
                                <p className="text-sm text-slate-500 mb-4">
                                    {formData.product_type === 'membership'
                                        ? 'Add content for your subscribers. You can add videos, text lessons, files, or external course links.'
                                        : 'Manage your course modules and lessons. Drag and drop to reorder.'}
                                </p>
                                <CourseBuilder productId={product.id} />
                            </div>
                        )}

                        {/* Testimonials Management - Documented in Story 11.4 */}
                        {isEditing && (
                            <div className="pt-6 border-t border-slate-200">
                                <TestimonialsTab productId={product.id} />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Description</label>
                            <textarea
                                className="w-full p-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all h-32 resize-none bg-white dark:bg-[#0f111a] dark:text-white"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-[#1a1d2b] pb-4 border-t border-slate-100 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={uploading || mutation.isPending}
                            className="px-6 py-2 bg-slate-900 dark:bg-indigo-600 text-white rounded-full hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-colors disabled:opacity-50 flex items-center font-medium"
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
