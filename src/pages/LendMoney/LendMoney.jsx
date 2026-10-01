import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import UniversalPaymentModal from '../../components/UniversalPaymentModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const LendMoney = () => {
  const [loans, setLoans] = useState([]);
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('disburse'); // 'disburse' (Lend) or 'collect' (Receive repayment)
  const [selectedLoan, setSelectedLoan] = useState(null);

  // Payment register selection state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    payment_method: '',
    account_id: ''
  });

  // Disbursement / Collection Form
  const [formData, setFormData] = useState({
    party_id: '',
    party_name: '',
    borrower_type: 'CUSTOMER', // CUSTOMER, FARMER, EMPLOYEE
    amount: '',
    date: new Date().toISOString().split('T')[0],
    expected_return_date: '',
    purpose: '',
    remarks: ''
  });

  useEffect(() => {
    fetchLoans();
    fetchParties();
  }, []);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/loans/lent`);
      setLoans(res.data.data || res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load lending records');
    } finally {
      setLoading(false);
    }
  };

  const fetchParties = async () => {
    try {
      // Fetches customers, farmers, and employees
      const res = await axios.get(`${API_BASE_URL}/api/customers`);
      setParties(res.data.data || res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const openDisburseModal = () => {
    setModalMode('disburse');
    setSelectedLoan(null);
    setFormData({
      party_id: '',
      party_name: '',
      borrower_type: 'CUSTOMER',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      expected_return_date: '',
      purpose: '',
      remarks: ''
    });
    setPaymentForm({ payment_method: '', account_id: '' });
    setShowModal(true);
  };

  const openCollectModal = (loan) => {
    setModalMode('collect');
    setSelectedLoan(loan);
    const remainingBalance = (Number(loan.principal) || 0) - (Number(loan.recovered_amount) || 0);

    setFormData({
      party_id: loan.party_id,
      party_name: loan.party_name,
      borrower_type: loan.borrower_type,
      amount: remainingBalance > 0 ? remainingBalance : '',
      date: new Date().toISOString().split('T')[0],
      expected_return_date: '',
      purpose: 'Loan Recovery / Repayment',
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
      return toast.warn('Please choose an account for this cash flow');
    }

    const payload = {
      ...formData,
      amount: Number(formData.amount),
      account_id: paymentForm.account_id,
      payment_method: paymentForm.payment_method
    };

    try {
      if (modalMode === 'disburse') {
        // Disburse loan (Debits register, records receivable asset)
        await axios.post(`${API_BASE_URL}/api/loans/lend`, payload);
        toast.success('Loan disbursed successfully!');
      } else {
        // Collect recovery (Credits register, decreases receivable)
        await axios.post(`${API_BASE_URL}/api/loans/lent/${selectedLoan._id}/collect`, payload);
        toast.success('Repayment collected successfully!');
      }
      setShowModal(false);
      fetchLoans();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transaction failed');
    }
  };

  // Metrics
  const totalPrincipalLent = useMemo(
    () => loans.reduce((acc, curr) => acc + (Number(curr.principal) || 0), 0),
    [loans]
  );
  const totalRecovered = useMemo(
    () => loans.reduce((acc, curr) => acc + (Number(curr.recovered_amount) || 0), 0),
    [loans]
  );
  const totalOutstanding = Math.max(0, totalPrincipalLent - totalRecovered);

  return (
    <div className="p-8 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      {/* Top Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-light text-slate-900 tracking-tight">
            Money <span className="font-bold">Lending & Receivables</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track loans extended to dealers, farmers, and staff, along with collection history
          </p>
        </div>
        <button
          onClick={openDisburseModal}
          className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-black transition shadow-md"
        >
          + Disburse Loan
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Disbursed</span>
          <p className="text-2xl font-bold text-slate-900 font-mono mt-1">৳{totalPrincipalLent.toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Recovered Back</span>
          <p className="text-2xl font-bold text-emerald-600 font-mono mt-1">৳{totalRecovered.toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Net Outstanding Claim</span>
          <p className="text-2xl font-bold text-red-600 font-mono mt-1">৳{totalOutstanding.toLocaleString()}</p>
        </div>
      </div>

      {/* Loans Ledger Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider border-b border-slate-100">
              <th className="px-6 py-4">SL</th>
              <th className="px-6 py-4">Borrower</th>
              <th className="px-6 py-4">Disbursed Date</th>
              <th className="px-6 py-4 text-right">Principal</th>
              <th className="px-6 py-4 text-right">Recovered</th>
              <th className="px-6 py-4 text-right">Remaining Due</th>
              <th className="px-6 py-4">Due Date</th>
              <th className="px-6 py-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="8" className="p-8 text-center text-slate-400 text-sm">
                  Loading loan ledgers...
                </td>
              </tr>
            ) : loans.length === 0 ? (
              <tr>
                <td colSpan="8" className="p-8 text-center text-slate-400 text-sm">
                  No money has been lent out yet.
                </td>
              </tr>
            ) : (
              loans.map((loan, index) => {
                const rem = (Number(loan.principal) || 0) - (Number(loan.recovered_amount) || 0);
                const isSettled = rem <= 0;

                return (
                  <tr key={loan._id || index} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4 text-slate-400 text-sm">{index + 1}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {loan.party_name}
                      <span className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                        {loan.borrower_type || 'Party'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {loan.date ? new Date(loan.date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-medium text-slate-800">
                      ৳{Number(loan.principal).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-emerald-600">
                      ৳{Number(loan.recovered_amount || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-red-600">
                      ৳{rem.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {loan.expected_return_date ? new Date(loan.expected_return_date).toLocaleDateString() : 'Open'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {isSettled ? (
                        <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-lg">
                          Settled
                        </span>
                      ) : (
                        <button
                          onClick={() => openCollectModal(loan)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition"
                        >
                          Receive Payment
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

      {/* Modal: Lend or Collect */}
      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-7 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-800 mb-5">
              {modalMode === 'disburse' ? 'Disburse Loan (Lend Money)' : `Collect Repayment from ${formData.party_name}`}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {modalMode === 'disburse' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Select Borrower</label>
                    <select
                      required
                      value={formData.party_id}
                      onChange={(e) => {
                        const party = parties.find((p) => p._id === e.target.value);
                        setFormData({
                          ...formData,
                          party_id: e.target.value,
                          party_name: party?.name || '',
                          borrower_type: party?.customer_type || 'CUSTOMER'
                        });
                      }}
                      className="w-full mt-1 px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-slate-900 text-sm"
                    >
                      <option value="">-- Choose Party --</option>
                      {parties.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} ({p.customer_type || 'Customer'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Disbursement Date</label>
                      <input
                        type="date"
                        required
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full mt-1 px-4 py-2 border rounded-xl outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Expected Repayment Date</label>
                      <input
                        type="date"
                        value={formData.expected_return_date}
                        onChange={(e) => setFormData({ ...formData, expected_return_date: e.target.value })}
                        className="w-full mt-1 px-4 py-2 border rounded-xl outline-none text-sm"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">
                  {modalMode === 'disburse' ? 'Loan Principal (৳)' : 'Repayment Amount (৳)'}
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
                    {modalMode === 'disburse' ? 'Cash Disbursed Out From' : 'Deposited Into Account'}
                  </label>
                  {!paymentForm.account_id && (
                    <span className="text-[10px] text-amber-600 font-bold uppercase">Required</span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div>
                    <span className="text-sm font-semibold capitalize text-slate-800 block">
                      {paymentForm.payment_method || 'No Account Selected'}
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
                <label className="text-xs font-bold text-slate-500 uppercase">Purpose / Remarks</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="e.g. Emergency farm repair advance"
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
                  {modalMode === 'disburse' ? 'Confirm Disbursement' : 'Confirm Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reusable Multi-Register Picker */}
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

export default LendMoney;