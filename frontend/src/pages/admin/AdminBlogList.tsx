import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, EyeOff, Loader2, Calendar } from 'lucide-react';
import { blogApi, type Blog } from '../../api/blog';
import { useNavigate } from 'react-router-dom';

export default function AdminBlogList() {
    const navigate = useNavigate();
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchBlogs = async () => {
        try {
            const response = await blogApi.adminListBlogs();
            setBlogs(response.data);
        } catch (error) {
            console.error('Failed to fetch blogs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlogs();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this blog post?')) return;
        try {
            await blogApi.deleteBlog(id);
            setBlogs(prev => prev.filter(blog => blog.id !== id));
        } catch (error) {
            alert('Failed to delete blog');
        }
    };

    const togglePublish = async (blog: Blog) => {
        try {
            await blogApi.updateBlog(blog.id, { is_published: !blog.is_published });
            setBlogs(prev => prev.map(b => b.id === blog.id ? { ...b, is_published: !blog.is_published } : b));
        } catch (error) {
            alert('Failed to update status');
        }
    };

    const filteredBlogs = blogs.filter(blog => 
        blog.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-[#6786f5]" />
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Blog Management</h1>
                    <p className="text-gray-500 dark:text-gray-400">Create and manage your articles</p>
                </div>
                <button 
                    onClick={() => navigate('/admin/blogs/new')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#6786f5] hover:bg-[#5a78e6] text-white rounded-xl font-semibold transition-all shadow-lg shadow-[#6786f5]/20"
                >
                    <Plus className="w-5 h-5" />
                    New Article
                </button>
            </div>

            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input 
                            type="text"
                            placeholder="Search by title..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-100 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-[#6786f5] focus:border-transparent transition-all dark:text-white"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-[#0a0a0a]/50 text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">
                                <th className="px-6 py-4">Article</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Author</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {filteredBlogs.map((blog) => (
                                <tr key={blog.id} className="hover:bg-gray-50/50 dark:hover:bg-[#0a0a0a]/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-[#0a0a0a] flex-shrink-0">
                                                <img 
                                                    src={blog.cover_image || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=2070&auto=format&fit=crop'} 
                                                    alt="" 
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 dark:text-white line-clamp-1">{blog.title}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">/{blog.slug}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button 
                                            onClick={() => togglePublish(blog)}
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                blog.is_published 
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                            }`}
                                        >
                                            {blog.is_published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                            {blog.is_published ? 'Published' : 'Draft'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 italic">
                                        {blog.author || 'Mio Store'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(blog.created_at).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => navigate(`/admin/blogs/edit/${blog.id}`)}
                                                className="p-2 text-gray-400 hover:text-[#6786f5] hover:bg-[#6786f5]/10 rounded-lg transition-all"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(blog.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredBlogs.length === 0 && (
                    <div className="text-center py-20 px-4">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-[#0a0a0a] rounded-full flex items-center justify-center mx-auto mb-4">
                            <Plus className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No articles yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">Start growing your audience by writing your first article.</p>
                        <button 
                            onClick={() => navigate('/admin/blogs/new')}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#6786f5] hover:bg-[#5a78e6] text-white rounded-xl font-semibold transition-all"
                        >
                            Create Article
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
