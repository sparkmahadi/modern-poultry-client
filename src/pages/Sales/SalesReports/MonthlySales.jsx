import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import UniversalSalesManager from '../UniversalSalesManager';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const MonthlySales = () => {
    // Default to current month/year (e.g., "2025-12")
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

    const [year, month] = selectedMonth.split('-');
    const fetchUrl = `${API_BASE_URL}/api/sales/reports/monthly?month=${parseInt(month)}&year=${year}`;

    return (
        <div className="space-y-4">
            <div className="container mx-auto px-6 mt-6">
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-black text-gray-800">Monthly Revenue Report</h2>
                    <div className="flex items-center gap-3">
                        <label className="text-xs font-bold text-gray-400 uppercase">Select Month</label>
                        <input 
                            type="month" 
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-gray-50 border border-gray-200 p-2 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>
            </div>
            <UniversalSalesManager context="report" title={`Monthly Sales: ${format(parseISO(selectedMonth + "-01"), 'MMMM yyyy')}`} fetchUrl={fetchUrl} />
        </div>
    );
};

export default MonthlySales;