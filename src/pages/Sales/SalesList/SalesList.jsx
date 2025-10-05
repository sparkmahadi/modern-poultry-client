import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router';

// Define the API endpoint
const BASE_API_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Utility function to format the date
 */
const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Utility function to format currency
 */
const formatCurrency = (amount) => {
  return `৳ ${Number(amount).toFixed(2)}`;
};

/**
 * MemoList component to fetch and display sales memo data.
 */
const SalesList = () => {
    const navigate = useNavigate();
  const [memos, setMemos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedMemoId, setExpandedMemoId] = useState(null);

  // --- Data Fetching Effect ---
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

  const toggleExpand = (id) => {
    setExpandedMemoId(expandedMemoId === id ? null : id);
  };

  // --- Rendering States ---

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto text-center">
        <div className="text-xl text-blue-600 font-semibold flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading Sales Memos...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-6xl mx-auto bg-red-100 border border-red-400 text-red-700 rounded-xl shadow-lg">
        <p className="font-bold">Error:</p>
        <p>{error}</p>
      </div>
    );
  }

  if (memos.length === 0) {
    return (
      <div className="p-8 max-w-6xl mx-auto text-center text-gray-500 bg-white rounded-xl shadow-lg">
        No sales memos found.
      </div>
    );
  }

  // --- Main Render ---

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h2 className="text-3xl font-extrabold text-gray-800 mb-6 border-b pb-2">Sales Memo History</h2>
      
      <div><button onClick={()=>navigate("create-sale")}
      className='p-1 bg-green-500 rounded-xl text-white cursor-pointer'>Create Sale</button></div>

      <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            {/* Table Header */}
            <thead className="bg-blue-600 text-white sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-16">
                  Memo No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                  Paid
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                  Due/Credit
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider w-16">
                  Details
                </th>
              </tr>
            </thead>
            
            {/* Table Body */}
            <tbody className="bg-white divide-y divide-gray-100">
              {memos.map((memo) => (
                <React.Fragment key={memo._id}>
                  {/* Main Memo Row */}
                  <tr className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => toggleExpand(memo._id)}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-700">
                      {memo.memoNo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {memo.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(memo.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-800">
                      {formatCurrency(memo.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                      {formatCurrency(memo.paidAmount)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${
                        memo.due > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {/* Show 'Due' if positive, 'Credit' if negative/zero */}
                      {memo.due > 0 ? 'Due: ' : 'Credit: '}
                      {formatCurrency(Math.abs(memo.due))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <button 
                        className="text-blue-500 hover:text-blue-700 p-1 rounded-full bg-blue-50"
                        title="Toggle Product Details"
                      >
                        {expandedMemoId === memo._id ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path></svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        )}
                      </button>
                    </td>
                  </tr>

                  {/* Product Details Row (Expanded View) */}
                  {expandedMemoId === memo._id && (
                    <tr className="bg-gray-100">
                      <td colSpan="7" className="p-4">
                        <h4 className="text-xs font-bold uppercase mb-2 text-gray-600">Products Sold:</h4>
                        <ul className="space-y-1 text-sm">
                          {memo.products.map((product, index) => (
                            <li key={index} className="flex justify-between p-2 border-b border-gray-200">
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
    </div>
  );
};

export default SalesList;