import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ExpenseThreads = () => {
  const [threads, setThreads] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedThread, setSelectedThread] = useState(null);
  const navigate = useNavigate();

  // --- Date & Month Filter States ---
  const [filterMode, setFilterMode] = useState('month'); // 'month', 'year', 'range'
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // 'YYYY-MM'
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  // Modal Form State
  const [formData, setFormData] = useState({
    name: '',
    total_cost: '',
    category_type: 'DAILY_UTILITY',
    description: ''
  });

  // 1. Fetch Expense Threads (Master Categories)
  const fetchThreads = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/expense-threads`);
      setThreads(res.data.data || res.data || []);
    } catch (err) {
      toast.error('Failed to sync expense threads');
    }
  };

  // 2. Fetch Bills according to the selected Month/Period
  const fetchPeriodBills = async () => {
    try {
      setLoading(true);
      let params = {};

      if (filterMode === 'month') {
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
      toast.error('Failed to load expense report for selected period');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, []);

  useEffect(() => {
    fetchPeriodBills();
  }, [filterMode, selectedMonth, selectedYear, dateRange]);

  // Aggregate bills by Expense Thread ID for the active period
  const threadSpendMap = useMemo(() => {
    const map = {};
    bills.forEach((bill) => {
      const threadId = bill.expenseThreadId?._id || bill.expenseThreadId;
      if (threadId) {
        map[threadId] = (map[threadId] || 0) + Number(bill.amount || 0);
      }
    });
    return map;
  }, [bills]);

  const totalPeriodOutflow = useMemo(() => {
    return bills.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [bills]);

  // Quick Month Presets
  const applyPresetMonth = (offsetMonths = 0) => {
    const target = new Date();
    target.setMonth(target.getMonth() + offsetMonths);
    setSelectedMonth(target.toISOString().slice(0, 7));
    setFilterMode('month');
  };

  // Modal Handlers
  const handleOpenModal = (mode, thread = null) => {
    setModalMode(mode);
    setSelectedThread(thread);
    setFormData(
      thread
        ? {
            name: thread.name,
            total_cost: thread.monthly_budget || thread.total_cost || '',
            category_type: thread.category_type || 'DAILY_UTILITY',
            description: thread.description || ''
          }
        : { name: '', total_cost: '', category_type: 'DAILY_UTILITY', description: '' }
    );
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this thread?')) {
      try {
        const res = await axios.delete(`${API_BASE_URL}/api/expense-threads/${id}`);
        if (res.data.success) {
          setThreads(threads.filter((t) => t._id !== id));
          toast.success('Thread deleted');
        } else {
          toast.info(res.data.message);
        }
      } catch (err) {
        toast.error('Delete operation failed');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        monthly_budget: Number(formData.total_cost) || 0,
        total_cost: Number(formData.total_cost) || 0,
        category_type: formData.category_type,
        description: formData.description
      };

      if (modalMode === 'add') {
        await axios.post(`${API_BASE_URL}/api/expense-threads`, payload);
        toast.success('New expense thread added!');
      } else if (modalMode === 'edit') {
        await axios.put(`${API_BASE_URL}/api/expense-threads/${selectedThread._id}`, payload);
        toast.success('Thread updated!');
      }
      setIsModalOpen(false);
      fetchThreads();
    } catch (err) {
      toast.error('Action failed');
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-light text-slate-900 tracking-tight">
            Expense <span className="font-bold">Threads Report</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">Track monthly spending and budget limits per expense category</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/bills')}
            className="bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-100 transition shadow-sm"
          >
            📋 All Bills Ledger
          </button>
          <button
            onClick={() => handleOpenModal('add')}
            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-black transition shadow-md"
          >
            + Add New Thread
          </button>
        </div>
      </div>

      {/* Date & Month Filter Ribbon */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
        {/* Mode Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setFilterMode('month')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                filterMode === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Month View
            </button>
            <button
              onClick={() => setFilterMode('year')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                filterMode === 'year' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Year View
            </button>
            <button
              onClick={() => setFilterMode('range')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                filterMode === 'range' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Custom Range
            </button>
          </div>

          {filterMode === 'month' && (
            <div className="flex items-center gap-1 ml-2">
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
            </div>
          )}
        </div>

        {/* Date Pickers */}
        <div className="flex items-center gap-3">
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
                className="border border-slate-200 bg-white rounded-xl px-3 py-1.5 text-sm font-semibold text-slate-800 outline-none"
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
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange((prev) => ({ ...prev, to: e.target.value }))}
                className="border border-slate-200 bg-white rounded-xl px-2.5 py-1.5 text-xs text-slate-800 outline-none"
              />
            </div>
          )}

          {/* Period Total Badge */}
          <div className="ml-2 pl-4 border-l border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Period Spend</span>
            <span className="text-lg font-bold text-red-600 font-mono">৳{totalPeriodOutflow.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Main Threads Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider border-b border-slate-100">
              <th className="px-6 py-4">SL</th>
              <th className="px-6 py-4">Expense Thread</th>
              <th className="px-6 py-4">Budget / Target</th>
              <th className="px-6 py-4">Spent ({filterMode})</th>
              <th className="px-6 py-4">Budget Utilization</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {threads.map((thread, index) => {
              const spent = threadSpendMap[thread._id] || 0;
              const budget = Number(thread.monthly_budget || thread.total_cost || 0);
              const percentage = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
              const isOverBudget = budget > 0 && spent > budget;

              return (
                <tr key={thread._id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4 text-slate-400 text-sm font-medium">{index + 1}</td>
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    {thread.name}
                    {thread.description && (
                      <span className="block text-xs font-normal text-slate-400 mt-0.5">{thread.description}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-mono font-medium text-slate-600">
                    {budget > 0 ? `৳${budget.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-red-600">
                    ৳{spent.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    {budget > 0 ? (
                      <div className="w-40">
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className={isOverBudget ? 'text-red-600 font-bold' : 'text-slate-500'}>
                            {percentage}%
                          </span>
                          {isOverBudget && <span className="text-red-500 font-bold text-[10px]">Over!</span>}
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full ${isOverBudget ? 'bg-red-500' : 'bg-slate-900'}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">No budget set</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() =>
                        navigate(`/expense-threads/${thread._id}`, {
                          state: { filterMode, selectedMonth, selectedYear, dateRange }
                        })
                      }
                      className="px-3 py-1 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition"
                    >
                      Report Details
                    </button>
                    <button
                      onClick={() => handleOpenModal('edit', thread)}
                      className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(thread._id)}
                      className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
            <h2 className="text-xl font-bold mb-4 text-slate-800">
              {modalMode === 'add' ? 'New Expense Thread' : 'Update Expense Thread'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Thread Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Shop Generator Fuel, Feed Transport"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full mt-1 px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Monthly Budget Target (৳)</label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={formData.total_cost}
                  onChange={(e) => setFormData({ ...formData, total_cost: e.target.value })}
                  className="w-full mt-1 px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Category Classification</label>
                <select
                  value={formData.category_type}
                  onChange={(e) => setFormData({ ...formData, category_type: e.target.value })}
                  className="w-full mt-1 px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-slate-900 text-sm"
                >
                  <option value="DAILY_UTILITY">Electricity / Water / Utility</option>
                  <option value="SHOP_MAINTENANCE">Shop Repair & Maintenance</option>
                  <option value="TRANSPORT">Feed & Medicine Transport</option>
                  <option value="WAGES">Daily Labor & Wages</option>
                  <option value="TEA_SNACKS">Client Entertainment & Tea</option>
                  <option value="MISC">Miscellaneous</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Notes / Remarks</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full mt-1 px-4 py-2 border rounded-xl h-20 outline-none text-sm resize-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:text-slate-700 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-black transition"
                >
                  Save Thread
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseThreads;