import { format } from "date-fns";
import UniversalSalesManager from "../UniversalSalesManager";
import { useState } from "react";

const CustomRangeSales = () => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const [range, setRange] = useState({
        from: format(new Date(), 'yyyy-MM-01'), // Start of current month
        to: format(new Date(), 'yyyy-MM-dd')    // Today
    });

    const fetchUrl = `${API_BASE_URL}/api/sales/reports/range?from=${range.from}&to=${range.to}`;

    return (
        <div className="space-y-4">
            <div className="container mx-auto px-6 mt-6">
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <h2 className="text-xl font-black text-gray-800">Custom Date Audit</h2>
                    <div className="flex items-center gap-2">
                        <input 
                            type="date" 
                            value={range.from}
                            onChange={(e) => setRange({...range, from: e.target.value})}
                            className="bg-gray-50 border border-gray-200 p-2 rounded-xl font-bold text-sm"
                        />
                        <span className="text-gray-400 font-bold">to</span>
                        <input 
                            type="date" 
                            value={range.to}
                            onChange={(e) => setRange({...range, to: e.target.value})}
                            className="bg-gray-50 border border-gray-200 p-2 rounded-xl font-bold text-sm"
                        />
                    </div>
                </div>
            </div>
            <UniversalSalesManager context="report" title="Filtered Sales Range" fetchUrl={fetchUrl} />
        </div>
    );
};


export default CustomRangeSales;