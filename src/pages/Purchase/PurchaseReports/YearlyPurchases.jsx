import React, { useState } from 'react';
import UniversalPurchaseManager from '../UniversalPurchaseManager';

const YearlyPurchases = () => {
    const [year, setYear] = useState(new Date().getFullYear());
    const fetchUrl = `${import.meta.env.VITE_API_BASE_URL}/api/purchases/reports/yearly?year=${year}`;

    return (
        <div className="space-y-4">
            <div className="container mx-auto px-6">
                <input type="number" value={year} onChange={(e) => setYear(e.target.value)} className="p-3 rounded-xl border font-bold w-32" />
            </div>
            <UniversalPurchaseManager context="report" title={`Annual Report: ${year}`} fetchUrl={fetchUrl} />
        </div>
    );
};


export default YearlyPurchases;