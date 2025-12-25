import React, { useState } from 'react';
import { format, addDays, subDays, parseISO } from 'date-fns';
import UniversalPurchaseManager from '../UniversalPurchaseManager';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const DailyPurchases = () => {
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

    // Dynamic API URL matching your controller: /api/purchases/reports/daily?date=YYYY-MM-DD
    const fetchUrl = `${API_BASE_URL}/api/purchases/reports/daily?date=${selectedDate}`;

    return (
        <div className="space-y-4">
            {/* Navigation Header */}
            <div className="container mx-auto px-6 mt-6">
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col lg:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-orange-50 p-3 rounded-2xl">
                            <span className="text-2xl">📦</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-800">Daily Purchase Log</h2>
                            <p className="text-sm font-bold text-orange-500">
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
                            className="bg-white border-x border-gray-200 text-gray-800 font-black py-2 px-4 outline-none focus:text-orange-600 transition-colors"
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
                            className="px-4 py-2 text-xs font-black uppercase tracking-wider text-orange-600 hover:bg-orange-50 rounded-xl transition-all"
                        >
                            Today
                        </button>
                    </div>
                </div>
            </div>

            {/* Universal Purchase Manager Core */}
            <UniversalPurchaseManager
                context="report"
                title={`Purchase Audit: ${selectedDate}`}
                fetchUrl={fetchUrl}
            />
        </div>
    );
};

export default DailyPurchases;  