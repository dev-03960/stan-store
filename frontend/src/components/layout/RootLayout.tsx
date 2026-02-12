import { Outlet } from 'react-router-dom';

export function RootLayout() {
    return (
        <div className="min-h-screen bg-[var(--color-surface-primary)] font-body text-[var(--color-text-primary)]">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-[var(--color-border-default)] bg-white/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <a href="/" className="font-heading text-xl font-bold text-[var(--color-creator-purple)]">
                        Stan Store
                    </a>
                </div>
            </header>

            {/* Main Content */}
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="border-t border-[var(--color-border-default)] bg-[var(--color-surface-secondary)]">
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    <p className="text-center text-sm text-[var(--color-text-tertiary)]">
                        &copy; {new Date().getFullYear()} Stan Store. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
