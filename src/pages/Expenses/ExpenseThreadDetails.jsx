import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ExpenseThreadDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Read initial states passed from ExpenseThreads navigation state if present
  const passedState = location.state || {};

  const [thread, setThread] = useState(null);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Filtering States ---
  const [filterMode, setFilterMode] = useState(passedState.filterMode || 'month'); // 'day', 'month', 'year', 'range'
  const [selectedDate, setSelectedDate] = useState(
    passedState.selectedDate || new Date().toISOString().split('T')[0]
  );
  const [selectedMonth, setSelectedMonth] = useState(
    passedState.selectedMonth || new Date().toISOString().slice(0, 7) // 'YYYY-MM'
  );
  const [selectedYear, setSelectedYear] = useState(
    passedState.selectedYear || new Date().getFullYear()
  );
  const [dateRange, setDateRange] = useState(
    passedState.dateRange || {
      from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      to: new Date().toISOString().split('T')[0]
    }
  );

  // 1. Fetch Expense Thread Info
  const fetchThreadInfo = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/expense-threads/${id}`);
      setThread(res.data.data || res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load expense category details');
    }
  };

  // 2. Fetch Bills with Date/Period Filtering
  const fetchThreadBills = async () => {
    try {
      setLoading(true);
      let params = {
        expenseThreadId: id
      };

      if (filterMode === 'day') {
        params.date = selectedDate;
      } else if (filterMode === 'month') {
        params.month = selectedMonth;
      } else if (filterMode === 'year') {
        params.year = selectedYear;
      } else if (filterMode === 'range') {
        params.from = dateRange.from;
        params.to = dateRange.to;
      }

      const res = await axios.get(`${API_BASE_URL}/api/bills`, { params });
      setBills(res.data.data || res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load expense records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreadInfo();
  }, [id]);

  useEffect(() => {
    fetchThreadBills();
  }, [id, filterMode, selectedDate, selectedMonth, selectedYear, dateRange]);

  // Derived Analytics for Selected Period
  const totalSpent = useMemo(() => {
    return bills.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [bills]);

  const budget = Number(thread?.monthly_budget || thread?.total_cost || 0);
  const budgetUtilization = budget > 0 ? Math.min(100, Math.round((totalSpent / budget) * 100)) : 0;
  const isOverBudget = budget > 0 && totalSpent > budget;
  const averageVoucher = bills.length > 0 ? (totalSpent / bills.length).toFixed(2) : 0;

  // Month Quick Presets
  const applyPresetMonth = (offsetMonths = 0) => {
    const target = new Date();
    target.setMonth(target.getMonth() + offsetMonths);
    setSelectedMonth(target.toISOString().slice(0, 7));
    setFilterMode('month');
  };

  return (
    <div className="p-8 max-w-6xl mx-auto bg-slate-50 min-h-screen">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <button
            onClick={() => navigate('/expense-threads')}
            className="text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-800 transition mb-2 block"
          >
            ← Back to Expense Threads
          </button>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            {thread?.name || 'Category'} <span className="text-slate-400 font-light text-xl">Financial Audit</span>
          </h1>
          {thread?.description && <p className="text-sm text-slate-500 mt-1">{thread.description}</p>}
        </div>

        <button
          onClick={() =>
            navigate('/bills', {
              state: { expenseThreadId: id, expenseThreadName: thread?.name }
            })
          }
          className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-black transition shadow-sm"
        >
          + Record Voucher in Thread
        </button>
      </div>

      {/* Analytical Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Total Spent ({filterMode})
          </span>
          <p className="text-2xl font-bold text-red-600 font-mono mt-1">৳{totalSpent.toLocaleString()}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Budget Allocation</span>
          <p className="text-2xl font-bold text-slate-800 font-mono mt-1">
            {budget > 0 ? `৳${budget.toLocaleString()}` : 'No Budget'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Budget Consumed</span>
          <div className="mt-2">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className={`font-bold ${isOverBudget ? 'text-red-600' : 'text-slate-700'}`}>
                {budgetUtilization}%
              </span>
              {isOverBudget && <span className="text-[10px] text-red-500 font-bold uppercase">Over Budget</span>}
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full ${isOverBudget ? 'bg-red-500' : 'bg-slate-900'}`}
                style={{ width: `${budgetUtilization}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Average per Voucher</span>
          <p className="text-2xl font-bold text-slate-700 font-mono mt-1">
            ৳{Number(averageVoucher).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Interactive Date & Month Filter Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
        {/* Mode Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setFilterMode('day')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                filterMode === 'day' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setFilterMode('month')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                filterMode === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setFilterMode('year')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                filterMode === 'year' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Year
            </button>
            <button
              onClick={() => setFilterMode('range')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                filterMode === 'range' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Range
            </button>
          </div>

          {/* Month Shortcuts */}
          {filterMode === 'month' && (
            <div className="flex items-center gap-1.5 ml-2">
              <button
                type="button"
                onClick={() => applyPresetMonth(0)}
                className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => applyPresetMonth(-1)}
                className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
              >
                Last Month
              </button>
              <button
                type="button"
                onClick={() => applyPresetMonth(-2)}
                className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
              >
                2 Months Ago
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Inputs Based on Filter Mode */}
        <div className="flex items-center gap-3">
          {filterMode === 'day' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Select Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-slate-200 bg-white rounded-xl px-3 py-1.5 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          )}

          {filterMode === 'month' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Select Month:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="border border-slate-200 bg-white rounded-xl px-3 py-1.5 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          )}

          {filterMode === 'year' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Select Year:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="border border-slate-200 bg-white rounded-xl px-3 py-1.5 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-slate-900"
              >
                {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 3 + i).map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          )}

          {filterMode === 'range' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange((prev) => ({ ...prev, from: e.target.value }))}
                className="border border-slate-200 bg-white rounded-xl px-2.5 py-1.5 text-xs text-slate-800 outline-none"
              />
              <span className="text-slate-400 text-xs font-bold">to</span>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange((prev) => ({ ...prev, to: e.target.value }))}
                className="border border-slate-200 bg-white rounded-xl px-2.5 py-1.5 text-xs text-slate-800 outline-none"
              />
            </div>
          )}

          <div className="ml-2 pl-4 border-l border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Entries</span>
            <span className="text-lg font-bold text-slate-800 font-mono">{bills.length}</span>
          </div>
        </div>
      </div>

      {/* Itemized Expense Ledger Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm bg-white">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider border-b border-slate-100">
              <th className="px-6 py-4">SL</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Expense Voucher Name</th>
              <th className="px-6 py-4">Paid To</th>
              <th className="px-6 py-4">Disbursed From</th>
              <th className="px-6 py-4">Remarks</th>
              <th className="px-6 py-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-slate-400 text-sm">
                  Loading expenses for selected period...
                </td>
              </tr>
            ) : bills.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-slate-400 text-sm">
                  No expense records found for this {filterMode}.
                </td>
              </tr>
            ) : (
              bills.map((bill, index) => (
                <tr key={bill._id || index} className="hover:bg-slate-50/70 transition">
                  <td className="px-6 py-4 text-slate-400 text-sm">{index + 1}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {bill.createdAt ? new Date(bill.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-800">{bill.billName}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{bill.payeeName || bill.payee || 'Direct Store Expense'}</td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-600 uppercase">
                    {bill.payment_details?.payment_method || bill.paymentAc || 'Cash'}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400">{bill.remarks || '—'}</td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-red-600 text-base">
                    ৳{Number(bill.amount).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpenseThreadDetails;