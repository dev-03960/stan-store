
import { Outlet } from 'react-router-dom';
import Sidebar from '../dashboard/Sidebar';

export const DashboardLayout = () => {
    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1">
                <div className="p-4 pt-16 md:p-8 md:pt-8">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};
