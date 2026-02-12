import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute } from './components/auth/PrivateRoute';
import LoginPage from './pages/auth/LoginPage';
import OnboardingPage from './pages/onboarding/OnboardingPage';
import { RootLayout } from './components/layout/RootLayout';
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

function DashboardPage() {
  return (
    <div className="py-12 text-center">
      <h1 className="mb-4 font-heading text-4xl font-bold text-gray-900">
        Creator Dashboard
      </h1>
      <p className="text-lg text-gray-600">
        Manage your products and track sales.
      </p>
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
              <Route path="/login" element={<LoginPage />} />

              {/* Protected Routes */}
              <Route element={<PrivateRoute />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/onboarding" element={<OnboardingPage />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
