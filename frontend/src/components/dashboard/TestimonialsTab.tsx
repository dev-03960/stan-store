import React, { useState, useEffect } from 'react';
import { getTestimonials, createTestimonial, updateTestimonial, deleteTestimonial, reorderTestimonials, getPresignedUrl, uploadFileToUrl } from '../../lib/api/products';
import type { Testimonial } from '../../lib/api/products';
import { Plus, GripVertical, Trash2, Edit2, Loader2, Star, Upload } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';

interface TestimonialsTabProps {
    productId: string;
}

export const TestimonialsTab: React.FC<TestimonialsTabProps> = ({ productId }) => {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [editingIdx, setEditingIdx] = useState<number | null>(null);

    const [formState, setFormState] = useState({
        customer_name: '',
        text: '',
        rating: 5,
        avatar_url: ''
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchTestimonials();
    }, [productId]);

    const fetchTestimonials = async () => {
        try {
            setLoading(true);
            const data = await getTestimonials(productId);
            setTestimonials(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formState.customer_name || !formState.text) return;

        setUploading(true);
        let finalAvatarUrl = formState.avatar_url;

        try {
            if (imageFile) {
                const { url, key } = await getPresignedUrl(imageFile.name, imageFile.type, 'cover_image');
                await uploadFileToUrl(url, imageFile);
                finalAvatarUrl = `https://stan-store-clone-bucket.s3.amazonaws.com/${key}`;
            }

            const payload = {
                customer_name: formState.customer_name,
                text: formState.text,
                rating: formState.rating,
                avatar_url: finalAvatarUrl
            };

            if (editingIdx !== null) {
                await updateTestimonial(productId, testimonials[editingIdx].id, payload);
            } else {
                await createTestimonial(productId, payload);
            }

            setIsFormVisible(false);
            setEditingIdx(null);
            setImageFile(null);
            setFormState({ customer_name: '', text: '', rating: 5, avatar_url: '' });
            fetchTestimonials();
        } catch (err) {
            console.error('Failed to save testimonial', err);
        } finally {
            setUploading(false);
        }
    };

    const handleEdit = (index: number) => {
        const t = testimonials[index];
        setFormState({
            customer_name: t.customer_name,
            text: t.text,
            rating: t.rating,
            avatar_url: t.avatar_url || ''
        });
        setEditingIdx(index);
        setIsFormVisible(true);
    };

    const handleDelete = async (index: number) => {
        if (!confirm('Are you sure you want to delete this testimonial?')) return;
        try {
            await deleteTestimonial(productId, testimonials[index].id);
            fetchTestimonials();
        } catch (err) {
            console.error("Delete failed", err);
        }
    };

    const onDragEnd = async (result: DropResult) => {
        if (!result.destination) return;
        const items = Array.from(testimonials);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setTestimonials(items);

        try {
            const mappedIds = items.map(t => t.id);
            await reorderTestimonials(productId, mappedIds);
        } catch (err) {
            console.error("Failed to reorder", err);
            fetchTestimonials(); // revert on fail
        }
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-[#6786f5]" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Social Proof (Max 10)</h3>
                {!isFormVisible && testimonials.length < 10 && (
                    <button
                        type="button"
                        onClick={() => {
                            setFormState({ customer_name: '', text: '', rating: 5, avatar_url: '' });
                            setEditingIdx(null);
                            setImageFile(null);
                            setIsFormVisible(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-[#6786f51a] text-[#5570e0] rounded-lg hover:bg-purple-200 text-sm font-medium transition"
                    >
                        <Plus className="w-4 h-4" /> Add Testimonial
                    </button>
                )}
            </div>

            {isFormVisible && (
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                            <input
                                type="text"
                                value={formState.customer_name}
                                onChange={e => setFormState(f => ({ ...f, customer_name: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-200"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Star Rating</label>
                            <select
                                value={formState.rating}
                                onChange={e => setFormState(f => ({ ...f, rating: Number(e.target.value) }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-200"
                            >
                                {[5, 4, 3, 2, 1].map(num => <option key={num} value={num}>{num} Stars</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Review Text (max 300 chars)</label>
                        <textarea
                            value={formState.text}
                            maxLength={300}
                            onChange={e => setFormState(f => ({ ...f, text: e.target.value }))}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-200"
                            placeholder="This product literally changed my life..."
                        />
                        <div className="text-right text-xs text-gray-400 mt-1">{formState.text.length} / 300</div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Customer Avatar (Optional)</label>
                        <div className="flex items-center gap-4">
                            {(imageFile || formState.avatar_url) ? (
                                <img
                                    src={imageFile ? URL.createObjectURL(imageFile) : formState.avatar_url}
                                    alt="Preview"
                                    className="w-12 h-12 rounded-full object-cover border border-gray-200"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                                    <Star className="w-5 h-5" />
                                </div>
                            )}

                            <div className="flex flex-col">
                                <label className="cursor-pointer border border-dashed border-gray-300 px-4 py-2 rounded-lg flex items-center gap-2 text-sm text-gray-600 hover:bg-gray-100 transition">
                                    <Upload className="w-4 h-4" />
                                    {imageFile || formState.avatar_url ? 'Change Avatar' : 'Upload Image'}
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                                </label>
                                <span className="text-xs text-gray-400 mt-1">Suggested: 400x400px (1:1)</span>
                            </div>

                            {(imageFile || formState.avatar_url) && (
                                <button type="button" onClick={() => { setImageFile(null); setFormState(f => ({ ...f, avatar_url: '' })); }} className="text-sm text-red-500 hover:text-red-700">Remove</button>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-2">
                        <button type="button" onClick={() => setIsFormVisible(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">Cancel</button>
                        <button type="button" onClick={handleSave} disabled={uploading} className="px-4 py-2 bg-[#6786f5] text-white rounded-lg hover:bg-[#5570e0] transition flex items-center gap-2">
                            {uploading && <Loader2 className="w-4 h-4 animate-spin" />} Save Review
                        </button>
                    </div>
                </div>
            )}

            {!isFormVisible && testimonials.length === 0 && (
                <div className="text-center py-8 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-gray-500">
                    No testimonials yet. Add social proof to boost conversions!
                </div>
            )}

            {!isFormVisible && testimonials.length > 0 && (
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="testimonials-list">
                        {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                                {testimonials.map((t, index) => (
                                    <Draggable key={t.id} draggableId={t.id} index={index}>
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className="bg-white border border-gray-200 p-4 rounded-xl flex gap-4 items-center group shadow-sm hover:border-[#6786f540] transition"
                                            >
                                                <div {...provided.dragHandleProps} className="text-gray-300 hover:text-gray-500">
                                                    <GripVertical className="w-5 h-5" />
                                                </div>

                                                {t.avatar_url ? (
                                                    <img src={t.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover bg-gray-100 border border-gray-200" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 text-[#5570e0] flex items-center justify-center font-bold">
                                                        {t.customer_name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}

                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="font-bold text-gray-900">{t.customer_name}</h4>
                                                            <div className="flex gap-0.5 mt-0.5">
                                                                {Array.from({ length: 5 }).map((_, i) => (
                                                                    <Star key={i} className={`w-3.5 h-3.5 ${i < t.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button type="button" onClick={() => handleEdit(index)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                            <button type="button" onClick={() => handleDelete(index)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-2 line-clamp-2 italic">"{t.text}"</p>
                                                </div>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            )}
        </div>
    );
};
