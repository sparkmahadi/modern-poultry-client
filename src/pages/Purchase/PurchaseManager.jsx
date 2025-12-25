import React from 'react';
import UniversalPurchaseManager from './UniversalPurchaseManager';

const PurchaseManager = () => {
    return (
        <div>
            <UniversalPurchaseManager
                context="main"
                title="General Purchase Ledger"
                fetchUrl={`${import.meta.env.VITE_API_BASE_URL}/api/purchases`}
            />
        </div>
    );
};

export default PurchaseManager;