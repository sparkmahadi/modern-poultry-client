import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import TruckLoader from '../../components/Spinner/TruckLoader';

const BASE_API_URL = import.meta.env.VITE_API_BASE_URL;
const SALES_API = `${BASE_API_URL}/api/sales`;
const ACCOUNTS_API = `${BASE_API_URL}/api/payment_accounts`;

/**
 * @param {string} fetchUrl - The specific API endpoint to get data from
 * @param {string} title - The title to display (e.g., "Customer Sales", "Daily Report")
 * @param {boolean} showActions - Whether to show "New Sale" buttons
 */
const UniversalSalesManager = ({
    fetchUrl = SALES_API,
    title = "Sales Dashboard",
    context = "main" // New prop: "main", "customer", "daily", etc.
}) => {
    const navigate = useNavigate();

    // --- State ---
    const [memos, setMemos] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [expandedMemoId, setExpandedMemoId] = useState(null);

    // Modal State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedMemo, setSelectedMemo] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [selectedAccountId, setSelectedAccountId] = useState("");

    // --- Data Fetching ---
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [salesRes, accountsRes] = await Promise.all([
                axios.get(fetchUrl),
                axios.get(ACCOUNTS_API)
            ]);
            setMemos(salesRes.data.data || []);
            setAccounts(accountsRes.data.data || []);
        } catch (err) {
            toast.error('Failed to synchronize data.');
        } finally {
            setLoading(false);
        }
    }, [fetchUrl]); // Re-fetch if the URL changes

    useEffect(() => { fetchData(); }, [fetchData]);

    // --- Logic ---
    const filteredMemos = useMemo(() => {
        return memos.filter(m => {
            const due = m.due_amount || m.due || 0;
            if (filter === 'due') return due > 0;
            if (filter === 'paid') return due <= 0;
            return true;
        });
    }, [memos, filter]);

    const stats = useMemo(() => {
        return memos.reduce((acc, m) => ({
            total: acc.total + (m.total_amount || m.total || 0),
            paid: acc.paid + (m.paid_amount || m.paidAmount || 0),
            due: acc.due + (m.due_amount || m.due || 0),
        }), { total: 0, paid: 0, due: 0 });
    }, [memos]);

    // --- Action Handlers ---
    const handleOpenPayment = (memo) => {
        setSelectedMemo(memo);
        setPaymentAmount("");
        setSelectedAccountId("");
        setShowPaymentModal(true);
    };

    const handleSubmitPayment = async () => {
        const pay = Number(paymentAmount);
        const currentDue = selectedMemo?.due_amount || selectedMemo?.due || 0;

        if (!pay || pay <= 0 || pay > currentDue) return toast.error("Invalid amount");
        if (!selectedAccountId) return toast.error("Select receiving account");

        try {
            const response = await axios.patch(`${SALES_API}/receive-customer-due/${selectedMemo._id}`, {
                payAmount: pay,
                paymentAccountId: selectedAccountId
            });
            setMemos(prev => prev.map(m => m._id === selectedMemo._id ? response.data.data : m));
            toast.success("Collection recorded successfully");
            setShowPaymentModal(false);
        } catch (err) {
            toast.error("Payment collection failed");
        }
    };

    const handleDeleteSale = async (id) => {
        if (!window.confirm("Delete this record? This affects inventory.")) return;
        try {
            const result = await axios.delete(`${SALES_API}/${id}`);
            console.log(result);
            setMemos(prev => prev.filter(m => m._id !== id));
            toast.success('Deleted successfully');
        } catch (err) {
            toast.error('Delete failed');
        }
    };

    if (loading) return <TruckLoader/>;

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            {/* Header */}
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-800">{title}</h1>
                    <p className="text-gray-500 text-sm">Managing {memos.length} records in this view</p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {/* UNIVERSAL BUTTON: Always visible or based on context */}
                    <button 
                        onClick={() => navigate("/sales/create-sale")} 
                        className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold shadow-lg hover:bg-indigo-700 transition"
                    >
                        + New Sale
                    </button>

                    {/* CONDITIONAL BUTTONS: Only rendered on the "main" dashboard */}
                    {context === "main" && (
                        <>
                            <button 
                                onClick={() => navigate("/sales/daily-sales")} 
                                className="bg-white text-gray-700 border border-gray-200 px-4 py-2.5 rounded-lg font-bold hover:bg-gray-50 transition"
                            >
                                📅 Daily Sales
                            </button>
                            <button 
                                onClick={() => navigate("/sales/sales-reports")} 
                                className="bg-orange-50 text-orange-700 border border-orange-100 px-4 py-2.5 rounded-lg font-bold hover:bg-orange-100 transition"
                            >
                                Sales Reports
                            </button>
                        </>
                    )}

                    {/* BACK BUTTON: Useful for Customer/Report views */}
                    {context !== "main" && (
                        <button 
                            onClick={() => navigate(-1)} 
                            className="bg-gray-100 text-gray-600 px-4 py-2.5 rounded-lg font-bold hover:bg-gray-200 transition"
                        >
                            ← Back
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard label="Total Amount" value={stats.total} color="indigo" />
                <StatCard label="Total Collected" value={stats.paid} color="green" />
                <StatCard label="Total Receivables" value={stats.due} color="orange" />
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-xl mb-6 w-fit border border-gray-200">
                {['all', 'due', 'paid'].map((t) => (
                    <button
                        key={t}
                        onClick={() => setFilter(t)}
                        className={`px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all ${filter === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        {t} Memos
                    </button>
                ))}
            </div>

            {/* Main Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Date</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Memo No</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Customer</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase">Due</th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase">Status</th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredMemos.map((memo) => (
                            <TableRow
                                key={memo._id}
                                memo={memo}
                                isExpanded={expandedMemoId === memo._id}
                                onToggle={() => setExpandedMemoId(expandedMemoId === memo._id ? null : memo._id)}
                                onCollect={() => handleOpenPayment(memo)}
                                onView={() => navigate(`/sales/${memo._id}`)}
                                onDelete={() => handleDeleteSale(memo._id)}
                            />
                        ))}
                    </tbody>
                </table>
                {filteredMemos.length === 0 && <div className="p-20 text-center text-gray-400 font-medium italic">No matching records found.</div>}
            </div>

            {showPaymentModal && selectedMemo && (
                <PaymentModal
                    selectedMemo={selectedMemo}
                    paymentAmount={paymentAmount}
                    setPaymentAmount={setPaymentAmount}
                    accounts={accounts}
                    selectedAccountId={selectedAccountId}
                    setSelectedAccountId={setSelectedAccountId}
                    onClose={() => setShowPaymentModal(false)}
                    onSubmit={handleSubmitPayment}
                />
            )}
        </div>
    );
};

// --- Sub-Components (Keep these in the same file or separate UI file) ---

const StatCard = ({ label, value, color }) => (
    <div className={`bg-white p-6 rounded-2xl border-l-4 border-${color}-500 shadow-sm`}>
        <p className="text-gray-500 text-sm font-bold uppercase tracking-wider">{label}</p>
        <p className={`text-3xl font-black ${color === 'green' ? 'text-green-600' : color === 'orange' ? 'text-orange-600' : 'text-gray-800'}`}>
            ৳{value.toLocaleString()}
        </p>
    </div>
);

const TableRow = ({ memo, isExpanded, onToggle, onCollect, onView, onDelete }) => {
    const due = memo.due_amount || memo.due || 0;
    return (
        <>
            <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 text-sm font-bold text-indigo-600">{memo?.date ? format(new Date(memo.date), "Pp") : "-"}</td>
                <td className="px-6 py-4 text-sm font-bold text-indigo-600">{memo.memoNo}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-700">{memo.customer_id?.name || memo.customer_id || "Walking Customer"}</td>
                <td className="px-6 py-4 text-sm text-right font-black text-gray-800">৳{due.toFixed(2)}</td>
                <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${due > 0 ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                        {due > 0 ? 'Pending Due' : 'Fully Paid'}
                    </span>
                </td>
                <td className="px-6 py-4 text-center space-x-3">
                    <button onClick={onToggle} className="text-gray-400 hover:text-indigo-600 font-bold text-sm">{isExpanded ? 'Hide' : 'Items'}</button>
                    {due > 0 && <button onClick={onCollect} className="text-emerald-600 hover:text-emerald-700 font-bold text-sm underline underline-offset-4">Collect</button>}
                    <button onClick={onView} className="text-indigo-500 hover:text-indigo-700 font-bold text-sm">View</button>
                    <button onClick={onDelete} className="text-red-500 hover:text-red-700 font-bold text-sm">Delete</button>
                </td>
            </tr>
            {isExpanded && (
                <tr className="bg-indigo-50/30">
                    <td colSpan="6" className="px-12 py-4">
                        <div className="text-xs font-bold uppercase text-gray-400 mb-2">Item Breakdown</div>
                        {memo.products?.map((p, i) => (
                            <div key={i} className="flex justify-between text-sm py-1 border-b border-indigo-100/50 last:border-0">
                                <span className="text-gray-700">{p.item_name || p.name} <span className="text-gray-400">x{p.qty}</span></span>
                                <span className="font-medium text-gray-600">৳{(p.subtotal || 0).toFixed(2)}</span>
                            </div>
                        ))}
                    </td>
                </tr>
            )}
        </>
    );
};

const PaymentModal = ({ selectedMemo, paymentAmount, setPaymentAmount, accounts, selectedAccountId, setSelectedAccountId, onClose, onSubmit }) => {
    const due = selectedMemo.due_amount || selectedMemo.due || 0;
    const total = selectedMemo.total_amount || selectedMemo.total || 0;

    return (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md">
                <h2 className="text-2xl font-black text-gray-800 mb-2">Collect Payment</h2>
                <p className="text-gray-500 mb-6 text-sm">Memo #{selectedMemo.memoNo}</p>
                <div className="space-y-3 bg-gray-50 p-4 rounded-2xl mb-6">
                    <div className="flex justify-between text-sm"><span>Total:</span><span className="font-bold">৳{total}</span></div>
                    <div className="flex justify-between text-sm"><span>Remaining:</span><span className="font-bold text-orange-600">৳{due}</span></div>
                </div>
                <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="w-full p-4 border-2 border-gray-100 rounded-2xl mb-6 focus:border-indigo-500 outline-none text-xl font-bold" placeholder="0.00" />
                <div className="grid grid-cols-2 gap-3 mb-6">
                    {accounts.map(acc => (
                        <button key={acc._id} onClick={() => setSelectedAccountId(acc._id)} className={`p-3 rounded-xl border-2 text-left ${selectedAccountId === acc._id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100'}`}>
                            <p className="text-sm font-bold capitalize">{acc.type}</p>
                            <p className="text-[10px] text-gray-500">৳{acc.balance}</p>
                        </button>
                    ))}
                </div>
                <div className="flex gap-4">
                    <button onClick={onClose} className="flex-1 py-4 font-bold text-gray-400">Cancel</button>
                    <button onClick={onSubmit} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold">Confirm</button>
                </div>
            </div>
        </div>
    );
};

export default UniversalSalesManager;