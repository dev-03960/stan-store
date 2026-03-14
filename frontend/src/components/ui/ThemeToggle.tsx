import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useDarkMode } from '../../hooks/useDarkMode';

interface ThemeToggleProps {
    className?: string;
    showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = false }) => {
    const { isDark, toggle } = useDarkMode();

    return (
        <button
            onClick={toggle}
            className={`flex items-center gap-2 p-2 rounded-xl transition-all hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 ${className}`}
            aria-label="Toggle dark mode"
        >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
            {showLabel && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
    );
};
