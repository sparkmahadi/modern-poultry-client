import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Loader,
  XCircle,
  Search,
  CalendarDays,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const CASH_SALES_API_URL = `${API_BASE_URL}/api/transactions`;

const DailyDueSales = () => {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🟢 Fetch Cash Sales by Date
  const fetchCashSales = async (date) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${CASH_SALES_API_URL}?date=${date}`);
      setSales(response.data.data || []);
      setFilteredSales(response.data.data || []);
    } catch (err) {
      console.error("Failed to fetch daily sales:", err);
      setError(`Failed to load data: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 🟢 Initial & Date Change Fetch
  useEffect(() => {
    fetchCashSales(selectedDate);
  }, [selectedDate]);

  // 🔍 Search Filter
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredSales(sales);
      return;
    }
    const term = searchTerm.toLowerCase();
    setFilteredSales(
      sales.filter(
        (s) =>
          s.customer_name?.toLowerCase().includes(term) ||
          s.product_name?.toLowerCase().includes(term)
      )
    );
  }, [searchTerm, sales]);

  // 💰 Utility Formatters
  const formatAmount = (num) =>
    num?.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) || "0.00";

  const formatTime = (time) => {
    try {
      const [h, m, s] = time.split(":");
      const date = new Date();
      date.setHours(parseInt(h));
      date.setMinutes(parseInt(m));
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return time;
    }
  };

  const totalAmount = filteredSales.reduce(
    (sum, s) => sum + (parseFloat(s.amount) || 0),
    0
  );

  // 🟡 Loading State
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto mt-10 p-6 flex flex-col items-center bg-white rounded-xl shadow-lg">
        <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="mt-2 text-indigo-700 font-medium">Loading daily cash sales...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-2xl font-sans">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-6 border-b pb-2">
        Daily Due Sales Report
      </h2>

      {/* 🔴 Error Alert */}
      {error && (
        <div className="flex items-start p-3 mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-md">
          <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600 mr-3" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* 🔍 Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <CalendarDays className="text-gray-600 w-5 h-5" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-gray-300 rounded-md p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="relative w-full sm:w-1/3">
          <Search className="absolute left-2 top-2.5 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by customer or product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* 🧾 Sales Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-100">
            {filteredSales.length > 0 ? (
              filteredSales.map((sale, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-700">
                    {formatTime(sale.time || "00:00:00")}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{sale.customer_name || "N/A"}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{sale.product_name || "N/A"}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-700">
                    {sale.quantity || 1}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-green-600">
                    {formatAmount(sale.amount)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className="px-4 py-8 text-center text-gray-500 text-base"
                >
                  No cash sales found for {selectedDate}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 🧮 Summary */}
      <div className="mt-6 flex justify-end border-t pt-4">
        <div className="text-right">
          <p className="text-sm text-gray-600">Total Cash Sales:</p>
          <p className="text-2xl font-bold text-green-700">৳ {formatAmount(totalAmount)}</p>
        </div>
      </div>
    </div>
  );
};

export default DailyDueSales;
