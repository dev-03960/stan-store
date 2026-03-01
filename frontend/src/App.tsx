import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute } from './components/auth/PrivateRoute';

import OnboardingPage from './pages/onboarding/OnboardingPage';
import StorePage from './pages/StorePage';
import AffiliateRegistrationPage from './pages/storefront/AffiliateRegistrationPage';
import CustomerOrderPage from './pages/OrderPage';
import BuyerAuthPage from './pages/buyer/BuyerAuthPage';
import LoginPage from './pages/auth/LoginPage';
import LandingPage from './pages/LandingPage';
import MyPurchasesPage from './pages/buyer/MyPurchasesPage';
import { CoursePlayer } from './pages/buyer/CoursePlayer';
import DashboardPage from './pages/DashboardPage';
import { RootLayout } from './components/layout/RootLayout';
import { DashboardLayout } from './components/layout/DashboardLayout';
import EarningsPage from './pages/dashboard/EarningsPage';
import OrdersPage from './pages/dashboard/OrdersPage';
import CouponsPage from './pages/dashboard/CouponsPage';
import SettingsPage from './pages/dashboard/SettingsPage';
import IntegrationsPage from './pages/dashboard/IntegrationsPage';
import { CampaignsPage } from './pages/dashboard/CampaignsPage';
import AffiliateDashboard from './pages/dashboard/AffiliateDashboard';
import AnalyticsDashboard from './pages/dashboard/AnalyticsDashboard';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { trackAffiliateClick } from './features/affiliates/api';
import { CookieConsentBanner } from './components/storefront/CookieConsentBanner';
import { hasAnalyticsConsent } from './lib/analytics';

function GlobalTracker() {
  React.useEffect(() => {
    // Only track if consent has been explicitly granted
    if (!hasAnalyticsConsent()) return;

    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      trackAffiliateClick(ref).catch(err => console.error('Failed to track click:', err));
    }
  }, []);

  return null;
}



export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <GlobalTracker />
          <CookieConsentBanner />
          <Routes>
            {/* Public pages with header/footer */}
            <Route element={<RootLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/store/:username" element={<StorePage />} />
              <Route path="/store/:username/affiliate" element={<AffiliateRegistrationPage />} />
              <Route path="/order/:orderId" element={<CustomerOrderPage />} />
            </Route>

            {/* Auth pages (standalone, no header/footer) */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/buyer/login" element={<BuyerAuthPage />} />
            <Route path="/my-purchases" element={<MyPurchasesPage />} />
            <Route path="/course-player/:productId" element={<CoursePlayer />} />

            {/* Creator Protected Routes (own layout with sidebar) */}
            <Route element={<PrivateRoute />}>
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="earnings" element={<EarningsPage />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="coupons" element={<CouponsPage />} />
                <Route path="campaigns" element={<CampaignsPage />} />
                <Route path="integrations" element={<IntegrationsPage />} />
                <Route path="affiliates" element={<AffiliateDashboard />} />
                <Route path="analytics" element={<AnalyticsDashboard />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
