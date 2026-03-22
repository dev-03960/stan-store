import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { MioLogo } from '../../components/brand/MioLogo';
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowRight, Zap, TrendingUp } from 'lucide-react';

export default function LoginPage() {
    const { isAuthenticated, user, checkAuth } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [mode, setMode] = useState<'login' | 'signup'>('signup');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Redirect if already logged in
    useEffect(() => {
        if (isAuthenticated && user) {
            const from = (location.state as any)?.from?.pathname || (user.username ? '/dashboard' : '/onboarding');
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, user, navigate, location.state]);

    const handleGoogleLogin = () => {
        window.location.href = '/api/v1/auth/google';
    };

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (mode === 'signup') {
                if (password !== confirmPassword) {
                    setError('Passwords do not match');
                    setIsLoading(false);
                    return;
                }
                if (password.length < 8) {
                    setError('Password must be at least 8 characters');
                    setIsLoading(false);
                    return;
                }
                await api.post('/auth/creator/signup', { email, password });
                navigate('/verify-otp', { state: { email } });
            } else {
                const res = await api.post<{ user: any; token: string; redirectUrl: string }>('/auth/creator/login', { email, password });
                if (res.data?.redirectUrl) {
                    await checkAuth();
                    // The useEffect above will handle the actual redirection once checkAuth finishes
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen">
            {/* Left Panel — Marketing */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#6786f5] to-[#4a6cf7] text-white relative overflow-hidden flex-col justify-center px-16">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10 max-w-lg">
                    <div className="mb-8">
                        <MioLogo size="lg" />
                    </div>

                    <div className="mb-4">
                        <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm">
                            Creator Platform
                        </span>
                    </div>

                    <h1 className="text-4xl font-bold leading-tight mb-4" style={{ fontFamily: "'Lexend', sans-serif" }}>
                        Turn your passion<br />
                        into a <span className="text-yellow-300">thriving business.</span>
                    </h1>

                    <p className="text-lg text-white/80 mb-10 leading-relaxed">
                        Sell digital products, courses, and consultations with instant payouts to your UPI or bank.
                    </p>

                    {/* Feature Cards */}
                    <div className="grid grid-cols-2 gap-4 mb-10">
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                            <Zap className="w-6 h-6 mb-2 text-yellow-300" />
                            <p className="font-semibold text-sm">Instant Payouts</p>
                            <p className="text-xs text-white/60 mt-1">Directly to your UPI or Bank</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                            <TrendingUp className="w-6 h-6 mb-2 text-green-300" />
                            <p className="font-semibold text-sm">0% Platform Fee</p>
                            <p className="text-xs text-white/60 mt-1">On your first ₹50,000 sales</p>
                        </div>
                    </div>

                    {/* Social Proof */}
                    <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                            {['🟣', '🔵', '🟢'].map((_, i) => (
                                <div key={i} className="w-8 h-8 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-xs backdrop-blur-sm">
                                    {['D', 'A', 'R'][i]}
                                </div>
                            ))}
                        </div>
                        <p className="text-sm text-white/80">
                            <span className="font-semibold text-white">Joined by 500+ creators</span> today
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Panel — Auth Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-white dark:bg-[#0f111a] px-6 py-12">
                <div className="w-full max-w-md space-y-8">
                    {/* Mobile-only logo */}
                    <div className="lg:hidden text-center flex flex-col items-center gap-3">
                        <MioLogo size="lg" />
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: "'Lexend', sans-serif" }}>
                            {mode === 'signup' ? 'Create your store' : 'Welcome back'}
                        </h2>
                        <p className="mt-2 text-gray-500 dark:text-gray-400">
                            {mode === 'signup' ? 'Start your journey as an independent creator' : 'Sign in to manage your store'}
                        </p>
                    </div>

                    <div className="space-y-4">
                        {/* Google Auth Button */}
                        <button
                            onClick={handleGoogleLogin}
                            className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1d2b] px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm transition-all hover:bg-gray-50 dark:hover:bg-[#252838] focus:outline-none focus:ring-2 focus:ring-[#6786f5] focus:ring-offset-2"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Continue with Google
                        </button>

                        {/* Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase tracking-wider">
                                <span className="bg-white dark:bg-[#0f111a] px-4 text-gray-400">or email</span>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 rounded-xl text-sm">
                                {error}
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleEmailSubmit} className="space-y-4">
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Email address"
                                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1d2b] text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#6786f5] focus:outline-none focus:ring-2 focus:ring-[#6786f5]/20"
                                />
                            </div>

                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Password"
                                    minLength={8}
                                    className="w-full pl-11 pr-12 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1d2b] text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#6786f5] focus:outline-none focus:ring-2 focus:ring-[#6786f5]/20"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>

                            {mode === 'signup' && (
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm password"
                                        minLength={8}
                                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1d2b] text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#6786f5] focus:outline-none focus:ring-2 focus:ring-[#6786f5]/20"
                                    />
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#6786f5] px-6 py-3 text-base font-semibold text-white shadow-sm transition-all hover:bg-[#5570e0] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#6786f5] focus:ring-offset-2"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        {mode === 'signup' ? 'Sign up as Creator' : 'Sign In'}
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Terms (signup only) */}
                        {mode === 'signup' && (
                            <p className="text-xs text-center text-gray-400">
                                By signing up, you agree to our{' '}
                                <a href="#" className="text-[#6786f5] hover:underline">Terms of Service</a> and{' '}
                                <a href="#" className="text-[#6786f5] hover:underline">Privacy Policy</a>.
                            </p>
                        )}

                        {/* Toggle */}
                        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                            {mode === 'login' ? (
                                <>Don't have an account?{' '}
                                    <button type="button" onClick={() => { setMode('signup'); setError(''); }} className="text-[#6786f5] font-semibold hover:underline">
                                        Sign up
                                    </button>
                                </>
                            ) : (
                                <>Already have an account?{' '}
                                    <button type="button" onClick={() => { setMode('login'); setError(''); }} className="text-[#6786f5] font-semibold hover:underline">
                                        Sign in
                                    </button>
                                </>
                            )}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
