import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { buyerAuthApi } from '../../features/buyer/api';

export default function BuyerAuthPage() {
    const { isAuthenticated, user } = useAuth();
    const location = useLocation();

    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    // If there's an error from the callback (e.g. "?error=invalid_token")
    const searchParams = new URLSearchParams(location.search);
    const urlError = searchParams.get('error');

    // Redirect if already logged in as a buyer
    if (isAuthenticated && user) {
        if (user.role === 'buyer') {
            return <Navigate to="/my-purchases" replace />;
        }
    }

    const handleGoogleLogin = () => {
        // Same Google OAuth as creators, but state sets "role=buyer" automatically since we will add a buyer Google route next (if we decide to split Google routing).
        // Since we didn't add the /auth/buyer/google route on backend, we will just use magic links for now as the primary method, and optionally hook Google up if needed.
        // Actually, the plan mentions we want to add /api/v1/auth/buyer/google. We can add that in a minute.
        window.location.href = 'http://localhost:8080/api/v1/auth/buyer/google';
    };

    const handleMagicLinkSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMessage('');

        try {
            await buyerAuthApi.requestMagicLink(email);
            setStatus('success');
        } catch (err: any) {
            setStatus('error');
            setErrorMessage(err.message || 'Failed to send magic link');
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-xl">
                <div className="text-center">
                    <h1 className="font-heading text-4xl font-bold text-gray-900">Buyer Login</h1>
                    <h2 className="mt-4 text-lg text-gray-600">
                        Access your purchased content
                    </h2>
                </div>

                {urlError === 'invalid_token' && (
                    <div className="rounded-md bg-red-50 p-4">
                        <p className="text-sm text-red-700">The login link was invalid or expired. Please request a new one.</p>
                    </div>
                )}

                {status === 'success' ? (
                    <div className="rounded-md bg-green-50 p-4 text-center">
                        <h3 className="text-lg font-medium text-green-800">Check your email</h3>
                        <p className="mt-2 text-sm text-green-700">
                            We sent a magic link to <strong>{email}</strong>. Click the link to securely log in.
                        </p>
                        <button
                            onClick={() => setStatus('idle')}
                            className="mt-4 text-sm font-medium text-green-600 hover:text-green-500"
                        >
                            Try another email
                        </button>
                    </div>
                ) : (
                    <div className="mt-8 space-y-6">
                        <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="email" className="sr-only">Email address</label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="relative block w-full rounded-md border-0 py-2.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                    placeholder="your@email.com"
                                />
                            </div>

                            {status === 'error' && (
                                <p className="text-sm text-red-600">{errorMessage}</p>
                            )}

                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="group relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-70"
                            >
                                {status === 'loading' ? 'Sending...' : 'Send Magic Link'}
                            </button>
                        </form>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="bg-white px-2 text-gray-500">Or</span>
                            </div>
                        </div>

                        <button
                            onClick={handleGoogleLogin}
                            className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-8 py-2.5 text-base font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Login with Google
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
