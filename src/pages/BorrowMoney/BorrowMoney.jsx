import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import {
    ArrowDownLeft,
    Search,
    Calendar,
    Download,
    Plus,
    X,
    Eye,
    Pencil,
    Trash2,
    DollarSign,
    CheckCircle,
    Clock,
    User,
    Phone,
    MapPin,
    Printer,
    FileText
} from 'lucide-react';
import PaymentModal from '../Purchase/PaymentModal';
import TruckLoader from '../../components/Spinner/TruckLoader';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const initialBorrowForm = {
    lender_name: "",
    phone: "",
    address: "",
    amount: "",
    account_id: "",
    payment_method: "cash",
    due_date: "",
    remarks: "",
    date: ""
};

const BorrowMoney = () => {
    // --- Data States ---
    const [loans, setLoans] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState("");

    // --- Modal States ---
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingLoanId, setEditingLoanId] = useState(null); // null = Create, string = Edit
    const [showRepaymentModal, setShowRepaymentModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState(null);

    // --- Forms ---
    const [borrowForm, setBorrowForm] = useState(initialBorrowForm);
    const [repayForm, setRepayForm] = useState({
        amount: "",
        account_id: "",
        payment_method: "cash",
        notes: "",
        date: ""
    });

    const [showPaymentModalForCreate, setShowPaymentModalForCreate] = useState(false);
    const [showPaymentModalForRepay, setShowPaymentModalForRepay] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initial Data Fetch
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [loanRes, accRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/borrow-money`),
                axios.get(`${API_BASE_URL}/api/payment_accounts`)
            ]);
            setLoans(loanRes.data?.data || []);
            setAccounts(accRes.data?.data || []);
        } catch (err) {
            console.error("Failed to load borrow records:", err);
            toast.error("Failed to load records.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const now = new Date();
        const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
        setBorrowForm((prev) => ({ ...prev, date: local }));
        setRepayForm((prev) => ({ ...prev, date: local }));
    }, [fetchData]);

    // Active Account Helpers
    const selectedCreateAccountObj = useMemo(() => {
        return accounts.find((a) => a._id === borrowForm.account_id);
    }, [accounts, borrowForm.account_id]);

    const selectedRepayAccountObj = useMemo(() => {
        return accounts.find((a) => a._id === repayForm.account_id);
    }, [accounts, repayForm.account_id]);

    // Summary Statistics
    const stats = useMemo(() => {
        const totalBorrowed = loans.reduce((sum, l) => sum + Number(l.amount || 0), 0);
        const totalRepaid = loans.reduce((sum, l) => sum + Number(l.repaid_amount || 0), 0);
        const totalPayable = loans.reduce((sum, l) => sum + Number(l.due_amount || 0), 0);
        return { totalBorrowed, totalRepaid, totalPayable };
    }, [loans]);

    // Search and Filter
    const filteredLoans = useMemo(() => {
        return loans.filter((l) => {
            const matchesFilter =
                filter === 'all'
                    ? true
                    : filter === 'unpaid'
                    ? l.status !== 'repaid'
                    : l.status === 'repaid';

            const query = searchQuery.toLowerCase().trim();
            const matchesQuery =
                !query ||
                (l.lender_name && l.lender_name.toLowerCase().includes(query)) ||
                (l.phone && l.phone.includes(query)) ||
                (l.remarks && l.remarks.toLowerCase().includes(query));

            return matchesFilter && matchesQuery;
        });
    }, [loans, filter, searchQuery]);

    // Open Edit Modal & Populate Form
    const handleOpenEdit = (loan) => {
        setEditingLoanId(loan._id);
        const formattedDate = loan.date
            ? new Date(new Date(loan.date).getTime() - new Date(loan.date).getTimezoneOffset() * 60000)
                  .toISOString()
                  .slice(0, 16)
            : "";
        const formattedDueDate = loan.due_date
            ? format(new Date(loan.due_date), "yyyy-MM-dd")
            : "";

        setBorrowForm({
            lender_name: loan.lender_name || "",
            phone: loan.phone || "",
            address: loan.address || "",
            amount: loan.amount || "",
            account_id: loan.account_id?._id || loan.account_id || "",
            payment_method: loan.payment_method || "cash",
            due_date: formattedDueDate,
            remarks: loan.remarks || "",
            date: formattedDate
        });
        setShowCreateModal(true);
    };

    // Open Fresh Create Modal
    const handleOpenCreate = () => {
        setEditingLoanId(null);
        const now = new Date();
        const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
        setBorrowForm({
            ...initialBorrowForm,
            date: local
        });
        setShowCreateModal(true);
    };

    // --- Create / Update Borrow Submit ---
    const handleFormSubmit = async (e) => {
        e.preventDefault();

        if (!borrowForm.lender_name.trim()) return toast.warning("Lender name is required");
        if (!borrowForm.amount || Number(borrowForm.amount) <= 0) return toast.warning("Valid amount is required");
        if (!borrowForm.account_id) return toast.warning("Please select a deposit payment account");

        setIsSubmitting(true);
        try {
            const payload = {
                ...borrowForm,
                amount: Number(borrowForm.amount)
            };

            if (editingLoanId) {
                const res = await axios.put(`${API_BASE_URL}/api/borrow-money/${editingLoanId}`, payload);
                if (res.data?.success) {
                    toast.success(res.data.message || "Borrow record updated successfully!");
                    setShowCreateModal(false);
                    setEditingLoanId(null);
                    fetchData();
                }
            } else {
                const res = await axios.post(`${API_BASE_URL}/api/borrow-money`, payload);
                if (res.data?.success) {
                    toast.success(res.data.message || "Loan deposited and recorded!");
                    setShowCreateModal(false);
                    fetchData();
                }
            }
        } catch (err) {
            console.error("Save failed:", err);
            toast.error(err.response?.data?.message || "Failed to save borrow record.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Repayment Submit (Paying back lender) ---
    const handleRepaySubmit = async (e) => {
        e.preventDefault();

        if (!repayForm.amount || Number(repayForm.amount) <= 0) return toast.warning("Valid repayment amount is required");
        if (!repayForm.account_id) return toast.warning("Please select a withdrawal account");

        setIsSubmitting(true);
        try {
            const payload = {
                ...repayForm,
                amount: Number(repayForm.amount)
            };
            const res = await axios.post(`${API_BASE_URL}/api/borrow-money/${selectedLoan._id}/repay`, payload);
            if (res.data?.success) {
                toast.success(res.data.message || "Repayment recorded!");
                setShowRepaymentModal(false);
                setRepayForm({ amount: "", account_id: "", payment_method: "cash", notes: "", date: "" });
                fetchData();
            }
        } catch (err) {
            console.error("Repayment failed:", err);
            toast.error(err.response?.data?.message || "Repayment failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Delete / Cancel Borrow Record ---
    const handleDelete = async (id) => {
        if (!window.confirm("Cancel this borrow record? This will withdraw the deposited loan amount from your account and reverse any repayments.")) {
            return;
        }

        try {
            const res = await axios.delete(`${API_BASE_URL}/api/borrow-money/${id}`);
            if (res.data?.success) {
                toast.success(res.data.message || "Borrow record cancelled successfully");
                setLoans((prev) => prev.filter((l) => l._id !== id));
            }
        } catch (err) {
            console.error("Delete failed:", err);
            toast.error(err.response?.data?.message || "Failed to delete borrow record.");
        }
    };

    // Excel Export
    const handleExportExcel = () => {
        const data = loans.map((l) => ({
            Date: l.date ? format(new Date(l.date), "yyyy-MM-dd") : "N/A",
            Lender: l.lender_name,
            Phone: l.phone || "N/A",
            Address: l.address || "N/A",
            AmountBorrowed: l.amount || 0,
            RepaidAmount: l.repaid_amount || 0,
            OutstandingPayable: l.due_amount || 0,
            Status: l.status,
            DepositedAccount: l.account_name || "N/A",
            DueDate: l.due_date ? format(new Date(l.due_date), "yyyy-MM-dd") : "N/A",
            Remarks: l.remarks || ""
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "BorrowMoney");
        XLSX.writeFile(wb, `Borrowed_Loans_${format(new Date(), "yyyyMMdd")}.xlsx`);
    };

    if (loading) return <TruckLoader />;

    return (
        <div className="container mx-auto p-6 max-w-7xl font-sans text-slate-700">
            {/* Top Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                            <ArrowDownLeft className="w-6 h-6" />
                        </span>
                        Borrow Money (Liabilities & Loans)
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Track borrowed funds, loans received, repayments, and liabilities
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition shadow-sm text-sm"
                    >
                        <Download className="w-4 h-4" /> Export Excel
                    </button>

                    <button
                        onClick={handleOpenCreate}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:bg-indigo-700 transition text-sm"
                    >
                        <Plus className="w-4 h-4" /> Record New Borrowing
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl border-l-4 border-indigo-500 shadow-sm border border-slate-100">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Principal Borrowed</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">
                        ৳{stats.totalBorrowed.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-2xl border-l-4 border-emerald-500 shadow-sm border border-slate-100">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Repaid Back</p>
                    <p className="text-2xl font-black text-emerald-600 mt-1">
                        ৳{stats.totalRepaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-2xl border-l-4 border-amber-500 shadow-sm border border-slate-100">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Outstanding Payable Debt</p>
                    <p className="text-2xl font-black text-amber-600 mt-1">
                        ৳{stats.totalPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6">
                <div className="flex bg-slate-100 p-1 rounded-xl w-fit border border-slate-200">
                    {[
                        { id: 'all', label: 'All Records' },
                        { id: 'unpaid', label: 'Pending Debt' },
                        { id: 'repaid', label: 'Fully Repaid' }
                    ].map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setFilter(t.id)}
                            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                                filter === t.id
                                    ? 'bg-white text-indigo-700 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                <div className="relative w-full sm:w-72">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search lender or phone..."
                        className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                </div>
            </div>

            {/* Borrow Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">SL</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Lender / Source</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Deposited In</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Principal (৳)</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Repaid (৳)</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Remaining Debt</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredLoans.map((l, idx) => {
                                const isFullyPaid = l.due_amount <= 0;
                                return (
                                    <tr key={l._id} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="px-6 py-4 text-sm font-bold text-slate-400">{idx + 1}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-800">
                                            {l.date ? format(new Date(l.date), "dd MMM yyyy") : "-"}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                                            {l.lender_name}
                                            {l.phone && <span className="text-xs text-slate-400 block font-normal">{l.phone}</span>}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {l.account_name || l.payment_method?.toUpperCase()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right font-bold text-slate-900">
                                            ৳{Number(l.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right font-semibold text-emerald-600">
                                            ৳{Number(l.repaid_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right font-bold text-amber-600">
                                            ৳{Number(l.due_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                                isFullyPaid
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    : l.repaid_amount > 0
                                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                            }`}>
                                                {isFullyPaid ? 'Settled' : l.repaid_amount > 0 ? 'Partial' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center space-x-2 whitespace-nowrap">
                                            {!isFullyPaid && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedLoan(l);
                                                        setRepayForm((prev) => ({
                                                            ...prev,
                                                            amount: l.due_amount,
                                                            account_id: l.account_id?._id || l.account_id
                                                        }));
                                                        setShowRepaymentModal(true);
                                                    }}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition"
                                                >
                                                    <DollarSign className="w-3.5 h-3.5" /> Pay Back
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => handleOpenEdit(l)}
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition"
                                                title="Edit Borrow Details"
                                            >
                                                <Pencil className="w-3.5 h-3.5" /> Edit
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedLoan(l);
                                                    setShowDetailsModal(true);
                                                }}
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                                            >
                                                <Eye className="w-3.5 h-3.5 text-slate-400" /> Voucher
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleDelete(l._id)}
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition"
                                                title="Cancel & Revert Borrow"
                                            >
                                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredLoans.length === 0 && (
                    <div className="p-16 text-center text-slate-400 font-medium italic">
                        No borrowing records found.
                    </div>
                )}
            </div>

            {/* --- MODAL 1: CREATE & EDIT BORROW RECORD --- */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
                        <div className="bg-slate-900 text-white px-8 py-5 flex justify-between items-center">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <ArrowDownLeft className="w-5 h-5 text-indigo-400" />
                                {editingLoanId ? "Edit Borrowing Record" : "Receive Borrowed Funds / Loan"}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(false)}
                                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit} className="p-8 overflow-y-auto space-y-4">
                            <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">
                                    Lender / Source Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={borrowForm.lender_name}
                                    onChange={(e) => setBorrowForm({ ...borrowForm, lender_name: e.target.value })}
                                    placeholder="e.g. Sonali Bank / Karim Uddin"
                                    className="w-full bg-white border border-slate-300 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">
                                        Phone Number
                                    </label>
                                    <input
                                        type="text"
                                        value={borrowForm.phone}
                                        onChange={(e) => setBorrowForm({ ...borrowForm, phone: e.target.value })}
                                        placeholder="017xxxxxxxx"
                                        className="w-full bg-white border border-slate-300 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">
                                        Borrow Date
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={borrowForm.date}
                                        onChange={(e) => setBorrowForm({ ...borrowForm, date: e.target.value })}
                                        className="w-full bg-white border border-slate-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">
                                        Principal Amount (৳) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        step="any"
                                        value={borrowForm.amount}
                                        onChange={(e) => setBorrowForm({ ...borrowForm, amount: e.target.value })}
                                        placeholder="0.00"
                                        className="w-full bg-white border border-slate-300 rounded-lg py-2.5 px-3 text-base font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">
                                        Repayment Due Date (Optional)
                                    </label>
                                    <input
                                        type="date"
                                        value={borrowForm.due_date}
                                        onChange={(e) => setBorrowForm({ ...borrowForm, due_date: e.target.value })}
                                        className="w-full bg-white border border-slate-300 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* Receiving Deposit Account Selector */}
                            <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">
                                    Deposit Into Account <span className="text-red-500">*</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowPaymentModalForCreate(true)}
                                    className="w-full py-2.5 px-4 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 hover:bg-slate-100 transition flex justify-between items-center"
                                >
                                    <span className="text-xs uppercase text-slate-500 font-bold">Selected</span>
                                    <span className="font-semibold text-slate-900">
                                        {selectedCreateAccountObj
                                            ? `${selectedCreateAccountObj.name} (${selectedCreateAccountObj.type.toUpperCase()}) - ৳${selectedCreateAccountObj.balance}`
                                            : 'Select Account'}
                                    </span>
                                </button>
                            </div>

                            <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">
                                    Remarks / Terms / Interest Details
                                </label>
                                <textarea
                                    rows="2"
                                    value={borrowForm.remarks}
                                    onChange={(e) => setBorrowForm({ ...borrowForm, remarks: e.target.value })}
                                    placeholder="Interest rate, collateral notes, or repayment schedule..."
                                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="pt-4 border-t flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-5 py-2.5 text-slate-500 hover:bg-slate-100 rounded-xl font-bold text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !borrowForm.lender_name || !borrowForm.amount || !borrowForm.account_id}
                                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md transition disabled:bg-slate-300"
                                >
                                    {isSubmitting ? "Saving..." : editingLoanId ? "Update Borrowing" : "Confirm & Deposit"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL 2: PAY BACK LENDER (REPAYMENT) --- */}
            {showRepaymentModal && selectedLoan && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
                        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-indigo-400" /> Pay Back Lender
                            </h2>
                            <button
                                type="button"
                                onClick={() => setShowRepaymentModal(false)}
                                className="text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleRepaySubmit} className="p-6 space-y-4">
                            <div className="bg-slate-50 p-3.5 rounded-xl border text-sm">
                                <p className="text-slate-500">Lender: <b className="text-slate-900">{selectedLoan.lender_name}</b></p>
                                <p className="text-slate-500 mt-1">Outstanding Debt: <b className="text-amber-600">৳{selectedLoan.due_amount}</b></p>
                            </div>

                            <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">
                                    Repayment Amount (৳) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    max={selectedLoan.due_amount}
                                    step="any"
                                    value={repayForm.amount}
                                    onChange={(e) => setRepayForm({ ...repayForm, amount: e.target.value })}
                                    className="w-full bg-white border border-slate-300 rounded-lg py-2 px-3 text-lg font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">
                                    Withdraw From Account <span className="text-red-500">*</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowPaymentModalForRepay(true)}
                                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 hover:bg-slate-100 transition flex justify-between items-center"
                                >
                                    <span className="text-xs uppercase text-slate-500 font-bold">Selected</span>
                                    <span className="font-semibold text-slate-900">
                                        {selectedRepayAccountObj
                                            ? `${selectedRepayAccountObj.name} (${selectedRepayAccountObj.type.toUpperCase()})`
                                            : 'Select Account'}
                                    </span>
                                </button>
                            </div>

                            <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">
                                    Payment Notes
                                </label>
                                <input
                                    type="text"
                                    value={repayForm.notes}
                                    onChange={(e) => setRepayForm({ ...repayForm, notes: e.target.value })}
                                    placeholder="Cheque #, transaction ID, or cash receipt..."
                                    className="w-full bg-white border border-slate-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="pt-3 border-t flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowRepaymentModal(false)}
                                    className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-bold text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !repayForm.amount || !repayForm.account_id}
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm shadow transition disabled:bg-slate-300"
                                >
                                    {isSubmitting ? "Debiting..." : "Confirm Repayment"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL 3: VOUCHER / DETAILS --- */}
            {showDetailsModal && selectedLoan && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
                        <div className="bg-slate-900 text-white px-8 py-5 flex justify-between items-center no-print">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-400" /> Borrowing Voucher #{String(selectedLoan._id).slice(-8)}
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => window.print()}
                                    className="p-2 text-slate-300 hover:text-white rounded-lg transition"
                                >
                                    <Printer className="w-5 h-5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowDetailsModal(false)}
                                    className="p-2 text-slate-300 hover:text-white rounded-lg transition"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-8 space-y-6 overflow-y-auto print:p-0 text-sm">
                            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <div>
                                    <span className="text-xs font-bold text-slate-400 uppercase">Lender / Bank</span>
                                    <p className="font-bold text-slate-900 text-base">{selectedLoan.lender_name}</p>
                                    {selectedLoan.phone && <p className="text-xs text-slate-500 mt-1">Phone: {selectedLoan.phone}</p>}
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-bold text-slate-400 uppercase">Loan Received Date</span>
                                    <p className="font-bold text-slate-900">
                                        {selectedLoan.date ? format(new Date(selectedLoan.date), "dd MMMM yyyy") : "N/A"}
                                    </p>
                                    {selectedLoan.due_date && (
                                        <p className="text-xs text-rose-600 mt-1">Due Date: {format(new Date(selectedLoan.due_date), "dd MMM yyyy")}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 text-center bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase">Borrowed</p>
                                    <p className="text-lg font-bold text-slate-900">৳{selectedLoan.amount}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase">Repaid</p>
                                    <p className="text-lg font-bold text-emerald-600">৳{selectedLoan.repaid_amount || 0}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase">Remaining Debt</p>
                                    <p className="text-lg font-bold text-amber-600">৳{selectedLoan.due_amount}</p>
                                </div>
                            </div>

                            {/* Repayment History Ledger */}
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                                    Repayment History ({selectedLoan.repayment_history?.length || 0})
                                </h3>
                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
                                            <tr>
                                                <th className="p-3">Date</th>
                                                <th className="p-3 text-right">Repaid Amount (৳)</th>
                                                <th className="p-3">Method</th>
                                                <th className="p-3">Notes</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {(!selectedLoan.repayment_history || selectedLoan.repayment_history.length === 0) ? (
                                                <tr>
                                                    <td colSpan="4" className="p-4 text-center text-slate-400 italic">No repayments recorded yet.</td>
                                                </tr>
                                            ) : (
                                                selectedLoan.repayment_history.map((rh, i) => (
                                                    <tr key={i}>
                                                        <td className="p-3">{rh.date ? format(new Date(rh.date), "dd MMM yyyy") : "-"}</td>
                                                        <td className="p-3 text-right font-bold text-emerald-600">৳{rh.amount}</td>
                                                        <td className="p-3 uppercase text-xs">{rh.payment_method || "cash"}</td>
                                                        <td className="p-3 text-slate-500 text-xs">{rh.notes || "—"}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {selectedLoan.remarks && (
                                <div className="bg-slate-50 p-3.5 rounded-xl border text-xs text-slate-600">
                                    <b>Remarks / Terms:</b> {selectedLoan.remarks}
                                </div>
                            )}
                        </div>

                        <div className="bg-slate-50 px-8 py-4 border-t border-slate-200 flex justify-end gap-3 no-print">
                            <button
                                type="button"
                                onClick={() => setShowDetailsModal(false)}
                                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Modal for Disbursal Deposit */}
            <PaymentModal
                isOpen={showPaymentModalForCreate}
                onClose={() => setShowPaymentModalForCreate(false)}
                onSelectPayment={({ paymentMethod, accountId }) => {
                    setBorrowForm((prev) => ({ ...prev, payment_method: paymentMethod, account_id: accountId }));
                }}
                defaultPaymentMethod={borrowForm.payment_method}
                defaultSelectedAccount={borrowForm.account_id}
            />

            {/* Payment Modal for Repayment Withdrawal */}
            <PaymentModal
                isOpen={showPaymentModalForRepay}
                onClose={() => setShowPaymentModalForRepay(false)}
                onSelectPayment={({ paymentMethod, accountId }) => {
                    setRepayForm((prev) => ({ ...prev, payment_method: paymentMethod, account_id: accountId }));
                }}
                defaultPaymentMethod={repayForm.payment_method}
                defaultSelectedAccount={repayForm.account_id}
            />
        </div>
    );
};

export default BorrowMoney;