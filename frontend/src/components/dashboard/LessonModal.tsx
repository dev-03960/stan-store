import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Video, FileText, Paperclip, Loader2, Upload } from 'lucide-react';
import { createLesson, updateLesson, getPresignedUrl, uploadFileToUrl } from '../../lib/api/products';
import type { Lesson } from '../../lib/api/products';

interface LessonModalProps {
    productId: string;
    moduleId: string;
    lesson?: Lesson;
    onClose: () => void;
}

export const LessonModal: React.FC<LessonModalProps> = ({ productId, moduleId, lesson, onClose }) => {
    const queryClient = useQueryClient();
    const isEditing = !!lesson;

    const [formData, setFormData] = useState<Omit<Lesson, 'id'>>({
        title: lesson?.title || '',
        type: lesson?.type || 'video',
        content: lesson?.content || '',
        sort_order: lesson?.sort_order || 0,
        duration_minutes: lesson?.duration_minutes || undefined
    });

    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    const mutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            let finalContent = data.content;

            if (file) {
                // Upload mechanism similar to product forms
                const presigned = await getPresignedUrl(file.name, file.type, 'product_file');
                await uploadFileToUrl(presigned.url, file);
                finalContent = `https://pub-your-r2-domain.r2.dev/${presigned.key}`;
            }

            const payload = { ...data, content: finalContent };

            if (isEditing && lesson) {
                return updateLesson(productId, moduleId, lesson.id, payload);
            }
            return createLesson(productId, moduleId, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['course', productId] });
            onClose();
        },
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);
        try {
            await mutation.mutateAsync(formData);
        } catch (error) {
            console.error('Failed to save lesson:', error);
            alert('Failed to save lesson.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold font-heading">
                        {isEditing ? 'Edit Lesson' : 'Add New Lesson'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Lesson Title</label>
                        <input
                            type="text"
                            required
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Lesson Type</label>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: 'video', icon: Video, label: 'Video' },
                                { id: 'text', icon: FileText, label: 'Text' },
                                { id: 'attachment', icon: Paperclip, label: 'File' }
                            ].map((type) => {
                                const Icon = type.icon;
                                const isSelected = formData.type === type.id;
                                return (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: type.id as any, content: '' })}
                                        className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all ${isSelected
                                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                            : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                            }`}
                                    >
                                        <Icon className="w-6 h-6 mb-2" />
                                        <span className="font-medium text-sm">{type.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {formData.type === 'video' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Video Source</label>
                                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 cursor-pointer">
                                    <input
                                        type="file"
                                        accept="video/*"
                                        className="hidden"
                                        id="video-upload"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    />
                                    <label htmlFor="video-upload" className="cursor-pointer block">
                                        <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                                        <span className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                                            {file ? file.name : 'Upload MP4 File'}
                                        </span>
                                        {!file && <p className="text-xs text-slate-500 mt-1">or link external below</p>}
                                    </label>
                                </div>
                                {!file && (
                                    <div className="mt-3">
                                        <input
                                            type="url"
                                            placeholder="https://vimeo.com/... or YouTube URL"
                                            className="w-full p-2 border border-slate-300 rounded-lg outline-none text-sm"
                                            value={formData.content}
                                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                        />
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Duration (Minutes)</label>
                                <input
                                    type="number"
                                    min="1"
                                    className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                                    value={formData.duration_minutes || ''}
                                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || undefined })}
                                />
                            </div>
                        </div>
                    )}

                    {formData.type === 'text' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Lesson Content (Markdown Supported)</label>
                            <textarea
                                required
                                rows={8}
                                className="w-full p-3 border border-slate-300 rounded-lg outline-none font-mono text-sm leading-relaxed"
                                placeholder="## Welcome to this lesson&#10;&#10;Here is what we will cover..."
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            />
                        </div>
                    )}

                    {formData.type === 'attachment' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Worksheet / File</label>
                            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 cursor-pointer">
                                <input
                                    type="file"
                                    className="hidden"
                                    id="file-upload"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                />
                                <label htmlFor="file-upload" className="cursor-pointer block">
                                    <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                                    <span className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                                        {file ? file.name : (formData.content ? 'Replace File' : 'Upload Resource File')}
                                    </span>
                                </label>
                            </div>
                            {formData.content && !file && (
                                <p className="text-xs text-slate-500 mt-2 truncate">Current file: {formData.content}</p>
                            )}
                        </div>
                    )}

                    <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={uploading}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:bg-indigo-400"
                        >
                            {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {uploading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Lesson')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
