import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import UniversalPaymentModal from '../../components/UniversalPaymentModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const BorrowMoney = () => {
  const [debts, setDebts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('take'); // 'take' (Borrow) or 'repay' (Pay back)
  const [selectedDebt, setSelectedDebt] = useState(null);

  // Payment register selection state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    payment_method: '',
    account_id: ''
  });

  // Borrow / Repay Form State
  const [formData, setFormData] = useState({
    lender_name: '',
    lender_phone: '',
    lender_type: 'SUPPLIER', // SUPPLIER, BANK, PRIVATE_LENDER
    supplier_id: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    repayment_due_date: '',
    remarks: ''
  });

  useEffect(() => {
    fetchDebts();
    fetchSuppliers();
  }, []);

  const fetchDebts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/loans/borrowed`);
      setDebts(res.data.data || res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load borrowed loan records');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/suppliers`);
      setSuppliers(res.data.data || res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const openTakeModal = () => {
    setModalMode('take');
    setSelectedDebt(null);
    setFormData({
      lender_name: '',
      lender_phone: '',
      lender_type: 'SUPPLIER',
      supplier_id: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      repayment_due_date: '',
      remarks: ''
    });
    setPaymentForm({ payment_method: '', account_id: '' });
    setShowModal(true);
  };

  const openRepayModal = (debt) => {
    setModalMode('repay');
    setSelectedDebt(debt);
    const remainingBalance = (Number(debt.principal) || 0) - (Number(debt.repaid_amount) || 0);

    setFormData({
      lender_name: debt.lender_name,
      lender_phone: debt.lender_phone || '',
      lender_type: debt.lender_type,
      supplier_id: debt.supplier_id || '',
      amount: remainingBalance > 0 ? remainingBalance : '',
      date: new Date().toISOString().split('T')[0],
      repayment_due_date: '',
      remarks: ''
    });
    setPaymentForm({ payment_method: '', account_id: '' });
    setShowModal(true);
  };

  const handlePaymentSelect = ({ paymentMethod, accountId }) => {
    setPaymentForm({
      payment_method: paymentMethod,
      account_id: accountId
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!paymentForm.account_id) {
      return toast.warn('Please select a payment register account');
    }

    const payload = {
      ...formData,
      amount: Number(formData.amount),
      account_id: paymentForm.account_id,
      payment_method: paymentForm.payment_method
    };

    try {
      if (modalMode === 'take') {
        // Take Loan (Credits cash register, records liability payable)
        await axios.post(`${API_BASE_URL}/api/loans/borrow`, payload);
        toast.success('Funds recorded into account balance!');
      } else {
        // Repay Debt (Debits cash register, reduces liability)
        await axios.post(`${API_BASE_URL}/api/loans/borrowed/${selectedDebt._id}/repay`, payload);
        toast.success('Debt repayment disbursed successfully!');
      }
      setShowModal(false);
      fetchDebts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transaction failed');
    }
  };

  // Metrics
  const totalBorrowed = useMemo(
    () => debts.reduce((acc, curr) => acc + (Number(curr.principal) || 0), 0),
    [debts]
  );
  const totalRepaid = useMemo(
    () => debts.reduce((acc, curr) => acc + (Number(curr.repaid_amount) || 0), 0),
    [debts]
  );
  const totalNetPayable = Math.max(0, totalBorrowed - totalRepaid);

  return (
    <div className="p-8 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      {/* Top Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-light text-slate-900 tracking-tight">
            Borrowed Funds & <span className="font-bold">Debt Payables</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage capital injections from suppliers, banks, and private lenders
          </p>
        </div>
        <button
          onClick={openTakeModal}
          className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-black transition shadow-md"
        >
          + Borrow / Receive Funds
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Borrowed</span>
          <p className="text-2xl font-bold text-slate-900 font-mono mt-1">৳{totalBorrowed.toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Principal Repaid</span>
          <p className="text-2xl font-bold text-emerald-600 font-mono mt-1">৳{totalRepaid.toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Remaining Debt Payable</span>
          <p className="text-2xl font-bold text-red-600 font-mono mt-1">৳{totalNetPayable.toLocaleString()}</p>
        </div>
      </div>

      {/* Debt Obligations Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider border-b border-slate-100">
              <th className="px-6 py-4">SL</th>
              <th className="px-6 py-4">Creditor / Source</th>
              <th className="px-6 py-4">Received Date</th>
              <th className="px-6 py-4 text-right">Loan Amount</th>
              <th className="px-6 py-4 text-right">Repaid</th>
              <th className="px-6 py-4 text-right">Balance Due</th>
              <th className="px-6 py-4">Maturity Date</th>
              <th className="px-6 py-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="8" className="p-8 text-center text-slate-400 text-sm">
                  Loading borrowed debt ledgers...
                </td>
              </tr>
            ) : debts.length === 0 ? (
              <tr>
                <td colSpan="8" className="p-8 text-center text-slate-400 text-sm">
                  No active borrowed debt obligations found.
                </td>
              </tr>
            ) : (
              debts.map((debt, index) => {
                const rem = (Number(debt.principal) || 0) - (Number(debt.repaid_amount) || 0);
                const isCleared = rem <= 0;

                return (
                  <tr key={debt._id || index} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4 text-slate-400 text-sm">{index + 1}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {debt.lender_name}
                      <span className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                        {debt.lender_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {debt.date ? new Date(debt.date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-medium text-slate-800">
                      ৳{Number(debt.principal).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-emerald-600">
                      ৳{Number(debt.repaid_amount || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-red-600">
                      ৳{rem.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {debt.repayment_due_date ? new Date(debt.repayment_due_date).toLocaleDateString() : 'Flexible'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {isCleared ? (
                        <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-lg">
                          Settled
                        </span>
                      ) : (
                        <button
                          onClick={() => openRepayModal(debt)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-black rounded-lg shadow-sm transition"
                        >
                          Disburse Repayment
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Borrow or Repay */}
      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-7 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-800 mb-5">
              {modalMode === 'take' ? 'Receive Inward Loan (Borrow Money)' : `Pay Back Debt to ${formData.lender_name}`}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {modalMode === 'take' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Creditor Type</label>
                    <select
                      value={formData.lender_type}
                      onChange={(e) => setFormData({ ...formData, lender_type: e.target.value })}
                      className="w-full mt-1 px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-slate-900 text-sm"
                    >
                      <option value="SUPPLIER">Registered Supplier</option>
                      <option value="BANK">Bank / Financial Institution</option>
                      <option value="PRIVATE_LENDER">Private Individual / Partner</option>
                    </select>
                  </div>

                  {formData.lender_type === 'SUPPLIER' ? (
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Select Supplier</label>
                      <select
                        required
                        value={formData.supplier_id}
                        onChange={(e) => {
                          const supp = suppliers.find((s) => s._id === e.target.value);
                          setFormData({
                            ...formData,
                            supplier_id: e.target.value,
                            lender_name: supp?.name || '',
                            lender_phone: supp?.phone || ''
                          });
                        }}
                        className="w-full mt-1 px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-slate-900 text-sm"
                      >
                        <option value="">-- Choose Supplier --</option>
                        {suppliers.map((s) => (
                          <option key={s._id} value={s._id}>
                            {s.name} ({s.phone || 'No phone'})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Lender Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Agrani Bank / Partner name"
                          value={formData.lender_name}
                          onChange={(e) => setFormData({ ...formData, lender_name: e.target.value })}
                          className="w-full mt-1 px-4 py-2 border rounded-xl outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Contact Phone</label>
                        <input
                          type="text"
                          placeholder="01XXXXXXXXX"
                          value={formData.lender_phone}
                          onChange={(e) => setFormData({ ...formData, lender_phone: e.target.value })}
                          className="w-full mt-1 px-4 py-2 border rounded-xl outline-none text-sm"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Received Date</label>
                      <input
                        type="date"
                        required
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full mt-1 px-4 py-2 border rounded-xl outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Maturity / Due Date</label>
                      <input
                        type="date"
                        value={formData.repayment_due_date}
                        onChange={(e) => setFormData({ ...formData, repayment_due_date: e.target.value })}
                        className="w-full mt-1 px-4 py-2 border rounded-xl outline-none text-sm"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">
                  {modalMode === 'take' ? 'Loan Inflow Amount (৳)' : 'Repayment Outflow Amount (৳)'}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full mt-1 px-4 py-2 border rounded-xl outline-none font-mono font-bold text-slate-900 text-lg"
                />
              </div>

              {/* Source/Destination Account Section */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    {modalMode === 'take' ? 'Deposit Into Cash Register / Bank' : 'Disburse Payment From Account'}
                  </label>
                  {!paymentForm.account_id && (
                    <span className="text-[10px] text-amber-600 font-bold uppercase">Required</span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div>
                    <span className="text-sm font-semibold capitalize text-slate-800 block">
                      {paymentForm.payment_method || 'No Register Selected'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(true)}
                    className="text-xs bg-slate-900 hover:bg-black text-white px-3 py-1.5 rounded-lg transition"
                  >
                    {paymentForm.account_id ? 'Change Account' : 'Choose Account'}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Notes & Conditions</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="e.g. 3-month tenure working capital"
                  className="w-full mt-1 px-4 py-2 border rounded-xl outline-none h-18 resize-none text-sm"
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
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-black text-white px-6 py-2 rounded-xl text-sm font-semibold shadow-md transition"
                >
                  {modalMode === 'take' ? 'Confirm Inward Loan' : 'Confirm Repayment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Universal Multi-Account Picker Modal */}
      <UniversalPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSelectPayment={handlePaymentSelect}
        defaultPaymentMethod={paymentForm.payment_method}
        defaultSelectedAccount={paymentForm.account_id}
      />
    </div>
  );
};

export default BorrowMoney;