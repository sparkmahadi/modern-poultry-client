import React, { useState } from 'react';
import UniversalPurchaseManager from '../UniversalPurchaseManager';
import { format } from 'date-fns';

const CustomRangePurchases = () => {
    const [range, setRange] = useState({
        from: format(new Date(), 'yyyy-MM-01'), // Start of current month
        to: format(new Date(), 'yyyy-MM-dd')    // Today
    });
    const fetchUrl = `${import.meta.env.VITE_API_BASE_URL}/api/purchases/reports/range?from=${range.from}&to=${range.to}`;

    return (
        <div className="space-y-4">
            <div className="container mx-auto px-6 flex gap-2 items-center">
                <input type="date" onChange={(e) => setRange({ ...range, from: e.target.value })} className="p-3 rounded-xl border font-bold text-sm" />
                <span className="font-bold text-gray-400">to</span>
                <input type="date" onChange={(e) => setRange({ ...range, to: e.target.value })} className="p-3 rounded-xl border font-bold text-sm" />
            </div>
            <UniversalPurchaseManager context="report" title="Custom Audit Range" fetchUrl={fetchUrl} />
        </div>
    );
};


export default CustomRangePurchases;