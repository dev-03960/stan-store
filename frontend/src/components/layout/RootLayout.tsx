import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { MioLogo } from '../brand/MioLogo';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const RootLayout = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();

    const navLinks = [
        { name: 'Pricing', href: '/pricing' },
        { name: 'About', href: '/about' },
        { name: 'Blog', href: '/blog' },
    ];

    return (
        <div className="flex min-h-screen flex-col bg-white dark:bg-[#0f111a] transition-colors duration-300">
            {/* Sticky Header */}
            <header className="sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800 bg-white/90 dark:bg-[#0f111a]/90 backdrop-blur-lg">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <Link to="/" className="hover:opacity-80 transition-opacity" onClick={() => setIsMenuOpen(false)}>
                        <MioLogo size="sm" />
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-3">
                        <ThemeToggle />
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                to={link.href}
                                className={`text-sm font-medium transition-colors px-3 py-2 ${
                                    location.pathname === link.href
                                        ? 'text-blue-600 dark:text-blue-400'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
                                {link.name}
                            </Link>
                        ))}
                        <Link
                            to="/login"
                            className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors px-3 py-2"
                        >
                            Sign In
                        </Link>
                        <Link
                            to="/login"
                            className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:shadow-md transition-shadow"
                        >
                            Get Started
                        </Link>
                    </nav>

                    {/* Mobile Menu Button */}
                    <div className="flex items-center gap-4 md:hidden">
                        <ThemeToggle />
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2 -mr-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Dropdown */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0f111a] overflow-hidden"
                        >
                            <nav className="flex flex-col p-4 gap-2">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        to={link.href}
                                        onClick={() => setIsMenuOpen(false)}
                                        className={`px-4 py-3 rounded-2xl text-base font-bold transition-all ${
                                            location.pathname === link.href
                                                ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
                                        }`}
                                    >
                                        {link.name}
                                    </Link>
                                ))}
                                <div className="h-px bg-gray-100 dark:bg-gray-800 my-2 mx-4" />
                                <Link
                                    to="/login"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="px-4 py-3 rounded-2xl text-base font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/login"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="mt-2 w-full text-center rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 text-base font-bold text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                                >
                                    Get Started for Free
                                </Link>
                            </nav>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* Main Content — full-width, pages manage their own max-width */}
            <main className="flex-1">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1d2b]">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex flex-col items-center sm:items-start gap-2">
                            <MioLogo size="sm" />
                            <p className="text-xs text-gray-500 dark:text-gray-500 max-w-[200px] text-center sm:text-left">
                                Creator Commerce Platform. Helping creators turn their audience into income.
                            </p>
                        </div>
                        <div className="flex items-center gap-6">
                            <a href="/pricing" className="text-sm text-gray-400 hover:text-[#6786f5] transition-colors">Pricing</a>
                            <a href="/blog" className="text-sm text-gray-400 hover:text-[#6786f5] transition-colors">Blog</a>
                            <a href="/about" className="text-sm text-gray-400 hover:text-[#6786f5] transition-colors">About</a>
                            <a href="/terms" className="text-sm text-gray-400 hover:text-[#6786f5] transition-colors">Terms</a>
                            <a href="/privacy" className="text-sm text-gray-400 hover:text-[#6786f5] transition-colors">Privacy</a>
                            <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">
                                &copy; {new Date().getFullYear()} Miostore. All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
