import React from 'react';
import type { CreatorProfile } from '../../lib/api/store';
import { Instagram, Youtube, Twitter, Linkedin, Facebook, Link as LinkIcon } from 'lucide-react';

interface StoreHeaderProps {
    profile: CreatorProfile;
}

const StoreHeader: React.FC<StoreHeaderProps> = ({ profile }) => {
    const getSocialIcon = (platform: string) => {
        switch (platform.toLowerCase()) {
            case 'instagram': return <Instagram className="w-5 h-5" />;
            case 'youtube': return <Youtube className="w-5 h-5" />;
            case 'twitter': return <Twitter className="w-5 h-5" />;
            case 'linkedin': return <Linkedin className="w-5 h-5" />;
            case 'facebook': return <Facebook className="w-5 h-5" />;
            default: return <LinkIcon className="w-5 h-5" />;
        }
    };

    const brandColor = profile.brandColor || 'var(--theme-accent, #6C5CE7)';

    return (
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
            {/* Cover Photo / Banner */}
            {profile.coverPhotoUrl ? (
                <div className="w-full h-40 sm:h-48 rounded-xl overflow-hidden mb-4 shadow-sm">
                    <img
                        src={profile.coverPhotoUrl}
                        alt="Store banner"
                        className="w-full h-full object-cover"
                    />
                </div>
            ) : (
                <div
                    className="w-full h-24 sm:h-32 rounded-xl mb-4"
                    style={{
                        background: `linear-gradient(135deg, ${brandColor}22, ${brandColor}08)`,
                    }}
                />
            )}

            {/* Avatar */}
            <div
                className="w-24 h-24 rounded-full overflow-hidden -mt-16 mb-4 border-4 shadow-lg relative z-10"
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
                        className="w-full h-full flex items-center justify-center text-white text-3xl font-bold"
                        style={{ backgroundColor: brandColor }}
                    >
                        {profile.displayName.charAt(0)}
                    </div>
                )}
            </div>

            <h1
                className="text-2xl font-bold mb-2"
                style={{ color: 'var(--theme-text-primary)', fontFamily: profile.fontFamily || 'inherit' }}
            >
                {profile.displayName}
            </h1>

            {profile.bio && (
                <p
                    className="mb-6 max-w-md leading-relaxed"
                    style={{ color: 'var(--theme-text-secondary)' }}
                >
                    {profile.bio}
                </p>
            )}

            {profile.socialLinks && profile.socialLinks.length > 0 && (
                <div className="flex flex-wrap justify-center gap-4 mb-2">
                    {profile.socialLinks.map((link, index) => (
                        <a
                            key={index}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-full transition-colors"
                            style={{
                                backgroundColor: 'var(--theme-surface, #f8fafc)',
                                color: 'var(--theme-text-secondary, #64748b)',
                            }}
                            aria-label={link.platform}
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
