import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../dashboard/Sidebar';

export const DashboardLayout = () => {
    const location = useLocation();

    // Derive page title from path
    const pathSegment = location.pathname.split('/').pop() || 'dashboard';
    const pageTitle = pathSegment === 'dashboard' ? 'Products' : pathSegment.charAt(0).toUpperCase() + pathSegment.slice(1);

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            {/* Main content area */}
            <div className="flex-1 min-w-0">
                {/* Mobile top bar — visible only on small screens */}
                <header className="md:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 pl-16">
                    <h1 className="text-lg font-bold text-gray-900 truncate">{pageTitle}</h1>
                </header>
                {/* Page content with responsive padding */}
                <div className="p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};
