import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import DailySales from './DailySales';
import MonthlySales from './MonthlySales';
import YearlySales from './YearlySales';
import CustomRangeSales from './CustomRangeSales';

const SalesReports = () => {
    const [activeTab, setActiveTab] = useState('daily');
    
    // We'll use a ref or a shared state if we wanted to access the child data, 
    // but a cleaner way is to let UniversalSalesManager handle its own export.
    // However, for this Hub, let's define the Tab UI:

    const tabs = [
        { id: 'daily', label: 'Daily', icon: '📅' },
        { id: 'monthly', label: 'Monthly', icon: '📊' },
        { id: 'yearly', label: 'Yearly', icon: '🗓️' },
        { id: 'range', label: 'Custom Range', icon: '🔍' }
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Tab Navigation Bar */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between py-4 gap-4">
                        <div className="flex items-center gap-2">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all ${
                                        activeTab === tab.id 
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                                        : 'text-gray-500 hover:bg-gray-100'
                                    }`}
                                >
                                    <span>{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Note: The Download logic is best placed inside UniversalSalesManager 
                            to access the 'memos' state directly. See the update below. */}
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            <div className="mt-4">
                {activeTab === 'daily' && <DailySales />}
                {activeTab === 'monthly' && <MonthlySales />}
                {activeTab === 'yearly' && <YearlySales />}
                {activeTab === 'range' && <CustomRangeSales />}
            </div>
        </div>
    );
};

export default SalesReports;