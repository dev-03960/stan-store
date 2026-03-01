import React from 'react';
import ProductList from '../components/dashboard/ProductList';

const DashboardPage: React.FC = () => {
    return (
        <div className="space-y-6">

            <ProductList />
        </div>
    );
};

export default DashboardPage;
