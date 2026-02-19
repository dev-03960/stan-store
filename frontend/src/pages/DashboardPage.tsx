import React from 'react';
import ProductList from '../components/dashboard/ProductList';

const DashboardPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50">
            <div className="container mx-auto py-8">
                <ProductList />
            </div>
        </div>
    );
};

export default DashboardPage;
