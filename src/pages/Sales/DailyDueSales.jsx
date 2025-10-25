import React, { useState, useEffect } from "react";
import axios from "axios";
import { Search, Loader, XCircle } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function DailydueSales() {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Format helpers
  const formatAmount = (amt) => Number(amt || 0).toLocaleString("en-BD");
  const formatTime = (dateStr) =>
    new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // Fetch data
  useEffect(() => {
    async function fetchSales() {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/api/sales/due-sales`);
        const sorted = res.data.data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setSales(sorted);
        setFilteredSales(sorted);
      } catch (err) {
        console.error(err);
        setError("Failed to load due sales data.");
      } finally {
        setLoading(false);
      }
    }
    fetchSales();
  }, []);

  // Filter logic
  useEffect(() => {
    let data = [...sales];

    if (searchTerm.trim()) {
      data = data.filter(
        (item) =>
          item.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.products?.some((p) =>
            p.item_name?.toLowerCase().includes(searchTerm.toLowerCase())
          ) ||
          item.memoNo?.toString().includes(searchTerm)
      );
    }

    if (fromDate) {
      data = data.filter((item) => new Date(item.date) >= new Date(fromDate));
    }

    if (toDate) {
      data = data.filter((item) => new Date(item.date) <= new Date(toDate));
    }

    setFilteredSales(data);
  }, [sales, searchTerm, fromDate, toDate]);

  // Group by date
  const groupedSales = filteredSales.reduce((acc, sale) => {
    const dateKey = new Date(sale.date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(sale);
    return acc;
  }, {});

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">
        💰 Daily due Sales
      </h2>

      {/* Filters */}
      <div className="bg-white shadow-sm p-4 rounded-xl flex flex-wrap gap-3 items-center mb-6">
        {/* Search */}
        <div className="flex items-center border rounded-md px-3 py-2 w-full sm:w-auto flex-grow">
          <Search size={18} className="text-gray-500 mr-2" />
          <input
            type="text"
            placeholder="Search memo no, customer, or product..."
            className="outline-none w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border rounded-md px-3 py-2 text-gray-700"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border rounded-md px-3 py-2 text-gray-700"
          />
        </div>
      </div>

      {/* Loading & Error */}
      {loading && (
        <div className="flex justify-center items-center text-gray-600">
          <Loader className="animate-spin mr-2" /> Loading sales...
        </div>
      )}
      {error && (
        <div className="flex justify-center items-center text-red-600">
          <XCircle className="mr-2" /> {error}
        </div>
      )}

      {/* Datewise Tables */}
      {!loading &&
        !error &&
        Object.keys(groupedSales).map((date) => {
          const dailySales = groupedSales[date];
          const dailyTotal = dailySales.reduce((sum, s) => sum + (s.total || 0), 0);

          return (
            <div key={date} className="mb-10">
              <h3 className="font-semibold text-lg text-gray-700 mb-3 border-b pb-1">
                {date}
              </h3>

              <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Memo No
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product Details
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Paid
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Due
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                    </tr>
                  </thead>

                  <tbody className="bg-white divide-y divide-gray-100">
                    {dailySales.length > 0 ? (
                      dailySales.map((sale, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-semibold text-gray-800">
                            #{sale.memoNo}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {sale.customerName || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {sale.products?.map((p, i) => (
                              <div key={i} className="border-b last:border-b-0 py-1">
                                <p className="font-medium">{p.item_name}</p>
                                <p className="text-xs text-gray-500">
                                  Qty: {p.qty} × ৳{formatAmount(p.price)} = ৳
                                  {formatAmount(p.subtotal)}
                                </p>
                              </div>
                            ))}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-green-600">
                            ৳ {formatAmount(sale.total)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-blue-600">
                            ৳ {formatAmount(sale.paidAmount)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-red-600">
                            ৳ {formatAmount(sale.due)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-500">
                            {formatTime(sale.date)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="7"
                          className="px-4 py-8 text-center text-gray-500 text-base"
                        >
                          No due sales found for this date.
                        </td>
                      </tr>
                    )}
                    {/* Daily Total Row */}
                    <tr className="bg-gray-100 font-semibold">
                      <td
                        colSpan="3"
                        className="px-4 py-3 text-right text-sm text-gray-800"
                      >
                        Daily Total:
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-green-700">
                        ৳ {formatAmount(dailyTotal)}
                      </td>
                      <td colSpan="3"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
    </div>
  );
}
