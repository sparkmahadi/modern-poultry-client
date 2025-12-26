import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import PurchaseDetailsModal from './PurchaseDetailsModal';

const ACCOUNTS_API = `${import.meta.env.VITE_API_BASE_URL}/api/payment_accounts`;

const UniversalPurchaseManager = ({
    fetchUrl = `${import.meta.env.VITE_API_BASE_URL}/api/purchases`,
    title = "Purchase Dashboard",
    context = "main"
}) => {
    const [purchases, setPurchases] = useState([]);
    const [purchase, setPurchase] = useState({});
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPurchase, setSelectedPurchase] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [selectedAccountId, setSelectedAccountId] = useState("");

    const navigate = useNavigate();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [pRes, aRes] = await Promise.all([
                axios.get(fetchUrl),
                axios.get(ACCOUNTS_API)
            ]);
            setPurchases(pRes.data.data || []);
            setAccounts(aRes.data.data || []);
        } catch (err) {
            toast.error('Sync failed.');
        } finally {
            setLoading(false);
        }
    }, [fetchUrl]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleExportExcel = () => {
        const data = purchases.map(p => ({
            Date: new Date(p.date).toLocaleDateString(),
            Supplier: p.supplier_id?.name || p.supplier_id || 'N/A',
            Total: p.total_amount,
            Paid: p.paid_amount,
            Due: p.total_amount - p.paid_amount,
            Method: p.payment_method
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Purchases");
        XLSX.writeFile(wb, `${title.replace(/\s+/g, '_')}.xlsx`);
    };

    const filteredPurchases = useMemo(() => {
        if (filter === 'due') return purchases.filter(p => (p.total_amount - p.paid_amount) > 0);
        if (filter === 'paid') return purchases.filter(p => (p.total_amount - p.paid_amount) <= 0);
        return purchases;
    }, [purchases, filter]);

    const stats = useMemo(() => {
        const total = purchases.reduce((sum, p) => sum + (p.total_amount || 0), 0);
        const paid = purchases.reduce((sum, p) => sum + (p.paid_amount || 0), 0);
        return { total, paid, due: total - paid };
    }, [purchases]);

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this purchase? This affects inventory.")) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/purchases/${id}`);
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
            const response = await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/api/purchases/pay/${selectedPurchase._id}`, {
                payAmount: pay,
                paymentAccountId: selectedAccountId
            });

            console.log(response);
            setPurchases(prev => prev.map(p => p._id === selectedPurchase._id ? response.data.data : p));
            toast.success("Payment recorded");
            setShowPaymentModal(false);
        } catch (err) {
            console.log(err);
            toast.error("Payment failed");
            toast.error(err.response.data.message);
        }
    };

    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const handleViewPurchaseDetails = (p) =>{
setPurchase(p);
    }

    const remainingDueOnSelected = selectedPurchase
        ? (selectedPurchase.total_amount - selectedPurchase.paid_amount)
        : 0;

    if (loading) return <div className="p-10 text-center animate-pulse text-orange-600 font-bold text-xl">Syncing Inventory...</div>;

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            {/* Header with Navigational Buttons */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-800">{title}</h1>
                    <p className="text-gray-500 text-sm">Managing {purchases.length} purchase records</p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {/* Universal Export & Create */}
                    <button onClick={handleExportExcel} className="bg-green-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-green-700 transition shadow-md">
                        📥 Excel
                    </button>

                    <button
                        onClick={() => navigate("/purchases/create")}
                        className="bg-orange-600 text-white px-5 py-2.5 rounded-lg font-bold shadow-lg hover:bg-orange-700 transition"
                    >
                        + New Purchase
                    </button>

                    {/* Dashboard Contextual Buttons */}
                    {context === "main" && (
                        <>
                            <button
                                onClick={() => navigate("/purchases/daily-purchases")}
                                className="bg-white text-gray-700 border border-gray-200 px-4 py-2.5 rounded-lg font-bold hover:bg-gray-50 transition"
                            >
                                📅 Daily Log
                            </button>
                            <button
                                onClick={() => navigate("/purchases/purchase-reports")}
                                className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-4 py-2.5 rounded-lg font-bold hover:bg-indigo-100 transition"
                            >
                                Purchase Audits
                            </button>
                        </>
                    )}

                    {/* Back button for reports/filtered views */}
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

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl border-l-4 border-blue-500 shadow-sm">
                    <p className="text-gray-400 text-xs font-bold uppercase">Total Cost</p>
                    <p className="text-2xl font-black text-gray-800">৳{stats.total.toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border-l-4 border-green-500 shadow-sm">
                    <p className="text-gray-400 text-xs font-bold uppercase">Settled</p>
                    <p className="text-2xl font-black text-green-600">৳{stats.paid.toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border-l-4 border-red-500 shadow-sm">
                    <p className="text-gray-400 text-xs font-bold uppercase">To Pay (Due)</p>
                    <p className="text-2xl font-black text-red-600">৳{stats.due.toLocaleString()}</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-xl mb-6 w-fit border border-gray-200">
                {['all', 'due', 'paid'].map((t) => (
                    <button
                        key={t}
                        onClick={() => setFilter(t)}
                        className={`px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all ${filter === t ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
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
                                    <td className="px-6 py-4 text-sm font-bold text-orange-600">
                                        {p.date ? format(new Date(p.date), "Pp") : "-"}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{p.supplier_id?.name || p.supplier_id || 'Walk-in'}</td>
                                    <td className="px-6 py-4 text-sm text-right font-bold text-gray-800">৳{p.total_amount.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-sm text-right text-green-600 font-semibold">৳{p.paid_amount.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${due > 0 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                                            {due > 0 ? `৳${due.toFixed(2)} Due` : 'Settled'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center space-x-3">
                                        {due > 0 && (
                                            <button onClick={() => handleOpenPayment(p)} className="text-emerald-600 hover:text-emerald-700 font-bold text-sm underline underline-offset-4">Pay</button>
                                        )}
                                        <Link to={`/purchases/edit/${p._id}`} className="text-indigo-500 hover:text-indigo-700 font-bold text-sm">Edit</Link>
                                        <button onClick={() => handleViewPurchaseDetails(p)} className="text-gray-400 hover:text-red-500 transition-colors">Details</button>
                                        <button onClick={() => handleDelete(p._id)} className="text-gray-400 hover:text-red-500 transition-colors">Delete</button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {filteredPurchases.length === 0 && <div className="p-20 text-center text-gray-400 font-medium italic">No matching records found.</div>}
            </div>

            {/* Payment Modal remains exactly as in your source... */}
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
                            className="w-full p-4 border-2 border-gray-100 rounded-2xl mb-6 focus:border-orange-500 outline-none text-xl font-bold transition-all"
                            placeholder="0.00"
                        />

                        <label className="text-xs font-bold uppercase text-gray-400 mb-2 block">Withdraw From</label>
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {accounts.map(acc => (
                                <button
                                    key={acc._id}
                                    onClick={() => setSelectedAccountId(acc._id)}
                                    className={`p-3 rounded-xl border-2 text-left transition-all ${selectedAccountId === acc._id ? 'border-orange-600 bg-orange-50/50' : 'border-gray-100 hover:border-gray-200'}`}
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
                                className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-bold shadow-lg shadow-orange-100 hover:bg-orange-700 disabled:opacity-30 transition-all"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add this at the bottom of your JSX */}
            <PurchaseDetailsModal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                purchaseData={purchase} // Use the state from your parent component
            />
        </div>
    );
};

export default UniversalPurchaseManager;