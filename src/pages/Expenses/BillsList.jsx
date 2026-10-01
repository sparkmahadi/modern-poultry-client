import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import UniversalPaymentModal from '../../components/UniversalPaymentModal';
import { useNavigate } from 'react-router';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const BillsList = () => {
  const [threads, setThreads] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentBill, setCurrentBill] = useState(null);
  const navigate = useNavigate();

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [accountList, setAccountList] = useState([]);

  // Filtering states
  const [filterType, setFilterType] = useState('date');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedThreadFilter, setSelectedThreadFilter] = useState('');

  // Daily Expense Entry Form
  const [formData, setFormData] = useState({
    expenseThreadId: '',
    billName: '',
    payeeName: '', // Vendor / Person receiving the money
    amount: '',
    remarks: '',
    billDate: new Date().toISOString().split('T')[0]
  });

  const [form, setForm] = useState({
    payment_method: '',
    account_id: '',
    paid_amount: 0
  });

  useEffect(() => {
    fetchThreads();
    fetchAccounts();
  }, []);

  useEffect(() => {
    fetchBills();
  }, [filterType, selectedDate, selectedMonth, selectedYear, selectedThreadFilter]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      let params = {};
      if (filterType === 'date') params.date = selectedDate;
      if (filterType === 'month') params.month = selectedMonth;
      if (filterType === 'year') params.year = selectedYear;
      if (selectedThreadFilter) params.expenseThreadId = selectedThreadFilter;

      const response = await axios.get(`${API_BASE_URL}/api/bills`, { params });
      setBills(response.data.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load expense vouchers.');
    } finally {
      setLoading(false);
    }
  };

  const fetchThreads = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/expense-threads`);
      setThreads(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/payment_accounts`);
      setAccountList(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const openModal = (mode, bill = null) => {
    setModalMode(mode);
    setCurrentBill(bill);

    if (bill) {
      setFormData({
        expenseThreadId: bill.expenseThreadId?._id || bill.expenseThreadId || '',
        billName: bill.billName || '',
        payeeName: bill.payeeName || bill.payee || '',
        amount: bill.amount || '',
        remarks: bill.remarks || '',
        billDate: bill.createdAt ? new Date(bill.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      });

      setForm({
        payment_method: bill.payment_details?.payment_method || bill.paymentAc || '',
        account_id: bill.payment_details?.account_id || '',
        paid_amount: bill.amount || 0
      });
    } else {
      setFormData({
        expenseThreadId: '',
        billName: '',
        payeeName: '',
        amount: '',
        remarks: '',
        billDate: new Date().toISOString().split('T')[0]
      });

      setForm({
        payment_method: '',
        account_id: '',
        paid_amount: 0
      });
    }

    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this expense entry? This will reverse the account deduction.')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/bills/${id}`);
        setBills((prev) => prev.filter((b) => b._id !== id));
        toast.success('Expense voucher deleted');
      } catch (err) {
        toast.error('Delete failed. Please try again.');
      }
    }
  };

  const handlePaymentSelect = ({ paymentMethod, accountId }) => {
    setForm((prev) => ({
      ...prev,
      payment_method: paymentMethod,
      account_id: accountId
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.payment_method || !form.account_id) {
      return toast.warn('Please select the payment source account.');
    }
    if (!formData.expenseThreadId) {
      return toast.warn('Please assign an expense category.');
    }

    const payload = {
      ...formData,
      amount: Number(formData.amount),
      createdAt: new Date(formData.billDate),
      payment_details: form,
      paymentAc: form.payment_method
    };

    try {
      if (modalMode === 'add') {
        await axios.post(`${API_BASE_URL}/api/bills`, payload);
        toast.success('Expense recorded successfully!');
      } else {
        await axios.put(`${API_BASE_URL}/api/bills/${currentBill._id}`, payload);
        toast.success('Expense voucher updated!');
      }
      setShowModal(false);
      fetchBills();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    }
  };

  const totalExpense = useMemo(() => {
    return bills.reduce((acc, b) => acc + (Number(b.amount) || 0), 0);
  }, [bills]);

  const getSelectedAccountName = () => {
    if (!form.account_id) return 'None Selected';
    const acc = accountList.find((a) => a._id === form.account_id);
    return acc ? acc.account_name || acc.bank_name || acc.name : 'Selected Account';
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200/70 overflow-hidden">
        {/* Top Action Bar */}
        <div className="px-8 py-6 flex flex-wrap justify-between items-center gap-4 border-b border-slate-100">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Shop Daily Expenses</h2>
            <p className="text-xs text-slate-400 mt-0.5">Record and monitor all day-to-day out-of-pocket store expenses</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/expense-threads')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-xl text-sm font-medium transition"
            >
              Expense Heads
            </button>
            <button
              onClick={() => openModal('add')}
              className="bg-slate-900 hover:bg-black text-white px-5 py-2 rounded-xl text-sm font-semibold transition shadow-md"
            >
              + Record Expense
            </button>
          </div>
        </div>

        {/* Filters and Summary Ribbon */}
        <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/70 flex flex-wrap items-center gap-4">
          <div className="flex flex-col">
            <label className="text-[11px] font-bold uppercase text-slate-400 mb-1">Filter View</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-slate-200 bg-white rounded-xl px-3 py-1.5 text-sm outline-none"
            >
              <option value="date">Daily</option>
              <option value="month">Monthly</option>
              <option value="year">Yearly</option>
            </select>
          </div>

          {filterType === 'date' && (
            <div className="flex flex-col">
              <label className="text-[11px] font-bold uppercase text-slate-400 mb-1">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-slate-200 bg-white rounded-xl px-3 py-1.5 text-sm outline-none"
              />
            </div>
          )}

          {filterType === 'month' && (
            <div className="flex flex-col">
              <label className="text-[11px] font-bold uppercase text-slate-400 mb-1">Month</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="border border-slate-200 bg-white rounded-xl px-3 py-1.5 text-sm outline-none"
              />
            </div>
          )}

          {/* Filter by Specific Expense Head */}
          <div className="flex flex-col">
            <label className="text-[11px] font-bold uppercase text-slate-400 mb-1">Expense Head</label>
            <select
              value={selectedThreadFilter}
              onChange={(e) => setSelectedThreadFilter(e.target.value)}
              className="border border-slate-200 bg-white rounded-xl px-3 py-1.5 text-sm outline-none"
            >
              <option value="">All Heads</option>
              {threads.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Total Period Outflow Widget */}
          <div className="ml-auto flex items-center gap-4">
            <div className="bg-white border border-slate-200 px-5 py-2.5 rounded-xl shadow-sm text-right">
              <span className="text-[11px] text-slate-400 font-bold uppercase block">Total Outflow</span>
              <span className="text-xl font-bold text-red-600 font-mono">৳{totalExpense.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4">SL</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Expense Description</th>
                <th className="px-6 py-4">Category / Head</th>
                <th className="px-6 py-4">Paid To</th>
                <th className="px-6 py-4">Paid From</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bills.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-10 text-center text-slate-400 text-sm">
                    No expense records found for this period.
                  </td>
                </tr>
              ) : (
                bills.map((bill, index) => (
                  <tr key={bill._id || index} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4 text-slate-400 text-sm">{index + 1}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {bill.createdAt ? new Date(bill.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {bill.billName}
                      {bill.remarks && <span className="block text-xs font-normal text-slate-400">{bill.remarks}</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-md">
                        {bill.expenseThreadName || bill.expenseThreadId?.name || 'Overhead'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-sm">{bill.payeeName || bill.payee || 'Direct Expense'}</td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-600 uppercase">
                      {bill.payment_details?.payment_method || bill.paymentAc || 'Cash'}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-red-600 text-base">
                      ৳{Number(bill.amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center space-x-2">
                      <button
                        onClick={() => openModal('view', bill)}
                        className="px-2.5 py-1 text-xs font-medium bg-slate-100 rounded hover:bg-slate-200 text-slate-600"
                      >
                        View
                      </button>
                      <button
                        onClick={() => openModal('edit', bill)}
                        className="px-2.5 py-1 text-xs font-medium bg-blue-50 rounded hover:bg-blue-100 text-blue-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(bill._id)}
                        className="px-2.5 py-1 text-xs font-medium bg-red-50 rounded hover:bg-red-100 text-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Entry & Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-7 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-800 mb-5 capitalize">
              {modalMode === 'add' ? 'Record Shop Expense' : `${modalMode} Expense Voucher`}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Expense Purpose / Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Daily staff lunch, Generator diesel 10L, Meter recharge"
                  disabled={modalMode === 'view'}
                  value={formData.billName}
                  onChange={(e) => setFormData({ ...formData, billName: e.target.value })}
                  className="w-full mt-1 px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Date</label>
                  <input
                    type="date"
                    required
                    disabled={modalMode === 'view'}
                    value={formData.billDate}
                    onChange={(e) => setFormData({ ...formData, billDate: e.target.value })}
                    className="w-full mt-1 px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Expense Head</label>
                  <select
                    required
                    disabled={modalMode === 'view'}
                    value={formData.expenseThreadId}
                    onChange={(e) => setFormData({ ...formData, expenseThreadId: e.target.value })}
                    className="w-full mt-1 px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-50"
                  >
                    <option value="">Select Category</option>
                    {threads.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Amount (৳)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="0.00"
                    disabled={modalMode === 'view'}
                    value={formData.amount}
                    onChange={(e) => {
                      setFormData({ ...formData, amount: e.target.value });
                      setForm({ ...form, paid_amount: e.target.value });
                    }}
                    className="w-full mt-1 px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-slate-900 font-mono font-bold text-red-600 disabled:bg-slate-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Paid To (Payee)</label>
                  <input
                    type="text"
                    placeholder="e.g., Fuel Pump, Electrician, Staff"
                    disabled={modalMode === 'view'}
                    value={formData.payeeName}
                    onChange={(e) => setFormData({ ...formData, payeeName: e.target.value })}
                    className="w-full mt-1 px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-50"
                  />
                </div>
              </div>

              {/* Payment Register Selection */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  !form.account_id && modalMode !== 'view'
                    ? 'bg-amber-50/70 border-amber-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Disbursed From Account</label>
                  {!form.account_id && modalMode !== 'view' && (
                    <span className="text-[10px] text-amber-600 font-bold uppercase">Required</span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div>
                    <span className="text-sm font-semibold capitalize block text-slate-800">
                      {form.payment_method || 'No Register Selected'}
                    </span>
                    <span className="text-xs text-blue-600">{getSelectedAccountName()}</span>
                  </div>
                  {modalMode !== 'view' && (
                    <button
                      type="button"
                      onClick={() => setShowPaymentModal(true)}
                      className="text-xs bg-slate-900 hover:bg-black text-white px-3 py-1.5 rounded-lg transition"
                    >
                      {form.account_id ? 'Change Account' : 'Choose Account'}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Notes / Memo No</label>
                <textarea
                  disabled={modalMode === 'view'}
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full mt-1 px-4 py-2 border rounded-xl outline-none h-18 disabled:bg-slate-50 resize-none text-sm"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2 text-slate-500 hover:text-slate-700 text-sm font-medium"
                >
                  Cancel
                </button>
                {modalMode !== 'view' && (
                  <button
                    type="submit"
                    className="bg-slate-900 hover:bg-black text-white px-6 py-2 rounded-xl text-sm font-semibold shadow-md transition"
                  >
                    {modalMode === 'add' ? 'Confirm & Deduct' : 'Update Expense'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      <UniversalPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSelectPayment={handlePaymentSelect}
        defaultPaymentMethod={form.payment_method}
        defaultSelectedAccount={form.account_id}
      />
    </div>
  );
};

export default BillsList;