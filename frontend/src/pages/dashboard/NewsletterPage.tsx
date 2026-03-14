import React, { useState, useEffect } from 'react';
import { getSubscribers, sendNewsletter } from '../../lib/api/subscribers';
import type { Subscriber } from '../../lib/api/subscribers';
import {
    Loader2, Mail, Users, Send, ChevronLeft, ChevronRight,
    Search, CheckCircle, AlertCircle
} from 'lucide-react';

type Tab = 'subscribers' | 'compose';

const NewsletterPage: React.FC = () => {
    const [tab, setTab] = useState<Tab>('subscribers');
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Compose state
    const [subject, setSubject] = useState('');
    const [bodyHtml, setBodyHtml] = useState('');
    const [sending, setSending] = useState(false);
    const [sendStatus, setSendStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const limit = 20;

    const fetchSubscribers = async (p: number) => {
        try {
            setLoading(true);
            const res = await getSubscribers(p, limit);
            setSubscribers(res.subscribers || []);
            setTotal(res.total || 0);
        } catch (err) {
            console.error('Failed to fetch subscribers:', err);
            setSubscribers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscribers(page);
    }, [page]);

    const handleSend = async () => {
        if (!subject.trim() || !bodyHtml.trim()) return;
        setSending(true);
        setSendStatus('idle');
        try {
            await sendNewsletter(subject, bodyHtml);
            setSendStatus('success');
            setSubject('');
            setBodyHtml('');
        } catch (err) {
            console.error('Failed to send newsletter:', err);
            setSendStatus('error');
        } finally {
            setSending(false);
        }
    };

    const filteredSubscribers = searchQuery
        ? subscribers.filter(
            s =>
                s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.name?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : subscribers;

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="max-w-4xl mx-auto space-y-6 p-2 sm:p-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#6786f5] to-blue-600 bg-clip-text text-transparent">
                    Newsletter
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Manage subscribers and send email campaigns
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 dark:bg-[#0f111a] p-1 rounded-xl w-fit">
                <button
                    onClick={() => setTab('subscribers')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'subscribers'
                        ? 'bg-white dark:bg-[#1e2135] text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                >
                    <Users className="w-4 h-4" />
                    Subscribers ({total})
                </button>
                <button
                    onClick={() => setTab('compose')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'compose'
                        ? 'bg-white dark:bg-[#1e2135] text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                >
                    <Mail className="w-4 h-4" />
                    Compose
                </button>
            </div>

            {/* Subscribers Tab */}
            {tab === 'subscribers' && (
                <div className="bg-white dark:bg-[#1e2135] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    {/* Search */}
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-[#6786f5]/30 bg-white dark:bg-[#0f111a] dark:text-white text-sm"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="w-6 h-6 animate-spin text-[#6786f5]" />
                        </div>
                    ) : filteredSubscribers.length === 0 ? (
                        <div className="text-center py-12 px-6">
                            <Users className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-gray-400 font-medium">
                                {searchQuery ? 'No matching subscribers' : 'No subscribers yet'}
                            </p>
                            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                                {searchQuery
                                    ? 'Try a different search term'
                                    : 'Subscribers will appear here when customers visit your store'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 dark:bg-[#0f111a] text-gray-600 dark:text-gray-400 font-medium">
                                        <tr>
                                            <th className="px-6 py-3">Email</th>
                                            <th className="px-6 py-3">Name</th>
                                            <th className="px-6 py-3">Source</th>
                                            <th className="px-6 py-3">Subscribed</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {filteredSubscribers.map((sub) => (
                                            <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6786f5] to-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                            {(sub.name || sub.email).charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="text-gray-900 dark:text-white font-medium truncate">
                                                            {sub.email}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                                    {sub.name || '—'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 capitalize">
                                                        {sub.source || 'store'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                    {new Date(sub.created_at).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-700">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Page {page} of {totalPages} · {total} subscribers
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setPage(Math.max(1, page - 1))}
                                            disabled={page === 1}
                                            className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 transition"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setPage(Math.min(totalPages, page + 1))}
                                            disabled={page === totalPages}
                                            className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 transition"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Compose Tab */}
            {tab === 'compose' && (
                <div className="bg-white dark:bg-[#1e2135] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-6">
                    {sendStatus === 'success' && (
                        <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-xl text-green-700 dark:text-green-400">
                            <CheckCircle className="w-5 h-5 flex-shrink-0" />
                            <p className="text-sm font-medium">Newsletter sent successfully to all subscribers!</p>
                        </div>
                    )}

                    {sendStatus === 'error' && (
                        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-red-700 dark:text-red-400">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p className="text-sm font-medium">Failed to send newsletter. Please try again.</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Subject Line
                        </label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-[#6786f5]/30 bg-white dark:bg-[#0f111a] dark:text-white"
                            placeholder="Your newsletter subject..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email Body (HTML supported)
                        </label>
                        <textarea
                            value={bodyHtml}
                            onChange={(e) => setBodyHtml(e.target.value)}
                            rows={10}
                            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-[#6786f5]/30 bg-white dark:bg-[#0f111a] dark:text-white font-mono text-sm leading-relaxed resize-none"
                            placeholder="<p>Hi there! 👋</p>&#10;&#10;<p>Here's your latest update...</p>"
                        />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Will be sent to <span className="font-semibold text-gray-700 dark:text-gray-200">{total}</span> subscribers
                        </p>
                        <button
                            onClick={handleSend}
                            disabled={sending || !subject.trim() || !bodyHtml.trim()}
                            className="flex items-center gap-2 px-6 py-2.5 bg-[#6786f5] text-white rounded-xl font-medium hover:bg-[#5570e0] transition-colors disabled:opacity-50 shadow-sm"
                        >
                            {sending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                            {sending ? 'Sending...' : 'Send Newsletter'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewsletterPage;
