import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router';

const BASE_API_URL = import.meta.env.VITE_API_BASE_URL;

// Utilities
const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatCurrency = (amount) => `৳ ${Number(amount).toFixed(2)}`;

const SalesList = () => {
  const navigate = useNavigate();
  const [memos, setMemos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedMemoId, setExpandedMemoId] = useState(null);

  useEffect(() => {
    const fetchMemos = async () => {
      try {
        const response = await axios.get(`${BASE_API_URL}/api/sales/`);
        if (response.data.success && Array.isArray(response.data.data)) {
          setMemos(response.data.data);
          setError(null);
        } else {
          setError("API returned success: false or invalid data structure.");
          setMemos([]);
        }
      } catch (err) {
        console.error("Error fetching sales data:", err);
        setError("Failed to fetch data from the server. Please check the API endpoint.");
        setMemos([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMemos();
  }, []);

  const toggleExpand = (id) => setExpandedMemoId(expandedMemoId === id ? null : id);

  if (loading) return <p className="p-8 text-center text-blue-600 font-semibold">Loading Sales Memos...</p>;
  if (error) return <div className="p-8 bg-red-100 text-red-700 rounded">{error}</div>;
  if (memos.length === 0) return <div className="p-8 text-center text-gray-500">No sales memos found.</div>;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 border-b pb-2">Sales Memo History</h2>

      <div className="flex gap-2 mb-4">
        <button onClick={() => navigate("create-sale")} className="bg-green-500 text-white px-3 py-1 rounded">Create Sale</button>
        <button onClick={() => navigate("/sales/daily-sales")} className="bg-green-500 text-white px-3 py-1 rounded">Daily Sales</button>
        <button onClick={() => navigate("/sales/daily-cash-sales")} className="bg-green-500 text-white px-3 py-1 rounded">Daily Cash Sales</button>
        <button onClick={() => navigate("/sales/daily-due-sales")} className="bg-green-500 text-white px-3 py-1 rounded">Daily Due Sales</button>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-600 text-white sticky top-0">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Memo No</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Paid</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Due/Credit</th>
              <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {memos.map((memo) => (
              <React.Fragment key={memo._id}>
                <tr
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => toggleExpand(memo._id)}
                >
                  <td className="px-6 py-4 text-sm font-semibold text-blue-700">{memo.memoNo}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{memo.customerName}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDate(memo.date)}</td>
                  <td className="px-6 py-4 text-sm text-right font-medium text-gray-800">{formatCurrency(memo.total)}</td>
                  <td className="px-6 py-4 text-sm text-right text-gray-600">{formatCurrency(memo.paidAmount)}</td>
                  <td className={`px-6 py-4 text-sm text-right font-bold ${memo.due > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {memo.due > 0 ? 'Due: ' : 'Credit: '}
                    {formatCurrency(Math.abs(memo.due))}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      className="text-blue-500 hover:text-blue-700 p-1 rounded-full bg-blue-50"
                      title="Toggle Product Details"
                    >
                      {expandedMemoId === memo._id ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </button>
                    <div className="mt-1">
                      <button
                        onClick={() => navigate(`/sales/${memo._id}`)}
                        className="bg-green-500 text-white px-2 py-1 rounded"
                      >
                        View Details
                      </button>
                    </div>
                  </td>
                </tr>

                {expandedMemoId === memo._id && (
                  <tr className="bg-gray-50">
                    <td colSpan="7" className="p-4">
                      <h4 className="text-xs font-bold uppercase mb-2 text-gray-600">Products Sold:</h4>
                      <ul className="space-y-1 text-sm">
                        {memo.products.map((product, idx) => (
                          <li key={idx} className="flex justify-between p-2 border-b border-gray-200">
                            <span className="font-semibold text-gray-800">{product.item_name}</span>
                            <span className="text-gray-600">
                              {product.qty} x {formatCurrency(product.price)} = {formatCurrency(product.subtotal)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalesList;
