const BASE_API_URL = import.meta.env.VITE_API_BASE_URL;
import React from 'react';
import UniversalSalesManager from '../UniversalSalesManager';

const SalesManager = () => {
    return (
        <div>
            <UniversalSalesManager
                context="main"
                title="General Sales Ledger"
                fetchUrl={`${BASE_API_URL}/api/sales`}
            />
        </div>
    );
};

export default SalesManager;