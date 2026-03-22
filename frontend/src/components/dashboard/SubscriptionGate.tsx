import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

interface SubscriptionStatus {
  status: string;
  has_access: boolean;
  days_remaining: number;
  subscription?: {
    id: string;
    plan: string;
    status: string;
    trial_ends_at: string;
    current_period_end: string;
  };
}

const SubscriptionContext = createContext<SubscriptionStatus | null>(null);

export const useSubscription = () => useContext(SubscriptionContext);

interface SubscriptionGateProps {
  children: React.ReactNode;
}

export const SubscriptionGate: React.FC<SubscriptionGateProps> = ({ children }) => {
  const { user, isLoading: authLoading } = useAuth();
  const [subStatus, setSubStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;

    // Only check for creators, not admins or buyers
    if (user.role === 'admin' || user.role === 'buyer') {
      setSubStatus({ status: 'active', has_access: true, days_remaining: 999 });
      setLoading(false);
      return;
    }

    const fetchStatus = async () => {
      try {
        const res = await api.get<SubscriptionStatus>('/platform/subscription');
        setSubStatus(res.data || { status: 'none', has_access: false, days_remaining: 0 });
      } catch {
        setSubStatus({ status: 'none', has_access: false, days_remaining: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  // No subscription or expired — show paywall
  if (subStatus && !subStatus.has_access) {
    return <SubscriptionPaywall status={subStatus} />;
  }

  return (
    <SubscriptionContext.Provider value={subStatus}>
      {/* Trial banner */}
      {subStatus?.status === 'trial' && subStatus.days_remaining <= 7 && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-center py-2 px-4 text-sm font-medium">
          ⏰ Your free trial ends in <strong>{subStatus.days_remaining} day{subStatus.days_remaining !== 1 ? 's' : ''}</strong>.{' '}
          <a href="/dashboard/subscribe" className="underline font-bold hover:text-white/90">Subscribe now</a> to keep access.
        </div>
      )}
      {children}
    </SubscriptionContext.Provider>
  );
};

// Paywall component shown when subscription is expired/cancelled
const SubscriptionPaywall: React.FC<{ status: SubscriptionStatus }> = ({ status }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Miostore</h1>
          <p className="text-indigo-300 mt-2">Creator Platform</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 text-center shadow-2xl">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/30">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">
            {status.status === 'expired' ? 'Your Trial Has Ended' :
             status.status === 'cancelled' ? 'Subscription Cancelled' :
             'Subscription Required'}
          </h2>
          <p className="text-indigo-200 mb-8 leading-relaxed">
            {status.status === 'expired'
              ? 'Your 30-day free trial has ended. Subscribe to continue using the Miostore platform and grow your business.'
              : status.status === 'cancelled'
              ? 'Your subscription has been cancelled. Resubscribe to regain access to your dashboard and products.'
              : 'A subscription is required to access the creator dashboard. Get started with our affordable monthly plan.'}
          </p>

          {/* Pricing Card */}
          <div className="bg-white/10 rounded-xl p-6 mb-6 border border-white/10">
            <div className="text-indigo-300 text-sm font-semibold uppercase tracking-wider mb-2">Monthly Plan</div>
            <div className="flex items-baseline justify-center gap-1 mb-4">
              <span className="text-5xl font-extrabold text-white">₹499</span>
              <span className="text-indigo-300">/month</span>
            </div>
            <ul className="text-left text-indigo-100 space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                Unlimited products & courses
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                Custom storefront & branding
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                Payment processing & payouts
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                Analytics dashboard
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                Email campaigns & automations
              </li>
            </ul>
          </div>

          <button
            onClick={() => alert('Razorpay subscription checkout will be integrated here. Contact support for manual activation.')}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 px-6 rounded-xl font-bold text-lg hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5"
          >
            Subscribe Now — ₹499/mo
          </button>

          <p className="text-indigo-400 text-xs mt-4">
            Secure payment via Razorpay • Cancel anytime
          </p>
        </div>

        {/* Logout link */}
        <div className="text-center mt-6">
          <a href="/login" className="text-indigo-400 hover:text-indigo-300 text-sm underline">
            Log in with a different account
          </a>
        </div>
      </div>
    </div>
  );
};
