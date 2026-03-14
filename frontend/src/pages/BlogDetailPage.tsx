import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, User, ArrowLeft, Loader2, Facebook, Twitter, Linkedin, Copy, CheckCircle2 } from 'lucide-react';
import { blogApi, type Blog } from '../api/blog';
import ReactMarkdown from 'react-markdown';

export default function BlogDetailPage() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [blog, setBlog] = useState<Blog | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchBlog = async () => {
            if (!slug) return;
            try {
                const response = await blogApi.getBlogBySlug(slug);
                setBlog(response.data);
            } catch (error) {
                console.error('Failed to fetch blog:', error);
                navigate('/blog');
            } finally {
                setLoading(false);
            }
        };
        fetchBlog();
    }, [slug, navigate]);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0a0a]">
                <Loader2 className="w-8 h-8 animate-spin text-[#6786f5]" />
            </div>
        );
    }

    if (!blog) return null;

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a] pt-24 pb-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Button */}
                <button 
                    onClick={() => navigate('/blog')}
                    className="flex items-center gap-2 text-gray-500 hover:text-[#6786f5] transition-colors mb-8 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Back to Blog</span>
                </button>

                {/* Article Header */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">
                        <span className="px-3 py-1 rounded-full bg-[#6786f5]/10 text-[#6786f5]">
                            {blog.tags?.[0] || 'Creators'}
                        </span>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(blog.published_at || blog.created_at).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                            })}
                        </div>
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {blog.author || 'Mio Store Team'}
                        </div>
                    </div>

                    <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight mb-8">
                        {blog.title}
                    </h1>

                    <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed italic border-l-4 border-[#6786f5] pl-6 mb-12">
                        {blog.summary}
                    </p>

                    <div className="aspect-[21/9] rounded-3xl overflow-hidden mb-12 shadow-xl">
                        <img 
                            src={blog.cover_image || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=2070&auto=format&fit=crop'} 
                            alt={blog.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                </motion.div>

                {/* Article Content */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="prose prose-lg dark:prose-invert prose-headings:font-bold prose-a:text-[#6786f5] max-w-none"
                >
                    <ReactMarkdown>{blog.content}</ReactMarkdown>
                </motion.div>

                {/* Share Section */}
                <div className="mt-20 pt-12 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Share this article</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Help other creators grow by sharing this guide.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="p-2.5 rounded-full bg-gray-50 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 hover:text-[#6786f5] hover:bg-[#6786f5]/10 transition-all">
                                <Twitter className="w-5 h-5" />
                            </button>
                            <button className="p-2.5 rounded-full bg-gray-50 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 hover:text-[#6786f5] hover:bg-[#6786f5]/10 transition-all">
                                <Linkedin className="w-5 h-5" />
                            </button>
                            <button className="p-2.5 rounded-full bg-gray-50 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 hover:text-[#6786f5] hover:bg-[#6786f5]/10 transition-all">
                                <Facebook className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={copyToClipboard}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-gray-50 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 hover:text-[#6786f5] hover:bg-[#6786f5]/10 transition-all"
                            >
                                {copied ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                                <span className="text-sm font-medium">{copied ? 'Copied!' : 'Copy Link'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Author Card */}
                <div className="mt-16 p-8 rounded-3xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-100 dark:border-gray-800 flex items-start gap-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#6786f5] to-[#91a6ff] flex-shrink-0 flex items-center justify-center text-white text-2xl font-bold">
                        {blog.author?.[0] || 'M'}
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Written by {blog.author || 'Mio Store Team'}</h4>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed italic">
                            Helping creators build sustainable, high-income businesses since Day 1. At Mio Store, we're building the infrastructure for the future of the creator economy.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
