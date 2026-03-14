import React from 'react';

interface MioLogoProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showText?: boolean;
    className?: string;
}

const sizes = {
    sm: { icon: 28, text: 'text-lg' },
    md: { icon: 36, text: 'text-xl' },
    lg: { icon: 48, text: 'text-3xl' },
    xl: { icon: 64, text: 'text-5xl' },
};

export const MioLogo: React.FC<MioLogoProps> = ({ size = 'md', showText = true, className = '' }) => {
    const { icon, text } = sizes[size];

    return (
        <span className={`inline-flex items-center gap-2 ${className}`}>
            <img
                src="/logo.jpg"
                alt="Miostore"
                width={icon}
                height={icon}
                className="rounded-lg object-contain"
                style={{ width: icon, height: icon }}
            />
            {showText && (
                <span className={`font-heading font-bold ${text}`}>
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Miostore
                    </span>
                </span>
            )}
        </span>
    );
};

export default MioLogo;
