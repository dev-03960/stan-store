import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Navigate, Link } from 'react-router-dom';
import { Users, TrendingUp, UserX, Clock, Search, ChevronLeft, ChevronRight, Crown, UserPlus, Shield, XCircle } from 'lucide-react';

interface SubscriptionAnalytics {
  total_active: number;
  total_trial: number;
  total_cancelled: number;
  total_expired: number;
  mrr: number;
  churn_rate: number;
}

interface PlatformSubscription {
  id: string;
  creator_id: string;
  plan: string;
  status: string;
  trial_ends_at: string;
  current_period_start: string;
  current_period_end: string;
  granted_by_admin: boolean;
  creator_email: string;
  creator_name: string;
  created_at: string;
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

const AdminSubscriptionsPage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [analytics, setAnalytics] = useState<SubscriptionAnalytics | null>(null);
  const [subs, setSubs] = useState<PlatformSubscription[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modals
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [grantCreatorId, setGrantCreatorId] = useState('');
  const [grantMonths, setGrantMonths] = useState(1);
  const [addEmail, setAddEmail] = useState('');
  const [addName, setAddName] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  if (authLoading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (!user || user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  const fetchAnalytics = async () => {
    try {
      const res = await api.get<SubscriptionAnalytics>('/admin/subscriptions/analytics');
      setAnalytics(res.data || null);
    } catch (err) {
      console.error('Failed to fetch analytics', err);
    }
  };

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      let url = `/admin/subscriptions?page=${page}&pageSize=15`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await api.get(url) as any;
      setSubs(res.data || []);
      setMeta(res.meta || null);
    } catch (err) {
      console.error('Failed to fetch subscriptions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalytics(); }, []);
  useEffect(() => { fetchSubscriptions(); }, [page, statusFilter, search]);

  const handleGrant = async () => {
    setActionLoading(true);
    try {
      await api.post('/admin/subscriptions/grant', { creator_id: grantCreatorId, months: grantMonths });
      setShowGrantModal(false);
      setGrantCreatorId('');
      fetchSubscriptions();
      fetchAnalytics();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Failed to grant subscription');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevoke = async (creatorId: string) => {
    if (!confirm('Are you sure you want to revoke this subscription?')) return;
    try {
      await api.post('/admin/subscriptions/revoke', { creator_id: creatorId });
      fetchSubscriptions();
      fetchAnalytics();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Failed to revoke subscription');
    }
  };

  const handleAddCreator = async () => {
    setActionLoading(true);
    try {
      await api.post('/admin/creators', { email: addEmail, name: addName });
      setShowAddModal(false);
      setAddEmail('');
      setAddName('');
      fetchSubscriptions();
      fetchAnalytics();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Failed to add creator');
    } finally {
      setActionLoading(false);
    }
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-emerald-100 text-emerald-800',
      trial: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" /> Back
            </Link>
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              Subscription Management
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
            >
              <UserPlus className="w-4 h-4" /> Add Creator
            </button>
            <button
              onClick={() => setShowGrantModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition"
            >
              <Shield className="w-4 h-4" /> Grant Subscription
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard title="Active Subscribers" value={analytics.total_active} icon={Users} color="bg-emerald-500" />
            <StatCard title="Trial Users" value={analytics.total_trial} icon={Clock} color="bg-blue-500" />
            <StatCard title="MRR" value={`₹${analytics.mrr.toLocaleString()}`} icon={TrendingUp} color="bg-indigo-500" subtext="Monthly Recurring Revenue" />
            <StatCard title="Churn Rate" value={`${analytics.churn_rate.toFixed(1)}%`} icon={UserX} color="bg-red-500" subtext={`${analytics.total_cancelled} cancelled`} />
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="flex gap-2">
              {['', 'trial', 'active', 'cancelled', 'expired'].map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    statusFilter === s
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Subscriber Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" />
            </div>
          ) : subs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No subscriptions found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Creator</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Plan</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Since</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Expires</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {subs.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50 transition">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{sub.creator_name || 'Unknown'}</div>
                        <div className="text-xs text-gray-500">{sub.creator_email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="capitalize font-medium">{sub.plan}</span>
                        {sub.granted_by_admin && (
                          <span className="ml-2 text-xs text-amber-600 font-medium">(Admin)</span>
                        )}
                      </td>
                      <td className="py-3 px-4">{statusBadge(sub.status)}</td>
                      <td className="py-3 px-4 text-gray-500">{new Date(sub.created_at).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-gray-500">
                        {sub.status === 'trial'
                          ? new Date(sub.trial_ends_at).toLocaleDateString()
                          : sub.current_period_end
                          ? new Date(sub.current_period_end).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {(sub.status === 'active' || sub.status === 'trial') && (
                          <button
                            onClick={() => handleRevoke(sub.creator_id)}
                            className="text-red-600 hover:text-red-800 text-xs font-medium flex items-center gap-1 ml-auto"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Revoke
                          </button>
                        )}
                        {(sub.status === 'cancelled' || sub.status === 'expired') && (
                          <button
                            onClick={() => { setGrantCreatorId(sub.creator_id); setShowGrantModal(true); }}
                            className="text-emerald-600 hover:text-emerald-800 text-xs font-medium flex items-center gap-1 ml-auto"
                          >
                            <Shield className="w-3.5 h-3.5" /> Re-Grant
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-500">
                Page {meta.page} of {meta.totalPages} ({meta.totalCount} total)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-100 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                  disabled={page === meta.totalPages}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-100 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Grant Modal */}
      {showGrantModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowGrantModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Grant Subscription</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Creator ID</label>
                <input
                  type="text"
                  value={grantCreatorId}
                  onChange={e => setGrantCreatorId(e.target.value)}
                  placeholder="MongoDB ObjectID of the creator"
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Months)</label>
                <input
                  type="number"
                  min={1}
                  max={36}
                  value={grantMonths}
                  onChange={e => setGrantMonths(parseInt(e.target.value) || 1)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowGrantModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium">Cancel</button>
              <button onClick={handleGrant} disabled={actionLoading || !grantCreatorId} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
                {actionLoading ? 'Granting...' : 'Grant Access'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Creator Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Add New Creator</h3>
            <p className="text-sm text-gray-500 mb-4">Create a new creator account with a 30-day free trial.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={addEmail}
                  onChange={e => setAddEmail(e.target.value)}
                  placeholder="creator@example.com"
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={addName}
                  onChange={e => setAddName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium">Cancel</button>
              <button onClick={handleAddCreator} disabled={actionLoading || !addEmail || !addName} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                {actionLoading ? 'Creating...' : 'Create Creator'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubscriptionsPage;
