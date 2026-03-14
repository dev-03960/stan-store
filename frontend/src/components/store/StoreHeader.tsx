import React from 'react';
import type { CreatorProfile } from '../../lib/api/store';
import { Instagram, Youtube, Twitter, Linkedin, Facebook, Link as LinkIcon } from 'lucide-react';

interface StoreHeaderProps {
    profile: CreatorProfile;
}

const StoreHeader: React.FC<StoreHeaderProps> = ({ profile }) => {
    const getSocialIcon = (platform: string) => {
        switch (platform.toLowerCase()) {
            case 'instagram': return <Instagram className="w-5 h-5 sm:w-6 sm:h-6" />;
            case 'youtube': return <Youtube className="w-5 h-5 sm:w-6 sm:h-6" />;
            case 'twitter': return <Twitter className="w-5 h-5 sm:w-6 sm:h-6" />;
            case 'linkedin': return <Linkedin className="w-5 h-5 sm:w-6 sm:h-6" />;
            case 'facebook': return <Facebook className="w-5 h-5 sm:w-6 sm:h-6" />;
            default: return <LinkIcon className="w-5 h-5 sm:w-6 sm:h-6" />;
        }
    };

    const brandColor = profile.brandColor || 'var(--theme-accent, #6C5CE7)';

    return (
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto px-2">
            {/* Cover Photo / Banner */}
            <div className={`w-full ${profile.coverPhotoUrl ? 'h-32 sm:h-48' : 'h-24 sm:h-32'} rounded-2xl overflow-hidden mb-4 shadow-sm relative`}>
                {profile.coverPhotoUrl ? (
                    <img
                        src={profile.coverPhotoUrl}
                        alt="Store banner"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div
                        className="w-full h-full"
                        style={{
                            background: `linear-gradient(135deg, ${brandColor}22, ${brandColor}08)`,
                        }}
                    />
                )}
            </div>

            {/* Avatar */}
            <div
                className="w-20 h-20 sm:w-28 sm:h-28 rounded-full overflow-hidden -mt-14 sm:-mt-20 mb-4 border-4 shadow-xl relative z-10 transition-transform hover:scale-105"
                style={{ borderColor: 'var(--theme-surface, #fff)' }}
            >
                {profile.avatarUrl ? (
                    <img
                        src={profile.avatarUrl}
                        alt={profile.displayName}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div
                        className="w-full h-full flex items-center justify-center text-white text-2xl sm:text-4xl font-bold"
                        style={{ backgroundColor: brandColor }}
                    >
                        {profile.displayName.charAt(0)}
                    </div>
                )}
            </div>

            <h1
                className="text-xl sm:text-3xl font-extrabold mb-2 tracking-tight"
                style={{ color: 'var(--theme-text-primary)', fontFamily: profile.fontFamily || 'inherit' }}
            >
                {profile.displayName}
            </h1>

            {profile.bio && (
                <p
                    className="text-sm sm:text-base mb-6 max-w-md leading-relaxed opacity-90 px-4"
                    style={{ color: 'var(--theme-text-secondary)' }}
                >
                    {profile.bio}
                </p>
            )}

            {profile.socialLinks && profile.socialLinks.length > 0 && (
                <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-2">
                    {profile.socialLinks.map((link, index) => (
                        <a
                            key={index}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 sm:p-3 rounded-full transition-all hover:scale-110 active:scale-95 shadow-sm hover:brightness-110"
                            style={{
                                backgroundColor: 'var(--theme-surface)',
                                color: 'var(--theme-text-secondary)',
                                border: '1px solid var(--theme-border)',
                            }}
                            aria-label={link.platform}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.color = 'var(--theme-accent)';
                                e.currentTarget.style.borderColor = 'var(--theme-accent)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.color = 'var(--theme-text-secondary)';
                                e.currentTarget.style.borderColor = 'var(--theme-border)';
                            }}
                        >
                            {getSocialIcon(link.platform)}
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StoreHeader;
