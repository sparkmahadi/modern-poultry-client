import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader, Search, Filter, XCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const TRANSACTIONS_API_URL = `${API_BASE_URL}/api/transactions`;

const DailySales = () => {
  const [transactions, setTransactions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [transactionType, setTransactionType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // === Fetch Data ===
  const fetchTransactions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.get(TRANSACTIONS_API_URL);
      const data = res.data.data || [];
      setTransactions(data);
      setFiltered(data);
    } catch (err) {
      console.error(err);
      setError(`Failed to load: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // === Utility Helpers ===
  const formatDate = (dateObj) => {
    if (!dateObj) return 'N/A';
    const date = dateObj.$date ? new Date(dateObj.$date) : new Date(dateObj);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const extractAmount = (data) => {
    if (!data) return 0;
    if (typeof data === 'object') {
      if (data.$numberDouble) return parseFloat(data.$numberDouble);
      if (data.amount !== undefined) return parseFloat(data.amount);
    }
    return parseFloat(data);
  };

  // === Filtering Logic ===
  useEffect(() => {
    let data = [...transactions];

    // Search
    if (searchTerm) {
      data = data.filter(
        (tx) =>
          tx.particulars?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.remarks?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type Filter
    if (transactionType !== 'all') {
      data = data.filter((tx) => tx.transaction_type === transactionType);
    }

    // Date Range Filter
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      data = data.filter((tx) => {
        const txDate = new Date(tx.date?.$date || tx.date);
        return txDate >= start && txDate <= end;
      });
    }

    setFiltered(data);
  }, [searchTerm, transactionType, startDate, endDate, transactions]);

  // === Group Transactions by Date ===
  const groupByDate = (data) => {
    return data.reduce((acc, tx) => {
      const dateKey = formatDate(tx.date);
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(tx);
      return acc;
    }, {});
  };

  const groupedTransactions = groupByDate(filtered);

  // === Render ===
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto mt-10 p-6 flex flex-col items-center bg-white rounded-xl shadow-lg">
        <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="mt-2 text-indigo-700 font-medium">Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-xl font-sans">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-6 border-b pb-2">
        Daily Sales Overview
      </h2>

      {/* === Error === */}
      {error && (
        <div className="flex items-start p-3 mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-md">
          <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600 mr-3" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* === Filters === */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="flex items-center border rounded-lg bg-gray-50 px-3">
          <Search className="w-4 h-4 text-gray-500 mr-2" />
          <input
            type="text"
            placeholder="Search particulars or remarks..."
            className="w-full p-2 bg-transparent outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={transactionType}
          onChange={(e) => setTransactionType(e.target.value)}
          className="border rounded-lg p-2 text-sm bg-gray-50"
        >
          <option value="all">All Types</option>
          <option value="credit">Credit Only</option>
          <option value="debit">Debit Only</option>
        </select>

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border rounded-lg p-2 text-sm bg-gray-50"
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border rounded-lg p-2 text-sm bg-gray-50"
        />
      </div>

      {/* === Grouped Transactions === */}
      {Object.keys(groupedTransactions).length > 0 ? (
        Object.entries(groupedTransactions).map(([date, txs]) => (
          <div key={date} className="mb-8">
            <h3 className="text-lg font-bold text-indigo-700 mb-2">{date}</h3>
            <div className="overflow-x-auto border rounded-lg shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Particulars
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance After
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Remarks
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {txs.map((tx) => (
                    <tr key={tx._id?.$oid || tx._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-800 font-medium">{tx.particulars}</td>
                      <td className="px-4 py-3 text-center text-sm">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            tx.transaction_type === 'credit'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {tx.transaction_type.toUpperCase()}
                        </span>
                      </td>
                      <td
                        className={`px-4 py-3 text-right text-sm font-bold ${
                          tx.transaction_type === 'credit'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {tx.transaction_type === 'credit' ? '+' : '-'}{' '}
                        {extractAmount(tx.amount).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-700 font-semibold">
                        {extractAmount(tx.balance_after_transaction).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{tx.remarks || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center text-gray-500 mt-10">
          No transactions found for the selected filters.
        </div>
      )}
    </div>
  );
};

export default DailySales;
