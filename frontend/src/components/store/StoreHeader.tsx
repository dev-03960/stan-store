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

    return (
        <div className="flex flex-col items-center text-center py-8 px-4 max-w-2xl mx-auto">
            <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-2 border-slate-100 shadow-sm">
                {profile.avatarUrl ? (
                    <img
                        src={profile.avatarUrl}
                        alt={profile.displayName}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">
                        <span className="text-3xl font-bold">{profile.displayName.charAt(0)}</span>
                    </div>
                )}
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-2">{profile.displayName}</h1>

            {profile.bio && (
                <p className="text-slate-600 mb-6 max-w-md leading-relaxed">
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
                            className="p-2 rounded-full bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
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
