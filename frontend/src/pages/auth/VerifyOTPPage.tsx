import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { MioLogo } from '../../components/brand/MioLogo';
import { Loader2, ShieldCheck, ArrowLeft } from 'lucide-react';

export default function VerifyOTPPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { checkAuth } = useAuth();
    const email = (location.state as any)?.email || '';
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // If no email in state, redirect back to login
    useEffect(() => {
        if (!email) {
            navigate('/login', { replace: true });
        }
    }, [email, navigate]);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pastedData.length === 6) {
            const newOtp = pastedData.split('');
            setOtp(newOtp);
            inputRefs.current[5]?.focus();
        }
    };

    const handleVerify = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const code = otp.join('');
        if (code.length !== 6) {
            setError('Please enter the complete 6-digit code');
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            const res = await api.post<{ redirectUrl: string }>('/auth/creator/verify-otp', {
                email,
                otp: code,
            });
            await checkAuth();
            navigate(res.data?.redirectUrl || '/onboarding', { replace: true });
        } catch (err: any) {
            setError(err.response?.data?.error || 'Invalid OTP. Please try again.');
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;
        setError('');
        try {
            await api.post('/auth/creator/signup', { email, password: '__resend__' });
            setResendCooldown(60);
        } catch {
            setError('Could not resend OTP. Please try signing up again.');
        }
    };

    // Auto-submit when all 6 digits entered
    useEffect(() => {
        const code = otp.join('');
        if (code.length === 6) {
            handleVerify();
        }
    }, [otp]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#f8f9ff] dark:bg-[#0f111a] px-4 py-12">
            <div className="w-full max-w-md space-y-8 rounded-2xl bg-white dark:bg-[#1a1d2b] p-10 shadow-xl border border-gray-100 dark:border-gray-800">
                <div className="text-center flex flex-col items-center gap-3">
                    <MioLogo size="lg" />
                    <div className="w-16 h-16 bg-[#6786f51a] rounded-full flex items-center justify-center mx-auto">
                        <ShieldCheck className="w-8 h-8 text-[#6786f5]" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: "'Lexend', sans-serif" }}>
                        Verify your email
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        We've sent a 6-digit verification code to <br />
                        <span className="font-medium text-gray-700 dark:text-gray-200">{email}</span>
                    </p>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 rounded-xl text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleVerify} className="space-y-6">
                    {/* OTP Input Boxes */}
                    <div className="flex justify-center gap-3">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => { inputRefs.current[index] = el; }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={handlePaste}
                                className="w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-[#252838] focus:border-[#6786f5] focus:outline-none focus:ring-2 focus:ring-[#6786f5]/20 transition-all text-gray-900 dark:text-white"
                                autoFocus={index === 0}
                            />
                        ))}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || otp.join('').length !== 6}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#6786f5] px-6 py-3 text-base font-semibold text-white shadow-sm transition-all hover:bg-[#5570e0] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#6786f5] focus:ring-offset-2"
                    >
                        {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                        Verify & Continue
                    </button>
                </form>

                <div className="text-center space-y-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Didn't receive the code?{' '}
                        {resendCooldown > 0 ? (
                            <span className="text-gray-400">Resend in {resendCooldown}s</span>
                        ) : (
                            <button
                                type="button"
                                onClick={handleResend}
                                className="text-[#6786f5] font-semibold hover:underline"
                            >
                                Resend OTP
                            </button>
                        )}
                    </p>

                    <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to login
                    </button>
                </div>
            </div>
        </div>
    );
}
