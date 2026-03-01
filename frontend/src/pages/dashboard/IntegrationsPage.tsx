import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Instagram, Plug, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { integrationsApi, type InstagramConnection, type InstagramAutomation } from '../../lib/api/integrations';

export default function IntegrationsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [isLoading, setIsLoading] = useState(true);
    const [connection, setConnection] = useState<InstagramConnection | null>(null);
    const [automations, setAutomations] = useState<InstagramAutomation[]>([]);

    const [newKeyword, setNewKeyword] = useState('');
    const [newResponse, setNewResponse] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (searchParams.get('ig_success') === 'true') {
            setSuccess('Instagram connected successfully!');
            // Clean up URL
            searchParams.delete('ig_success');
            setSearchParams(searchParams);
        }
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [connRes, authsRes] = await Promise.all([
                integrationsApi.getInstagramConnection(),
                integrationsApi.getInstagramAutomations().catch(() => [] as InstagramAutomation[])
            ]);

            if (connRes) setConnection(connRes);
            if (authsRes) setAutomations(authsRes);
        } catch (err: any) {
            console.error("Failed to load integrations", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnectInstagram = async () => {
        try {
            const res = await integrationsApi.getInstagramOAuthUrl();
            if (res?.url) {
                window.location.href = res.url;
            }
        } catch (err: any) {
            setError(err.message || 'Failed to initiate Instagram connection.');
        }
    };

    const handleDisconnectInstagram = async () => {
        if (!confirm('Are you sure you want to disconnect Instagram? Active automations will stop working.')) return;
        try {
            await integrationsApi.disconnectInstagram();
            setConnection({ connected: false });
            setAutomations([]);
            setSuccess('Instagram disconnected.');
        } catch (err: any) {
            setError('Failed to disconnect Instagram.');
        }
    };

    const handleAddAutomation = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!newKeyword.trim() || !newResponse.trim()) {
            setError('Both keyword and response are required.');
            return;
        }

        try {
            const res = await integrationsApi.createInstagramAutomation({
                keyword: newKeyword.trim(),
                responseText: newResponse.trim()
            });
            if (res) {
                setAutomations(prev => [...prev, res]);
                setNewKeyword('');
                setNewResponse('');
                setSuccess('Automation rule created!');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create automation.');
        }
    };

    const handleDeleteAutomation = async (id: string) => {
        if (!confirm('Delete this automated response?')) return;
        try {
            await integrationsApi.deleteInstagramAutomation(id);
            setAutomations(prev => prev.filter(a => a.id !== id));
        } catch (err) {
            setError('Failed to delete automation.');
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
                <p className="text-gray-500 mt-1">Connect external platforms to automate your marketing and sales.</p>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

            {success && (
                <div className="p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    {success}
                </div>
            )}

            {/* Instagram Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-inner">
                            <Instagram className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Instagram Auto-DM</h2>
                            <p className="text-sm text-gray-500">Automatically reply to comments with DMs</p>
                        </div>
                    </div>
                    <div>
                        {connection?.connected ? (
                            <div className="flex items-center gap-3">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700 border border-green-200">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    Connected: @{connection.igUsername}
                                </span>
                                <button
                                    onClick={handleDisconnectInstagram}
                                    className="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
                                >
                                    Disconnect
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleConnectInstagram}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg hover:from-purple-700 hover:to-pink-600 focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all shadow-sm font-medium"
                            >
                                <Plug className="w-4 h-4" />
                                Connect Instagram
                            </button>
                        )}
                    </div>
                </div>

                {connection?.connected && (
                    <div className="p-6 bg-slate-50">
                        <div className="mb-6">
                            <h3 className="text-md font-semibold text-gray-900">Keyword Triggers</h3>
                            <p className="text-sm text-gray-500">If a follower comments the exact keyword on any post, Stan will send them a DM.</p>
                        </div>

                        {/* Add Rule Form */}
                        <form onSubmit={handleAddAutomation} className="flex gap-3 mb-8">
                            <input
                                type="text"
                                placeholder="Keyword (e.g. LINK)"
                                required
                                value={newKeyword}
                                onChange={e => setNewKeyword(e.target.value)}
                                className="w-1/4 rounded-lg border-gray-300 border px-4 py-2 text-sm focus:ring-purple-500 focus:border-purple-500"
                            />
                            <input
                                type="text"
                                placeholder="Response message..."
                                required
                                value={newResponse}
                                onChange={e => setNewResponse(e.target.value)}
                                className="w-full rounded-lg border-gray-300 border px-4 py-2 text-sm focus:ring-purple-500 focus:border-purple-500"
                            />
                            <button
                                type="submit"
                                className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> Add
                            </button>
                        </form>

                        {/* Active Rules List */}
                        <div className="space-y-3">
                            {automations.map((auto) => (
                                <div key={auto.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="shrink-0 bg-purple-50 text-purple-700 px-3 py-1 rounded-md text-sm font-bold border border-purple-100">
                                            {auto.keyword.toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-800 line-clamp-1">"{auto.responseText}"</p>
                                        </div>
                                        <div className="shrink-0 text-sm text-gray-500 pr-4 border-r border-gray-200">
                                            {auto.dmCount} DMs Sent
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteAutomation(auto.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-4"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}

                            {automations.length === 0 && (
                                <div className="text-center py-8 text-sm text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                                    No keyword triggers active yet. Add one above!
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
