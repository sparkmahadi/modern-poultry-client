import { useState } from "react";
import UniversalSalesManager from "../UniversalSalesManager";

const YearlySales = () => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const [year, setYear] = useState(new Date().getFullYear());

    const fetchUrl = `${API_BASE_URL}/api/sales/reports/yearly?year=${year}`;

    return (
        <div className="space-y-4">
            <div className="container mx-auto px-6 mt-6">
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-black text-gray-800">Annual Statement</h2>
                    <input 
                        type="number" 
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="bg-gray-50 border border-gray-200 p-2 rounded-xl font-bold w-32 text-center"
                    />
                </div>
            </div>
            <UniversalSalesManager context="report" title={`Yearly Sales Summary: ${year}`} fetchUrl={fetchUrl} />
        </div>
    );
};


export default YearlySales;