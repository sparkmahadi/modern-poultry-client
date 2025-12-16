import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router';
import { toast } from 'react-toastify';

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/purchases`;
const ACCOUNTS_API = `${import.meta.env.VITE_API_BASE_URL}/api/payment_accounts`;

const PurchaseManager = () => {
    // --- State Management ---
    const [purchases, setPurchases] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all' | 'due' | 'paid'
    
    // Payment Modal State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPurchase, setSelectedPurchase] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [selectedAccountId, setSelectedAccountId] = useState("");

    const navigate = useNavigate();

    // --- Data Fetching ---
    const fetchPurchases = useCallback(async () => {
        setLoading(true);
        try {
            // We fetch all, and filter on the frontend for a snappier UI, 
            // but you can also append ?type=due if your backend handles large data.
            const response = await axios.get(API_BASE_URL);
            setPurchases(response.data.data || []);
        } catch (err) {
            toast.error('Failed to load purchases.');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchAccounts = useCallback(async () => {
        try {
            const res = await axios.get(ACCOUNTS_API);
            setAccounts(res.data.data || []);
        } catch (err) {
            toast.error("Failed to load payment accounts");
        }
    }, []);

    useEffect(() => {
        fetchPurchases();
        fetchAccounts();
    }, [fetchPurchases, fetchAccounts]);

    // --- Filtering Logic ---
    const filteredPurchases = useMemo(() => {
        if (filter === 'due') return purchases.filter(p => (p.total_amount - p.paid_amount) > 0);
        if (filter === 'paid') return purchases.filter(p => (p.total_amount - p.paid_amount) <= 0);
        return purchases;
    }, [purchases, filter]);

    // --- Calculations ---
    const stats = useMemo(() => {
        const total = purchases.reduce((sum, p) => sum + (p.total_amount || 0), 0);
        const paid = purchases.reduce((sum, p) => sum + (p.paid_amount || 0), 0);
        return { total, paid, due: total - paid };
    }, [purchases]);

    const remainingDueOnSelected = selectedPurchase 
        ? (selectedPurchase.total_amount - selectedPurchase.paid_amount) 
        : 0;

    // --- Action Handlers ---
    const handleDelete = async (id) => {
        if (!window.confirm("Delete this purchase? This affects inventory.")) return;
        try {
            await axios.delete(`${API_BASE_URL}/${id}`);
            setPurchases(prev => prev.filter(p => p._id !== id));
            toast.success('Deleted successfully');
        } catch (err) {
            toast.error('Delete failed');
        }
    };

    const handleOpenPayment = (purchase) => {
        setSelectedPurchase(purchase);
        setPaymentAmount("");
        setSelectedAccountId("");
        setShowPaymentModal(true);
    };

    const handleSubmitPayment = async () => {
        const pay = Number(paymentAmount);
        if (!pay || pay <= 0 || pay > remainingDueOnSelected) return toast.error("Invalid amount");
        if (!selectedAccountId) return toast.error("Select an account");

        try {
            const response = await axios.patch(`${API_BASE_URL}/pay/${selectedPurchase._id}`, {
                payAmount: pay,
                paymentAccountId: selectedAccountId
            });
            // Update local state with the returned updated purchase
            setPurchases(prev => prev.map(p => p._id === selectedPurchase._id ? response.data.data : p));
            toast.success("Payment recorded");
            setShowPaymentModal(false);
        } catch (err) {
            toast.error("Payment failed");
        }
    };

    if (loading) return <div className="p-10 text-center text-xl animate-pulse">Synchronizing Data...</div>;

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            {/* Header & Navigation */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h1 className="text-3xl font-extrabold text-gray-800">Purchase Dashboard</h1>
                <div className="flex gap-2">
                    <Link to="/purchases/create" className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100">+ New Entry</Link>
                </div>
            </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl border-l-4 border-blue-500 shadow-sm">
                    <p className="text-gray-500 text-sm font-bold uppercase tracking-wider">Total Purchases</p>
                    <p className="text-3xl font-black text-gray-800">৳{stats.total.toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border-l-4 border-green-500 shadow-sm">
                    <p className="text-gray-500 text-sm font-bold uppercase tracking-wider">Total Paid</p>
                    <p className="text-3xl font-black text-green-600">৳{stats.paid.toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border-l-4 border-red-500 shadow-sm">
                    <p className="text-gray-500 text-sm font-bold uppercase tracking-wider">Remaining Due</p>
                    <p className="text-3xl font-black text-red-600">৳{stats.due.toLocaleString()}</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-xl mb-6 w-fit border border-gray-200">
                {['all', 'due', 'paid'].map((t) => (
                    <button
                        key={t}
                        onClick={() => setFilter(t)}
                        className={`px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all ${filter === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        {t} Records
                    </button>
                ))}
            </div>

            {/* Main Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Date</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Supplier</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase">Total</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase">Paid</th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase">Status</th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredPurchases.map((p) => {
                            const due = p.total_amount - p.paid_amount;
                            return (
                                <tr key={p._id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-700">{new Date(p.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{p.supplier_id || 'Walk-in'}</td>
                                    <td className="px-6 py-4 text-sm text-right font-bold">৳{p.total_amount.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-sm text-right text-green-600 font-semibold">৳{p.paid_amount.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-center">
                                        {due > 0 ? (
                                            <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-bold border border-red-100">৳{due.toFixed(2)} Due</span>
                                        ) : (
                                            <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-bold border border-green-100">Settled</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center space-x-3">
                                        {due > 0 && (
                                            <button onClick={() => handleOpenPayment(p)} className="text-red-500 hover:text-red-700 font-bold text-sm underline decoration-2 underline-offset-4">Pay</button>
                                        )}
                                        <Link to={`/purchases/edit/${p._id}`} className="text-indigo-500 hover:text-indigo-700 font-bold text-sm">Edit</Link>
                                        <button onClick={() => handleDelete(p._id)} className="text-gray-400 hover:text-red-500 transition-colors">&times;</button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {filteredPurchases.length === 0 && <div className="p-20 text-center text-gray-400 font-medium italic">No matching records found.</div>}
            </div>

            {/* Reusable Payment Modal*/}
            {showPaymentModal && selectedPurchase && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200">
                        <h2 className="text-2xl font-black text-gray-800 mb-2">Record Payment</h2>
                        <p className="text-gray-500 mb-6 text-sm">Settling debt for Purchase #{selectedPurchase._id.slice(-6)}</p>

                        <div className="space-y-3 bg-gray-50 p-4 rounded-2xl mb-6">
                            <div className="flex justify-between text-sm"><span className="text-gray-500">Total Purchase:</span><span className="font-bold">৳{selectedPurchase.total_amount}</span></div>
                            <div className="flex justify-between text-sm"><span className="text-gray-500">Outstanding Due:</span><span className="font-bold text-red-600">৳{remainingDueOnSelected}</span></div>
                        </div>

                        <label className="text-xs font-bold uppercase text-gray-400 mb-2 block">Payment Amount</label>
                        <input
                            type="number"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            className="w-full p-4 border-2 border-gray-100 rounded-2xl mb-6 focus:border-indigo-500 outline-none text-xl font-bold transition-all"
                            placeholder="0.00"
                        />

                        <label className="text-xs font-bold uppercase text-gray-400 mb-2 block">Withdraw From</label>
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {accounts.map(acc => (
                                <button
                                    key={acc._id}
                                    onClick={() => setSelectedAccountId(acc._id)}
                                    className={`p-3 rounded-xl border-2 text-left transition-all ${selectedAccountId === acc._id ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-100 hover:border-gray-200'}`}
                                >
                                    <p className="text-sm font-bold capitalize">{acc.type}</p>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Balance: ৳{acc.balance}</p>
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-4">
                            <button onClick={() => setShowPaymentModal(false)} className="flex-1 py-4 font-bold text-gray-400 hover:text-gray-600">Cancel</button>
                            <button 
                                onClick={handleSubmitPayment}
                                disabled={!selectedAccountId || !paymentAmount || paymentAmount > remainingDueOnSelected}
                                className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-30 transition-all"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PurchaseManager;