import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ArrowRight, Loader2, Search } from 'lucide-react';
import { blogApi, type Blog } from '../api/blog';

export default function BlogListPage() {
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchBlogs = async () => {
            try {
                const response = await blogApi.getPublicBlogs();
                setBlogs(response.data);
            } catch (error) {
                console.error('Failed to fetch blogs:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchBlogs();
    }, []);

    const filteredBlogs = blogs.filter(blog => 
        blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        blog.summary?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0a0a]">
                <Loader2 className="w-8 h-8 animate-spin text-[#6786f5]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a] pt-24 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="text-center mb-16">
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6"
                    >
                        Mio Store <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6786f5] to-[#91a6ff]">Blog</span>
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
                    >
                        Insights, guides, and stories to help you build and scale your creator business in 2026.
                    </motion.p>
                </div>

                {/* Search Bar */}
                <div className="max-w-md mx-auto mb-12">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input 
                            type="text"
                            placeholder="Search articles..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-[#6786f5] focus:border-transparent transition-all dark:text-white"
                        />
                    </div>
                </div>

                {/* Blog Grid */}
                {filteredBlogs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredBlogs.map((blog, index) => (
                            <motion.article
                                key={blog.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ y: -8 }}
                                className="group bg-white dark:bg-[#1a1a1a] rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 hover:shadow-2xl hover:shadow-[#6786f5]/10 transition-all duration-300 flex flex-col"
                            >
                                <a href={`/blog/${blog.slug}`} className="block overflow-hidden h-48 sm:h-56">
                                    <img 
                                        src={blog.cover_image || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=2070&auto=format&fit=crop'} 
                                        alt={blog.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                </a>
                                <div className="p-6 flex flex-col flex-grow">
                                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(blog.published_at || blog.created_at).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[#6786f5] font-medium">
                                            {blog.tags?.[0] || 'Creators'}
                                        </div>
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-[#6786f5] transition-colors line-clamp-2">
                                        <a href={`/blog/${blog.slug}`}>{blog.title}</a>
                                    </h2>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 line-clamp-3">
                                        {blog.summary || blog.content.substring(0, 150).replace(/[#*]/g, '') + '...'}
                                    </p>
                                    <div className="mt-auto pt-6 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6786f5] to-[#91a6ff] flex items-center justify-center text-white text-[10px] font-bold">
                                                {blog.author?.[0] || 'M'}
                                            </div>
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 italic">{blog.author || 'Mio Store'}</span>
                                        </div>
                                        <a 
                                            href={`/blog/${blog.slug}`}
                                            className="text-[#6786f5] hover:text-[#91a6ff] transition-colors p-2"
                                        >
                                            <ArrowRight className="w-5 h-5" />
                                        </a>
                                    </div>
                                </div>
                            </motion.article>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-gray-500 dark:text-gray-400">No articles found matching your search.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
