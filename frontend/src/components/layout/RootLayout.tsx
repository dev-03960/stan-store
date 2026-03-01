import { Outlet } from 'react-router-dom';
import { MioLogo } from '../brand/MioLogo';

export const RootLayout = () => {
    return (
        <div className="flex min-h-screen flex-col bg-white">
            {/* Sticky Header */}
            <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-lg">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <a href="/" className="hover:opacity-80 transition-opacity">
                        <MioLogo size="sm" />
                    </a>
                    <nav className="flex items-center gap-3">
                        <a
                            href="/login"
                            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-3 py-2"
                        >
                            Sign In
                        </a>
                        <a
                            href="/login"
                            className="rounded-full bg-gradient-to-r from-pink-500 to-orange-500 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:shadow-md transition-shadow"
                        >
                            Get Started
                        </a>
                    </nav>
                </div>
            </header>

            {/* Main Content — full-width, pages manage their own max-width */}
            <main className="flex-1">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-100 bg-gray-50">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <MioLogo size="sm" />
                        <p className="text-sm text-gray-400">
                            &copy; {new Date().getFullYear()} Mio Store. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
