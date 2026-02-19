
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Wallet, Menu, X } from 'lucide-react';

const navItems = [
    { name: 'Products', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Orders', path: '/dashboard/orders', icon: ShoppingBag },
    { name: 'Earnings', path: '/dashboard/earnings', icon: Wallet },
];

const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="p-4 space-y-2">
        {navItems.map((item) => (
            <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/dashboard'}
                onClick={onNavigate}
                className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-colors ${isActive
                        ? 'bg-purple-50 text-purple-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                }
            >
                <item.icon size={20} />
                <span>{item.name}</span>
            </NavLink>
        ))}
    </nav>
);

const Sidebar = () => {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            {/* Mobile hamburger button */}
            <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden fixed top-4 left-4 z-40 p-2 bg-white rounded-lg shadow-md border border-gray-200"
                aria-label="Open menu"
            >
                <Menu className="w-5 h-5 text-gray-700" />
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                    onClick={() => setMobileOpen(false)}
                >
                    <aside
                        className="w-64 bg-white min-h-screen shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center p-4 border-b border-gray-100">
                            <span className="font-bold text-gray-900">Menu</span>
                            <button
                                onClick={() => setMobileOpen(false)}
                                className="p-1 hover:bg-gray-100 rounded-full"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <NavLinks onNavigate={() => setMobileOpen(false)} />
                    </aside>
                </div>
            )}

            {/* Desktop sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 min-h-screen hidden md:block">
                <NavLinks />
            </aside>
        </>
    );
};

export default Sidebar;
