
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Wallet, Settings, Menu, X, Megaphone, Plug, Users, TrendingUp, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MioLogo } from '../brand/MioLogo';

const navItems = [
    { name: 'Analytics', path: '/dashboard/analytics', icon: TrendingUp },
    { name: 'Products', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Orders', path: '/dashboard/orders', icon: ShoppingBag },
    { name: 'Earnings', path: '/dashboard/earnings', icon: Wallet },
    { name: 'Campaigns', path: '/dashboard/campaigns', icon: Megaphone },
    { name: 'Integrations', path: '/dashboard/integrations', icon: Plug },
    { name: 'Affiliates', path: '/dashboard/affiliates', icon: Users },
    { name: 'Settings', path: '/dashboard/settings', icon: Settings },
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
    const { user, logout } = useAuth();

    const LogoutButton = () => (
        <div className="p-4 border-t border-gray-100">
            {user && (
                <div className="flex items-center gap-3 px-4 py-2 mb-2">
                    {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm">
                            {user.displayName?.charAt(0) || '?'}
                        </div>
                    )}
                    <div className="truncate">
                        <p className="text-sm font-medium text-gray-900 truncate">{user.displayName}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                </div>
            )}
            <button
                onClick={logout}
                className="flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-colors text-gray-600 hover:bg-red-50 hover:text-red-600 w-full"
            >
                <LogOut size={20} />
                <span>Logout</span>
            </button>
        </div>
    );

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
                        className="w-64 bg-white min-h-screen shadow-xl flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center p-4 border-b border-gray-100">
                            <a href="/" className="hover:opacity-80 transition-opacity">
                                <MioLogo size="sm" />
                            </a>
                            <button
                                onClick={() => setMobileOpen(false)}
                                className="p-1 hover:bg-gray-100 rounded-full"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="flex-1">
                            <NavLinks onNavigate={() => setMobileOpen(false)} />
                        </div>
                        <LogoutButton />
                    </aside>
                </div>
            )}

            {/* Desktop sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 min-h-screen hidden md:flex md:flex-col">
                <div className="p-4 border-b border-gray-100">
                    <a href="/" className="hover:opacity-80 transition-opacity">
                        <MioLogo size="sm" />
                    </a>
                </div>
                <div className="flex-1">
                    <NavLinks />
                </div>
                <LogoutButton />
            </aside>
        </>
    );
};

export default Sidebar;
