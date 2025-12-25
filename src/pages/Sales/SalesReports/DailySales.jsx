import React, { useState } from 'react';
import { format, addDays, subDays, parseISO } from 'date-fns';
import UniversalSalesManager from '../UniversalSalesManager';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const DailySales = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const [selectedDate, setSelectedDate] = useState(today);

    // --- Navigation Handlers ---
    const handlePrevDay = () => {
        const prev = subDays(parseISO(selectedDate), 1);
        setSelectedDate(format(prev, 'yyyy-MM-dd'));
    };

    const handleNextDay = () => {
        const next = addDays(parseISO(selectedDate), 1);
        setSelectedDate(format(next, 'yyyy-MM-dd'));
    };

    const handleToday = () => setSelectedDate(today);

    // Dynamic API URL
    const fetchUrl = `${API_BASE_URL}/api/sales/reports/daily?date=${selectedDate}`;

    return (
        <div className="space-y-4">
            {/* Navigation Header */}
            <div className="container mx-auto px-6 mt-6">
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col lg:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-indigo-50 p-3 rounded-2xl">
                            <span className="text-2xl">📅</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-800">Daily Sales Report</h2>
                            <p className="text-sm font-bold text-indigo-500">
                                {format(parseISO(selectedDate), 'EEEE, MMMM do, yyyy')}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-200">
                        <button 
                            onClick={handlePrevDay}
                            className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-gray-600 font-bold px-4"
                            title="Previous Day"
                        >
                            ←
                        </button>
                        
                        <input 
                            type="date" 
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-white border-x border-gray-200 text-gray-800 font-black py-2 px-4 outline-none focus:text-indigo-600 transition-colors"
                        />

                        <button 
                            onClick={handleNextDay}
                            className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-gray-600 font-bold px-4"
                            title="Next Day"
                        >
                            →
                        </button>

                        <div className="h-6 w-[1px] bg-gray-200 mx-2"></div>

                        <button 
                            onClick={handleToday}
                            className="px-4 py-2 text-xs font-black uppercase tracking-wider text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                        >
                            Today
                        </button>
                    </div>
                </div>
            </div>

            {/* Universal Dashboard Core */}
            <UniversalSalesManager
                context="report"
                title={`Sales Ledger for ${selectedDate}`}
                fetchUrl={fetchUrl}
            />
        </div>
    );
};

export default DailySales;