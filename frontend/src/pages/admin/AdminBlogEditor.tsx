import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Image as ImageIcon, Tags, User, Globe, Eye, EyeOff } from 'lucide-react';
import { blogApi, type Blog } from '../../api/blog';

export default function AdminBlogEditor() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEdit = Boolean(id);

    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [blog, setBlog] = useState<Partial<Blog>>({
        title: '',
        slug: '',
        content: '',
        summary: '',
        cover_image: '',
        author: 'Mio Store',
        tags: [],
        is_published: false
    });

    useEffect(() => {
        if (isEdit && id) {
            const fetchBlog = async () => {
                try {
                    const response = await blogApi.adminGetBlogById(id);
                    setBlog(response.data);
                } catch (error) {
                    console.error('Failed to fetch blog:', error);
                    alert('Error loading blog');
                    navigate('/admin/blogs');
                } finally {
                    setLoading(false);
                }
            };
            fetchBlog();
        }
    }, [id, isEdit, navigate]);

    const handleSave = async () => {
        if (!blog.title || !blog.content) {
            alert('Title and Content are required');
            return;
        }

        setSaving(true);
        try {
            if (isEdit && id) {
                await blogApi.updateBlog(id, blog);
            } else {
                await blogApi.createBlog(blog);
            }
            navigate('/admin/blogs');
        } catch (error) {
            console.error('Failed to save blog:', error);
            alert('Error saving blog');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-[#6786f5]" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-6">
            <div className="flex items-center justify-between mb-8">
                <button 
                    onClick={() => navigate('/admin/blogs')}
                    className="flex items-center gap-2 text-gray-500 hover:text-[#6786f5] transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span>Back to Articles</span>
                </button>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setBlog(b => ({ ...b, is_published: !b.is_published }))}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                            blog.is_published 
                            ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' 
                            : 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
                        }`}
                    >
                        {blog.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        {blog.is_published ? 'Published' : 'Draft'}
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[#6786f5] hover:bg-[#5a78e6] text-white rounded-xl font-bold transition-all shadow-lg shadow-[#6786f5]/20 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {isEdit ? 'Update Article' : 'Publish Article'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-8 border border-gray-100 dark:border-gray-800 space-y-6 shadow-sm">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Title</label>
                            <input 
                                type="text"
                                value={blog.title}
                                onChange={(e) => setBlog(b => ({ ...b, title: e.target.value }))}
                                placeholder="Enter article title..."
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-100 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-[#6786f5] focus:border-transparent transition-all dark:text-white text-xl font-bold"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Content (Markdown Supported)</label>
                            <textarea 
                                value={blog.content}
                                onChange={(e) => setBlog(b => ({ ...b, content: e.target.value }))}
                                placeholder="Write your article content here..."
                                rows={20}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-100 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-[#6786f5] focus:border-transparent transition-all dark:text-white font-mono text-sm leading-relaxed"
                            />
                        </div>
                    </div>
                </div>

                {/* Sidebar Settings */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-6 border border-gray-100 dark:border-gray-800 space-y-6 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Globe className="w-5 h-5 text-[#6786f5]" />
                            Article Settings
                        </h2>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Slug</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">/</span>
                                <input 
                                    type="text"
                                    value={blog.slug}
                                    onChange={(e) => setBlog(b => ({ ...b, slug: e.target.value }))}
                                    placeholder="url-friendly-slug"
                                    className="w-full pl-6 pr-4 py-2 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-100 dark:border-gray-800 rounded-xl text-sm dark:text-white"
                                />
                            </div>
                            <p className="mt-1 text-[10px] text-gray-400">Leave empty to auto-generate from title</p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Summary</label>
                            <textarea 
                                value={blog.summary}
                                onChange={(e) => setBlog(b => ({ ...b, summary: e.target.value }))}
                                placeholder="Brief overview of the article..."
                                rows={3}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-100 dark:border-gray-800 rounded-xl text-sm dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                <ImageIcon className="w-3 h-3" /> Cover Image URL
                            </label>
                            <input 
                                type="text"
                                value={blog.cover_image}
                                onChange={(e) => setBlog(b => ({ ...b, cover_image: e.target.value }))}
                                placeholder="https://..."
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-100 dark:border-gray-800 rounded-xl text-sm dark:text-white"
                            />
                            {blog.cover_image && (
                                <div className="mt-3 aspect-video rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                                    <img src={blog.cover_image} alt="Preview" className="w-full h-full object-cover" />
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                <User className="w-3 h-3" /> Author
                            </label>
                            <input 
                                type="text"
                                value={blog.author}
                                onChange={(e) => setBlog(b => ({ ...b, author: e.target.value }))}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-100 dark:border-gray-800 rounded-xl text-sm dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                <Tags className="w-3 h-3" /> Tags (Comma separated)
                            </label>
                            <input 
                                type="text"
                                value={blog.tags?.join(', ')}
                                onChange={(e) => setBlog(b => ({ ...b, tags: e.target.value.split(',').map(s => s.trim()) }))}
                                placeholder="Guide, Scaling, 2026"
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-100 dark:border-gray-800 rounded-xl text-sm dark:text-white"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
