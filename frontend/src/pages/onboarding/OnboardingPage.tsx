import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
// useDebounce removed as it was unused

// Step types
type Step = 'username' | 'profile';

export default function OnboardingPage() {
    const { user, checkAuth } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('username');

    // Username state
    const [username, setUsername] = useState('');
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
    const [usernameError, setUsernameError] = useState('');
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);

    // Profile state
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [socialLinks, setSocialLinks] = useState<{ platform: string; url: string }[]>(user?.socialLinks || []);

    // Use a simple debounce effect for username check
    useEffect(() => {
        const checkUsername = async () => {
            if (!username || username.length < 3) {
                setUsernameAvailable(null);
                setUsernameError('');
                return;
            }

            setIsCheckingUsername(true);
            try {
                const response = await api.get<{ available: boolean; reason?: string }>(
                    `/auth/username/check?username=${username}`
                );
                setUsernameAvailable(response.data?.available ?? false);
                if (!response.data?.available) {
                    setUsernameError(response.data?.reason || 'Username taken');
                } else {
                    setUsernameError('');
                }
            } catch (err) {
                setUsernameAvailable(false);
                setUsernameError('Error checking username');
            } finally {
                setIsCheckingUsername(false);
            }
        };

        const timeoutId = setTimeout(checkUsername, 500);
        return () => clearTimeout(timeoutId);
    }, [username]);

    // If user already has a username, skip to profile step or dashboard
    useEffect(() => {
        if (user?.username) {
            // If profile is incomplete (arbitrary check, e.g. empty bio), go to profile
            // Otherwise dashboard
            // For MVP, if they have username, let's assume they are done with step 1
            setStep('profile');
        }
    }, [user]);

    const handleClaimUsername = async () => {
        if (!usernameAvailable) return;
        try {
            await api.post('/auth/username', { username });
            await checkAuth(); // Refresh user state
            setStep('profile');
        } catch (err: any) {
            setUsernameError(err.error?.message || 'Failed to claim username');
        }
    };

    const handleUpdateProfile = async () => {
        try {
            await api.put('/creator/profile', {
                displayName,
                bio,
                avatarUrl: user?.avatarUrl, // Keep existing avatar from Google for now
                socialLinks
            });
            await checkAuth();
            navigate('/dashboard');
        } catch (err: any) {
            console.error(err);
            // Show error handling UI (omitted for brevity in this first pass)
        }
    };

    const addSocialLink = () => {
        if (socialLinks.length < 5) {
            setSocialLinks([...socialLinks, { platform: 'instagram', url: '' }]);
        }
    };

    const updateSocialLink = (index: number, field: 'platform' | 'url', value: string) => {
        const newLinks = [...socialLinks];
        newLinks[index] = { ...newLinks[index], [field]: value };
        setSocialLinks(newLinks);
    };

    const removeSocialLink = (index: number) => {
        setSocialLinks(socialLinks.filter((_, i) => i !== index));
    };

    if (step === 'username') {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12">
                <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-xl">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-gray-900">Claim your Link</h1>
                        <p className="mt-2 text-gray-600">Choose a unique username for your store.</p>
                    </div>

                    <div className="mt-8 space-y-6">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                                stan.store/
                            </label>
                            <div className="mt-1 flex rounded-md shadow-sm">
                                <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">
                                    stan.store/
                                </span>
                                <input
                                    type="text"
                                    name="username"
                                    id="username"
                                    className={`block w-full min-w-0 flex-1 rounded-none rounded-r-md border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500 sm:text-sm ${usernameError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                                        }`}
                                    placeholder="yourname"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                                />
                            </div>
                            {isCheckingUsername && <p className="mt-2 text-sm text-gray-500">Checking availability...</p>}
                            {!isCheckingUsername && usernameError && (
                                <p className="mt-2 text-sm text-red-600">{usernameError}</p>
                            )}
                            {!isCheckingUsername && usernameAvailable && username && (
                                <p className="mt-2 text-sm text-green-600">Username is available!</p>
                            )}
                        </div>

                        <button
                            onClick={handleClaimUsername}
                            disabled={!usernameAvailable || isCheckingUsername}
                            className="flex w-full justify-center rounded-md border border-transparent bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:bg-purple-300"
                        >
                            Claim & Continue
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12">
            <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-xl">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900">Set up your Profile</h1>
                    <p className="mt-2 text-gray-600">Tell us a bit about yourself.</p>
                </div>

                <div className="mt-8 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Display Name</label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Bio</label>
                        <textarea
                            rows={3}
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            maxLength={160}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                        />
                        <p className="mt-1 text-right text-xs text-gray-500">{bio.length}/160</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Social Links</label>
                        <div className="mt-2 space-y-3">
                            {socialLinks.map((link, index) => (
                                <div key={index} className="flex gap-2">
                                    <select
                                        value={link.platform}
                                        onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                                        className="rounded-md border border-gray-300 py-2 pl-3 pr-8 text-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500"
                                    >
                                        <option value="instagram">Instagram</option>
                                        <option value="tiktok">TikTok</option>
                                        <option value="twitter">Twitter</option>
                                        <option value="youtube">YouTube</option>
                                        <option value="linkedin">LinkedIn</option>
                                    </select>
                                    <input
                                        type="url"
                                        value={link.url}
                                        onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                                        placeholder="https://..."
                                        className="block w-full flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500"
                                    />
                                    <button
                                        onClick={() => removeSocialLink(index)}
                                        className="text-gray-400 hover:text-red-500"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                            {socialLinks.length < 5 && (
                                <button
                                    type="button"
                                    onClick={addSocialLink}
                                    className="text-sm font-medium text-purple-600 hover:text-purple-500"
                                >
                                    + Add Social Link
                                </button>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={handleUpdateProfile}
                        className="flex w-full justify-center rounded-md border border-transparent bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                    >
                        Complete Setup
                    </button>
                </div>
            </div>
        </div>
    );
}
