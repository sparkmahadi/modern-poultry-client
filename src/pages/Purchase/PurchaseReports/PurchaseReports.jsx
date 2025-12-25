import React, { useState } from 'react';
import DailyPurchases from './DailyPurchases';
import MonthlyPurchases from './MonthlyPurchases';
import YearlyPurchases from './YearlyPurchases';
import CustomRangePurchases from './CustomRangePurchases';

const PurchaseReports = () => {
    const [activeTab, setActiveTab] = useState('daily');

    const tabs = [
        { id: 'daily', label: 'Daily', icon: '📅' },
        { id: 'monthly', label: 'Monthly', icon: '📊' },
        { id: 'yearly', label: 'Yearly', icon: '🗓️' },
        { id: 'range', label: 'Custom Range', icon: '🔍' }
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
                <div className="container mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    <h2 className="text-xl font-black text-gray-800">Purchase Audits</h2>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                                    activeTab === tab.id 
                                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-200' 
                                    : 'text-gray-500 hover:bg-gray-100'
                                }`}
                            >
                                <span>{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-4">
                {activeTab === 'daily' && <DailyPurchases />}
                {activeTab === 'monthly' && <MonthlyPurchases />}
                {activeTab === 'yearly' && <YearlyPurchases />}
                {activeTab === 'range' && <CustomRangePurchases />}
            </div>
        </div>
    );
};

export default PurchaseReports;