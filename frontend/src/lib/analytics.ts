/**
 * Analytics utility for checking consent and managing tracking cookies securely.
 */

const CONSENT_COOKIE_KEY = 'analytics_consent';

/**
 * Checks if the user has explicitly granted analytics consent.
 * @returns true if consent is granted, false otherwise (including not set).
 */
export function hasAnalyticsConsent(): boolean {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith(`${CONSENT_COOKIE_KEY}=`)) {
            const value = cookie.substring(CONSENT_COOKIE_KEY.length + 1);
            return value === 'true';
        }
    }
    return false;
}

/**
 * Checks if a consent choice (true or false) has been made at all.
 * @returns true if a choice was made, false if no choice exists.
 */
export function hasMadeConsentChoice(): boolean {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith(`${CONSENT_COOKIE_KEY}=`)) {
            return true;
        }
    }
    return false;
}

/**
 * Sets the analytics consent preference.
 * @param granted - whether the user accepted (true) or declined (false) analytics.
 */
export function setAnalyticsConsent(granted: boolean): void {
    const maxAge = 365 * 24 * 60 * 60; // 365 days in seconds
    const secure = window.location.protocol === 'https:' ? 'Secure;' : '';
    // SameSite=Lax is good enough generally, but we can use Strict if we want.
    // Lax allows standard navigation.
    document.cookie = `${CONSENT_COOKIE_KEY}=${granted}; Path=/; Max-Age=${maxAge}; ${secure} SameSite=Lax`;
}
