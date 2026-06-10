import React, { useState, useEffect } from 'react';
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


  const [filterType, setFilterType] = useState("date");

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear()
  );

  const [formData, setFormData] = useState({
    expenseThreadId: "",
    billName: "",
    amount: "",
    remarks: "",
    billDate: new Date()
      .toISOString()
      .split("T")[0],
  });

  const [form, setForm] = useState({
    payment_method: "",
    account_id: "",
    paid_amount: 0,
  });

  useEffect(() => {
    fetchThreads();
    fetchAccounts();
  }, []);

  useEffect(() => {
    fetchBills();
  }, [
    filterType,
    selectedDate,
    selectedMonth,
    selectedYear
  ]);

  const fetchBills = async () => {
    try {
      setLoading(true);

      let params = {};

      // DATEWISE
      if (filterType === "date") {
        params.date = selectedDate;
      }

      // MONTHWISE
      if (filterType === "month") {
        params.month = selectedMonth;
      }

      // YEARWISE
      if (filterType === "year") {
        params.year = selectedYear;
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/bills`,
        { params }
      );

      console.log(response.data);

      setBills(response.data.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load bill data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchThreads = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/expense-threads`);
      setThreads(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchAccounts = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/payment_accounts`);
      setAccountList(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  // const openModal = (mode, bill = null) => {
  //   setModalMode(mode);
  //   setCurrentBill(bill);

  //   if (bill) {
  //     setFormData({
  //       expenseThreadId: bill.expenseThreadId?._id || bill.expenseThreadId || '',
  //       billName: bill.billName || '',
  //       amount: bill.amount || '',
  //       remarks: bill.remarks || ''
  //     });
  //     // Correctly mapping existing payment details for Edit/View
  //     setForm({
  //       payment_method: bill.payment_details?.payment_method || bill.paymentAc || "",
  //       account_id: bill.payment_details?.account_id || "",
  //       paid_amount: bill.amount || 0,
  //     });
  //   } else {
  //     setFormData({ expenseThreadId: '', billName: '', amount: '', remarks: '' });
  //     setForm({ payment_method: "", account_id: "", paid_amount: 0 });
  //   }
  //   setShowModal(true);
  // };


  const openModal = (
    mode,
    bill = null
  ) => {
    setModalMode(mode);
    setCurrentBill(bill);

    if (bill) {
      setFormData({
        expenseThreadId:
          bill.expenseThreadId?._id ||
          bill.expenseThreadId ||
          "",

        billName:
          bill.billName || "",

        amount:
          bill.amount || "",

        remarks:
          bill.remarks || "",

        billDate: bill.createdAt
          ? new Date(
            bill.createdAt
          )
            .toISOString()
            .split("T")[0]
          : new Date()
            .toISOString()
            .split("T")[0],
      });

      setForm({
        payment_method:
          bill.payment_details
            ?.payment_method ||
          bill.paymentAc ||
          "",

        account_id:
          bill.payment_details
            ?.account_id || "",

        paid_amount:
          bill.amount || 0,
      });
    } else {
      setFormData({
        expenseThreadId: "",
        billName: "",
        amount: "",
        remarks: "",

        billDate: new Date()
          .toISOString()
          .split("T")[0],
      });

      setForm({
        payment_method: "",
        account_id: "",
        paid_amount: 0,
      });
    }

    setShowModal(true);
  };


  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to permanently delete this bill record?")) {
      try {
        await axios.delete(`${API_BASE_URL}/api/bills/${id}`);
        setBills(prev => prev.filter(b => b._id !== id));
        toast.success("Bill deleted successfully");
      } catch (err) {
        toast.error("Delete failed. Please try again.");
      }
    }
  };

  const handlePaymentSelect = ({ paymentMethod, accountId }) => {
    setForm(prev => ({
      ...prev,
      payment_method: paymentMethod,
      account_id: accountId
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // --- VALIDATION START ---
    if (!form.payment_method || !form.account_id) {
      return toast.warn("Please select a payment method and account before saving.");
    }
    if (!formData.expenseThreadId) {
      return toast.warn("Please select an expense thread.");
    }
    // --- VALIDATION END ---

    // const payload = {
    //   ...formData,
    //   payment_details: form,
    //   paymentAc: form.payment_method
    // };

    const payload = {
      ...formData,

      createdAt: new Date(
        formData.billDate
      ),

      payment_details: form,

      paymentAc:
        form.payment_method,
    };

    try {
      if (modalMode === 'add') {
        await axios.post(`${API_BASE_URL}/api/bills`, payload);
        toast.success("New bill added!");
      } else {
        await axios.put(`${API_BASE_URL}/api/bills/${currentBill._id}`, payload);
        toast.success("Bill updated successfully!");
      }
      setShowModal(false);
      fetchBills();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed.");
    }
  };

  const getSelectedAccountName = () => {
    if (!form.account_id) return "None Selected";
    const acc = accountList.find(a => a._id === form.account_id);
    // Flexible naming check based on common API structures
    return acc ? (acc.account_name || acc.bank_name || acc.name) : "Selected Account";
  };

  if (loading) return <div className="p-10 text-center text-gray-400">Loading records...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-8 py-6 flex justify-between items-center border-b border-gray-50">
          <h2 className="text-2xl font-semibold text-gray-800 tracking-tight">Financial Ledger</h2>
          <button onClick={() => navigate('/expense-threads')} className="bg-slate-900 hover:bg-black text-white px-5 py-2 rounded-lg text-sm font-medium transition-all shadow-md">Expense Threads</button>
          < button onClick={() => openModal('add')} className="bg-slate-900 hover:bg-black text-white px-5 py-2 rounded-lg text-sm font-medium transition-all shadow-md">+ Create New Entry</button>
        </div>


        <div className="px-8 py-5 border-b border-gray-100 bg-slate-50 flex flex-wrap items-center gap-4">

          {/* FILTER TYPE */}
          <div className="flex flex-col">
            <label className="text-xs font-bold uppercase text-slate-400 mb-1">
              Filter By
            </label>

            <select
              value={filterType}
              onChange={(e) =>
                setFilterType(e.target.value)
              }
              className="border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">
                Date Wise
              </option>

              <option value="month">
                Month Wise
              </option>

              <option value="year">
                Year Wise
              </option>
            </select>
          </div>

          {/* DATE FILTER */}
          {filterType === "date" && (
            <div className="flex flex-col">
              <label className="text-xs font-bold uppercase text-slate-400 mb-1">
                Select Date
              </label>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) =>
                  setSelectedDate(
                    e.target.value
                  )
                }
                className="border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* MONTH FILTER */}
          {filterType === "month" && (
            <div className="flex flex-col">
              <label className="text-xs font-bold uppercase text-slate-400 mb-1">
                Select Month
              </label>

              <input
                type="month"
                value={selectedMonth}
                onChange={(e) =>
                  setSelectedMonth(
                    e.target.value
                  )
                }
                className="border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* YEAR FILTER */}
          {filterType === "year" && (
            <div className="flex flex-col">
              <label className="text-xs font-bold uppercase text-slate-400 mb-1">
                Select Year
              </label>

              <select
                value={selectedYear}
                onChange={(e) =>
                  setSelectedYear(
                    Number(e.target.value)
                  )
                }
                className="border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from(
                  { length: 10 },
                  (_, i) =>
                    new Date().getFullYear() -
                    5 +
                    i
                ).map((year) => (
                  <option
                    key={year}
                    value={year}
                  >
                    {year}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* TOTAL RECORDS */}
          <div className="ml-auto">
            <div className="bg-white border px-5 py-3 rounded-xl shadow-sm">
              <p className="text-xs text-slate-400 uppercase font-bold">
                Total Records
              </p>

              <p className="text-lg font-bold text-slate-800">
                {bills.length}
              </p>
            </div>
          </div>
        </div>



        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50">
              <tr className="text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4">SL</th>
                <th className="px-6 py-4">Bill Name</th>
                <th className="px-6 py-4">Thread</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Account</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bills.map((bill, index) => (
                <tr key={bill._id || index} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-slate-400 text-sm">{index + 1}</td>
                  <td className="px-6 py-4 text-slate-900 font-semibold">{bill.billName}</td>
                  <td className="px-6 py-4 text-slate-500 text-sm">{bill.expenseThreadName || "N/A"}</td>
                  <td className="px-6 py-4 text-blue-600 font-bold">${bill.amount}</td>
                  <td className="px-6 py-4 text-slate-600 text-sm capitalize">{bill.payment_details?.payment_method || bill.paymentAc || "N/A"}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {bill.createdAt
                      ? new Date(
                        bill.createdAt
                      ).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="px-6 py-4 text-center space-x-2">
                    <button onClick={() => openModal('view', bill)} className="px-2 py-1 text-xs bg-slate-100 rounded text-slate-600 hover:bg-slate-200">View</button>
                    <button onClick={() => openModal('edit', bill)} className="px-2 py-1 text-xs bg-blue-50 rounded text-blue-600 hover:bg-blue-100">Edit</button>
                    <button onClick={() => handleDelete(bill._id)} className="px-2 py-1 text-xs bg-red-50 rounded text-red-600 hover:bg-red-100">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Bill Entry/Edit Modal --- */}
      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-8 overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-bold text-slate-800 mb-6 capitalize">{modalMode} Record</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Bill Name</label>
                <input type="text" required disabled={modalMode === 'view'} value={formData.billName} onChange={(e) => setFormData({ ...formData, billName: e.target.value })} className="w-full mt-1 px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">
                  Bill Date
                </label>

                <input
                  type="date"
                  required
                  disabled={
                    modalMode === "view"
                  }
                  value={formData.billDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      billDate:
                        e.target.value,
                    })
                  }
                  className="w-full mt-1 px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                />
              </div>


              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Amount ($)</label>
                  <input type="number" required disabled={modalMode === 'view'} value={formData.amount} onChange={(e) => { setFormData({ ...formData, amount: e.target.value }); setForm({ ...form, paid_amount: e.target.value }); }} className="w-full mt-1 px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Expense Thread</label>
                  <select required disabled={modalMode === 'view'} value={formData.expenseThreadId} onChange={(e) => setFormData({ ...formData, expenseThreadId: e.target.value })} className="w-full mt-1 px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50">
                    <option value="">Select Thread</option>
                    {threads?.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                  </select>
                </div>
              </div>

              {/* PAYMENT SECTION WITH HIGHLIGHTED VALIDATION */}
              <div className={`p-4 rounded-xl border transition-all ${!form.account_id && modalMode !== 'view' ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">Payment Details</label>
                  {!form.account_id && modalMode !== 'view' && <span className="text-[10px] text-amber-600 font-bold uppercase">Required</span>}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex flex-col">
                    <span className={`text-sm font-semibold capitalize ${!form.payment_method ? 'text-slate-400 italic' : 'text-slate-700'}`}>
                      {form.payment_method || "No method selected"}
                    </span>
                    <span className={`text-xs ${!form.account_id ? 'text-amber-500' : 'text-blue-600 font-medium'}`}>
                      {getSelectedAccountName()}
                    </span>
                  </div>
                  {modalMode !== 'view' && (
                    <button type="button" onClick={() => setShowPaymentModal(true)} className="text-xs bg-slate-900 hover:bg-black text-white px-3 py-1.5 rounded-lg transition-colors">
                      {form.account_id ? "Change Account" : "Select Account"}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Remarks</label>
                <textarea disabled={modalMode === 'view'} value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} className="w-full mt-1 px-4 py-2 border rounded-xl outline-none h-20 disabled:bg-slate-50 resize-none" />
              </div>

              <div className="pt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 text-slate-400 hover:text-slate-600">Cancel</button>
                {modalMode !== 'view' && (
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-xl font-semibold shadow-lg transition-all">
                    {modalMode === 'add' ? 'Create Entry' : 'Update Bill'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Universal Modal Integration --- */}
      <UniversalPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSelectPayment={handlePaymentSelect}
        defaultPaymentMethod={form.payment_method}
        defaultSelectedAccount={form.account_id} // Pass current ID to highlight in edit mode
      />
    </div>
  );
};

export default BillsList;