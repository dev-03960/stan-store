import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { formatPrice } from '../../lib/utils';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface Coupon {
    id: string;
    creator_id: string;
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    min_order_amount: number;
    max_uses: number;
    times_used: number;
    applicable_product_ids: string[] | null;
    is_active: boolean;
    expires_at: string | null;
    created_at: string;
}

export default function CouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        code: '',
        discount_type: 'percentage',
        discount_value: 0,
        min_order_amount: 0,
        max_uses: 0,
        expires_at: '',
    });

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            const res = await api.get<Coupon[]>('/coupons');
            setCoupons(res.data || []);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch coupons');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const handleOpenModal = (coupon?: Coupon) => {
        if (coupon) {
            setEditingCoupon(coupon);
            setFormData({
                code: coupon.code,
                discount_type: coupon.discount_type,
                // Convert paise to rupees for form display if fixed
                discount_value: coupon.discount_type === 'fixed' ? coupon.discount_value / 100 : coupon.discount_value,
                min_order_amount: coupon.min_order_amount / 100,
                max_uses: coupon.max_uses,
                expires_at: coupon.expires_at ? new Date(coupon.expires_at).toISOString().split('T')[0] : '',
            });
        } else {
            setEditingCoupon(null);
            setFormData({
                code: '',
                discount_type: 'percentage',
                discount_value: 0,
                min_order_amount: 0,
                max_uses: 0,
                expires_at: '',
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCoupon(null);
    };

    const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData({ ...formData, code });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Format payload (convert to paise)
            const payload = {
                code: formData.code.toUpperCase(),
                discount_type: formData.discount_type,
                discount_value: formData.discount_type === 'fixed' ? Math.round(formData.discount_value * 100) : Number(formData.discount_value),
                min_order_amount: Math.round(formData.min_order_amount * 100),
                max_uses: Number(formData.max_uses),
                expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
            };

            if (editingCoupon) {
                await api.put(`/coupons/${editingCoupon.id}`, payload);
            } else {
                await api.post('/coupons', payload);
            }

            handleCloseModal();
            fetchCoupons();
        } catch (err: any) {
            alert(err.message || 'Failed to save coupon');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this coupon?')) {
            try {
                await api.delete(`/coupons/${id}`);
                fetchCoupons();
            } catch (err: any) {
                alert(err.message || 'Failed to delete coupon');
            }
        }
    };

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        try {
            await api.patch(`/coupons/${id}/status`, { is_active: !currentStatus });
            fetchCoupons();
        } catch (err: any) {
            alert(err.message || 'Failed to update status');
        }
    };

    if (loading) return <div className="p-8">Loading coupons...</div>;

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-semibold text-gray-900">Discount Coupons</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Create and manage promotional codes for your products.
                    </p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                    <button
                        onClick={() => handleOpenModal()}
                        type="button"
                        className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
                    >
                        <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                        Create Coupon
                    </button>
                </div>
            </div>

            {error && (
                <div className="mt-4 rounded-md bg-red-50 p-4">
                    <div className="text-sm text-red-700">{error}</div>
                </div>
            )}

            {/* Coupons Table */}
            <div className="mt-8 flex flex-col">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Code</th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Discount</th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Usage</th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Expires</th>
                                        <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {coupons.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-10 text-center text-sm text-gray-500">
                                                No coupons created yet. Click "Create Coupon" to get started.
                                            </td>
                                        </tr>
                                    ) : coupons.map((coupon) => (
                                        <tr key={coupon.id}>
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 font-mono">
                                                {coupon.code}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                {coupon.discount_type === 'percentage'
                                                    ? `${coupon.discount_value}% OFF`
                                                    : `${formatPrice(coupon.discount_value)} OFF`}
                                                {coupon.min_order_amount > 0 && <span className="block text-xs text-gray-400">Min: {formatPrice(coupon.min_order_amount)}</span>}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                {coupon.times_used} / {coupon.max_uses === 0 ? '∞' : coupon.max_uses}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                <button
                                                    onClick={() => handleToggleActive(coupon.id, coupon.is_active)}
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${coupon.is_active ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {coupon.is_active ? 'Active' : 'Inactive'}
                                                </button>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : 'Never'}
                                            </td>
                                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                <button
                                                    onClick={() => handleOpenModal(coupon)}
                                                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                >
                                                    <Pencil className="h-5 w-5" aria-hidden="true" />
                                                    <span className="sr-only">Edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(coupon.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    <Trash2 className="h-5 w-5" aria-hidden="true" />
                                                    <span className="sr-only">Delete</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={handleCloseModal}></div>
                        </div>

                        <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>

                        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
                            <form onSubmit={handleSubmit}>
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                                        {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
                                    </h3>

                                    <div className="space-y-4">
                                        {/* Code */}
                                        <div>
                                            <label htmlFor="code" className="block text-sm font-medium text-gray-700">Coupon Code</label>
                                            <div className="mt-1 flex rounded-md shadow-sm">
                                                <input
                                                    type="text"
                                                    name="code"
                                                    id="code"
                                                    required
                                                    value={formData.code}
                                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                                    className="block w-full flex-1 rounded-none rounded-l-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm uppercase font-mono px-3 py-2 border"
                                                    placeholder="SUMMER50"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={generateCode}
                                                    className="relative -ml-px inline-flex items-center space-x-2 rounded-r-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                >
                                                    Generate
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Discount Type */}
                                            <div>
                                                <label htmlFor="discount_type" className="block text-sm font-medium text-gray-700">Discount Type</label>
                                                <select
                                                    id="discount_type"
                                                    value={formData.discount_type}
                                                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed' })}
                                                    className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm border"
                                                >
                                                    <option value="percentage">Percentage (%)</option>
                                                    <option value="fixed">Fixed Amount (₹)</option>
                                                </select>
                                            </div>

                                            {/* Discount Value */}
                                            <div>
                                                <label htmlFor="discount_value" className="block text-sm font-medium text-gray-700">
                                                    {formData.discount_type === 'percentage' ? 'Percentage Off' : 'Amount Off (₹)'}
                                                </label>
                                                <input
                                                    type="number"
                                                    id="discount_value"
                                                    required
                                                    min="1"
                                                    max={formData.discount_type === 'percentage' ? 100 : undefined}
                                                    value={formData.discount_value || ''}
                                                    onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                                                />
                                            </div>
                                        </div>

                                        {/* Minimum Order */}
                                        <div>
                                            <label htmlFor="min_order" className="block text-sm font-medium text-gray-700">Minimum Order Amount (₹) - Optional</label>
                                            <input
                                                type="number"
                                                id="min_order"
                                                min="0"
                                                value={formData.min_order_amount || ''}
                                                onChange={(e) => setFormData({ ...formData, min_order_amount: Number(e.target.value) })}
                                                placeholder="0 for no minimum"
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Max Uses */}
                                            <div>
                                                <label htmlFor="max_uses" className="block text-sm font-medium text-gray-700">Usage Limit</label>
                                                <input
                                                    type="number"
                                                    id="max_uses"
                                                    min="0"
                                                    value={formData.max_uses || ''}
                                                    onChange={(e) => setFormData({ ...formData, max_uses: Number(e.target.value) })}
                                                    placeholder="0 for unlimited"
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                                                />
                                            </div>

                                            {/* Expiry Date */}
                                            <div>
                                                <label htmlFor="expires_at" className="block text-sm font-medium text-gray-700">Expiry Date (Optional)</label>
                                                <input
                                                    type="date"
                                                    id="expires_at"
                                                    value={formData.expires_at}
                                                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                                                />
                                            </div>
                                        </div>

                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                                    <button
                                        type="submit"
                                        className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        Save Coupon
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
