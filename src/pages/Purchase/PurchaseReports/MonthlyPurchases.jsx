import React, { useState } from 'react';
import { format } from 'date-fns';
import UniversalPurchaseManager from '../UniversalPurchaseManager';

const MonthlyPurchases = () => {
    const [selected, setSelected] = useState(format(new Date(), 'yyyy-MM'));
    const [year, month] = selected.split('-');
    const fetchUrl = `${import.meta.env.VITE_API_BASE_URL}/api/purchases/reports/monthly?month=${parseInt(month)}&year=${year}`;
    console.log(fetchUrl);

    return (
        <div className="space-y-4">
            <div className="container mx-auto px-6">
                <input type="month" value={selected} onChange={(e) => setSelected(e.target.value)} className="p-3 rounded-xl border font-bold outline-none" />
            </div>
            <UniversalPurchaseManager context="report" title={`Monthly Log: ${selected}`} fetchUrl={fetchUrl} />
        </div>
    );
};



export default MonthlyPurchases;