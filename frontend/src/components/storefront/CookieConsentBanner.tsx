import React, { useState, useEffect } from 'react';
import { hasMadeConsentChoice, setAnalyticsConsent } from '../../lib/analytics';
import { X, ShieldAlert } from 'lucide-react';

export const CookieConsentBanner: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Only show if they haven't made a choice yet
        if (!hasMadeConsentChoice()) {
            setIsVisible(true);
        }
    }, []);

    const handleAccept = () => {
        setAnalyticsConsent(true);
        setIsVisible(false);
    };

    const handleDecline = () => {
        setAnalyticsConsent(false);
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div
            className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-in slide-in-from-bottom-5 duration-300"
            role="region"
            aria-label="Cookie Consent Banner"
        >
            <div className="max-w-4xl mx-auto bg-white border border-gray-200 shadow-2xl rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="hidden sm:flex bg-indigo-50 text-indigo-600 p-3 rounded-full">
                        <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-gray-900 font-bold mb-1">Your Privacy</h3>
                        <p className="text-sm text-gray-600 max-w-2xl leading-relaxed">
                            We use cookies to improve your experience. By accepting, you consent to our use of cookies for analytics to help creators understand their audience. You can decline without affecting your core experience.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                    <button
                        onClick={handleDecline}
                        className="flex-1 sm:flex-none px-5 py-2.5 border border-gray-300 text-gray-700 bg-white rounded-lg text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 transition-colors"
                        aria-label="Decline cookies"
                    >
                        Decline
                    </button>
                    <button
                        onClick={handleAccept}
                        className="flex-1 sm:flex-none px-5 py-2.5 bg-indigo-600 border border-transparent text-white rounded-lg text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                        aria-label="Accept cookies"
                    >
                        Accept
                    </button>
                    <button
                        onClick={handleDecline} // Treat closing as decline to be privacy-safe
                        className="hidden sm:flex p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors ml-2"
                        aria-label="Close banner"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};
