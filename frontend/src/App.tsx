import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute } from './components/auth/PrivateRoute';

import OnboardingPage from './pages/onboarding/OnboardingPage';
import StorePage from './pages/StorePage';
import CustomerOrderPage from './pages/OrderPage';
import BuyerAuthPage from './pages/buyer/BuyerAuthPage';
import MyPurchasesPage from './pages/buyer/MyPurchasesPage';
import { CoursePlayer } from './pages/buyer/CoursePlayer';
import DashboardPage from './pages/DashboardPage';
import { RootLayout } from './components/layout/RootLayout';
import { DashboardLayout } from './components/layout/DashboardLayout';
import EarningsPage from './pages/dashboard/EarningsPage';
import OrdersPage from './pages/dashboard/OrdersPage';
import CouponsPage from './pages/dashboard/CouponsPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import { ErrorBoundary } from './components/ErrorBoundary';

function StorefrontPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h1 className="mb-4 font-heading text-5xl font-bold text-gray-900">
        Welcome to Stan Store
      </h1>
      <p className="mb-8 max-w-2xl text-xl text-gray-600">
        The all-in-one creator store. Sell digital products, courses, and coaching directly to your audience.
      </p>
      <div className="flex gap-4">
        <a
          href="/login"
          className="rounded-full bg-purple-600 px-8 py-3 text-lg font-medium text-white transition-colors hover:bg-purple-700"
        >
          Start for Free
        </a>
        <a
          href="/login"
          className="rounded-full border border-gray-300 bg-white px-8 py-3 text-lg font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Login
        </a>
      </div>
    </div>
  );
}



export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<RootLayout />}>
              {/* Public Routes */}
              <Route path="/" element={<StorefrontPage />} />
              {/* Storefront / Customer Routes */}
              <Route path="/store/:username" element={<StorePage />} />
              <Route path="/order/:orderId" element={<CustomerOrderPage />} />

              {/* Buyer Auth & Dashboard Routes */}
              <Route path="/login" element={<BuyerAuthPage />} />
              <Route path="/my-purchases" element={<MyPurchasesPage />} />
              <Route path="/course-player/:productId" element={<CoursePlayer />} />

              {/* Creator Protected Routes */}
              <Route element={<PrivateRoute />}>
                <Route path="/dashboard" element={<DashboardLayout />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="earnings" element={<EarningsPage />} />
                  <Route path="orders" element={<OrdersPage />} />
                  <Route path="coupons" element={<CouponsPage />} />
                </Route>
                <Route path="/admin" element={<AdminDashboardPage />} />
                <Route path="/onboarding" element={<OnboardingPage />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
