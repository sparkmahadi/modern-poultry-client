import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { 
    ChevronLeft, 
    ChevronRight, 
    Download, 
    Plus, 
    Calendar, 
    Package, 
    FileSpreadsheet, 
    Trash2, 
    Eye, 
    Edit3,
    ArrowLeft
} from 'lucide-react';
import PurchaseDetailsModal from './PurchaseDetailsModal';
import TruckLoader from '../../components/Spinner/TruckLoader';

const ACCOUNTS_API = `${import.meta.env.VITE_API_BASE_URL}/api/payment_accounts`;

const UniversalPurchaseManager = ({
    fetchUrl = `${import.meta.env.VITE_API_BASE_URL}/api/purchases`,
    title = "Purchase Dashboard",
    context = "main"
}) => {
    const navigate = useNavigate();

    // Data States
    const [purchases, setPurchases] = useState([]);
    const [purchase, setPurchase] = useState({});
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'due', 'paid'

    // Server-Side Pagination States
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    // Modal States
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPurchase, setSelectedPurchase] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [selectedAccountId, setSelectedAccountId] = useState("");

    // --- Data Fetching with Query Merging ---
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Build URL with pagination and filter parameters
            const urlObj = new URL(fetchUrl, window.location.origin);
            urlObj.searchParams.set('page', page);
            urlObj.searchParams.set('limit', limit);
            if (filter === 'due') {
                urlObj.searchParams.set('type', 'due');
            }

            const [pRes, aRes] = await Promise.all([
                axios.get(urlObj.toString()),
                axios.get(ACCOUNTS_API)
            ]);

            const pData = pRes.data;
            setPurchases(pData.data || []);
            setAccounts(aRes.data?.data || []);

            // Read pagination metadata from server
            if (pData.pagination) {
                setTotalPages(pData.pagination.totalPages || 1);
                setTotalRecords(pData.pagination.total || 0);
            } else {
                setTotalRecords((pData.data || []).length);
                setTotalPages(1);
            }
        } catch (err) {
            console.error("Purchase sync error:", err);
            toast.error('Failed to load purchase records.');
        } finally {
            setLoading(false);
        }
    }, [fetchUrl, page, limit, filter]);

    useEffect(() => { 
        fetchData(); 
    }, [fetchData]);

    // Reset to page 1 on filter or limit changes
    const handleFilterChange = (newFilter) => {
        setFilter(newFilter);
        setPage(1);
    };

    const handleLimitChange = (e) => {
        setLimit(Number(e.target.value));
        setPage(1);
    };

    // --- Excel Export ---
    const handleExportExcel = () => {
        const data = purchases.flatMap(p => {
            if (!p.products || p.products.length === 0) {
                return [{
                    Date: p.date ? format(new Date(p.date), "yyyy-MM-dd") : 'N/A',
                    Supplier: p.supplier_name || 'Walk-in',
                    ProductName: 'No Products',
                    ProductID: 'N/A',
                    Unit: 'pcs',
                    Qty: 0,
                    Price: 0,
                    Subtotal: 0,
                    TotalOrder: p.total_amount || 0,
                    Paid: p.paid_amount || 0,
                    Due: (p.total_amount || 0) - (p.paid_amount || 0),
                    Method: p.payment_method || 'N/A'
                }];
            }

            return p.products.map(item => ({
                Date: p.date ? format(new Date(p.date), "yyyy-MM-dd") : 'N/A',
                Supplier: p.supplier_name || 'Walk-in',
                ProductName: item.name || 'N/A',
                ProductID: item.product_id?.$oid || item.product_id || 'N/A',
                Unit: item.unit || 'pcs',
                Qty: item.qty || 0,
                Price: item.purchase_price || 0,
                Subtotal: item.subtotal || 0,
                TotalOrder: p.total_amount || 0,
                Paid: p.paid_amount || 0,
                Due: (p.total_amount || 0) - (p.paid_amount || 0),
                Method: p.payment_method || 'N/A'
            }));
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Purchase Details");

        ws['!cols'] = Array(12).fill({ wch: 18 });
        XLSX.writeFile(wb, `${title.replace(/\s+/g, '_')}_Page_${page}.xlsx`);
    };

    // Client-side quick filter safety check
    const filteredPurchases = useMemo(() => {
        if (filter === 'due') return purchases.filter(p => (Number(p.total_amount) - Number(p.paid_amount)) > 0);
        if (filter === 'paid') return purchases.filter(p => (Number(p.total_amount) - Number(p.paid_amount)) <= 0);
        return purchases;
    }, [purchases, filter]);

    // Financial KPI Summary
    const stats = useMemo(() => {
        const total = purchases.reduce((sum, p) => sum + Number(p.total_amount || 0), 0);
        const paid = purchases.reduce((sum, p) => sum + Number(p.paid_amount || 0), 0);
        return { total, paid, due: total - paid };
    }, [purchases]);

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this purchase? This will restore stock to inventory and revert supplier accounts.")) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/purchases/${id}`);
            toast.success('Purchase deleted successfully');
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Delete operation failed.');
        }
    };

    const handleOpenPayment = (p) => {
        setSelectedPurchase(p);
        setPaymentAmount("");
        setSelectedAccountId("");
        setShowPaymentModal(true);
    };

    const handleSubmitPayment = async () => {
        const pay = Number(paymentAmount);
        if (!pay || pay <= 0 || pay > remainingDueOnSelected) return toast.error("Invalid payment amount");
        if (!selectedAccountId) return toast.error("Please select payment account");

        try {
            const response = await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/api/purchases/pay/${selectedPurchase._id}`, {
                payAmount: pay,
                paymentAccountId: selectedAccountId
            });

            if (response.data.success) {
                toast.success("Payment recorded successfully");
                setShowPaymentModal(false);
                fetchData();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Payment recording failed.");
        }
    };

    const handleViewPurchaseDetails = (p) => {
        setPurchase(p);
        setIsDetailOpen(true);
    };

    const remainingDueOnSelected = selectedPurchase
        ? (Number(selectedPurchase.total_amount || 0) - Number(selectedPurchase.paid_amount || 0))
        : 0;

    if (loading && purchases.length === 0) return <TruckLoader />;

    return (
        <div className="container mx-auto p-4 md:p-6 max-w-7xl font-sans text-slate-700 space-y-6">
            {/* Header Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white p-5 rounded-2xl shadow-sm">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                        {title}
                    </h1>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Total {totalRecords.toLocaleString()} transactions recorded
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <button 
                        onClick={handleExportExcel} 
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    >
                        <Download className="w-3.5 h-3.5" /> Export Excel
                    </button>

                    <button
                        onClick={() => navigate("/purchases/create")}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
                    >
                        <Plus className="w-3.5 h-3.5" /> New Purchase
                    </button>

                    {context === "main" && (
                        <>
                            <button
                                onClick={() => navigate("/purchases/daily-purchases")}
                                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                            >
                                <Calendar className="w-3.5 h-3.5" /> Daily Log
                            </button>
                            <button
                                onClick={() => navigate("/purchases/product-wise-purchases")}
                                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                            >
                                <Package className="w-3.5 h-3.5" /> Product-Wise
                            </button>
                            <button
                                onClick={() => navigate("/purchases/purchase-reports")}
                                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                            >
                                <FileSpreadsheet className="w-3.5 h-3.5" /> Audits
                            </button>
                        </>
                    )}

                    {context !== "main" && (
                        <button
                            onClick={() => navigate(-1)}
                            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" /> Back
                        </button>
                    )}
                </div>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Page Total Purchases</span>
                    <div className="mt-2">
                        <span className="text-2xl font-black font-mono text-slate-900">৳{stats.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>

                <div className="bg-emerald-50/50 border border-emerald-200 p-5 rounded-2xl flex flex-col justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Settled Disbursements</span>
                    <div className="mt-2">
                        <span className="text-2xl font-black font-mono text-emerald-700">৳{stats.paid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>

                <div className="bg-rose-50/50 border border-rose-200 p-5 rounded-2xl flex flex-col justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Pending Payables (Due)</span>
                    <div className="mt-2">
                        <span className="text-2xl font-black font-mono text-rose-600">৳{stats.due.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
            </div>

            {/* Filter Tabs & Limit Selector */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                    {['all', 'due', 'paid'].map((t) => (
                        <button
                            key={t}
                            onClick={() => handleFilterChange(t)}
                            className={`px-4 py-1.5 rounded-lg capitalize transition-all ${
                                filter === t ? 'bg-white text-blue-600 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            {t} Records
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <span>Rows per page:</span>
                    <select
                        value={limit}
                        onChange={handleLimitChange}
                        className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-bold outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>
            </div>

            {/* Main Purchases Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-4 py-3.5 w-12 text-center">#</th>
                                <th className="px-4 py-3.5">Date</th>
                                <th className="px-4 py-3.5">Supplier</th>
                                <th className="px-4 py-3.5 text-center">Items</th>
                                <th className="px-4 py-3.5 text-right">Total (৳)</th>
                                <th className="px-4 py-3.5 text-right">Paid (৳)</th>
                                <th className="px-4 py-3.5 text-center">Status</th>
                                <th className="px-4 py-3.5 text-center w-36">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredPurchases.map((p, idx) => {
                                const due = Number(p.total_amount || 0) - Number(p.paid_amount || 0);
                                const serial = (page - 1) * limit + idx + 1;

                                return (
                                    <tr key={p._id} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="px-4 py-3 text-center text-xs font-semibold text-slate-400">
                                            {serial}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-600 font-medium">
                                            {p.date ? format(new Date(p.date), "dd MMM yyyy, hh:mm a") : "-"}
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-slate-800">
                                            {p.supplier_name || 'Walk-in Vendor'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                                                {p.products?.length || 0}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                                            ৳{Number(p.total_amount || 0).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">
                                            ৳{Number(p.paid_amount || 0).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                due > 0 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                            }`}>
                                                {due > 0 ? `৳${due.toFixed(2)} Due` : 'Settled'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                {due > 0 && (
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleOpenPayment(p)} 
                                                        className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition"
                                                    >
                                                        Pay
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => handleViewPurchaseDetails(p)}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <Link 
                                                    to={`/purchases/edit/${p._id}`} 
                                                    className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition"
                                                    title="Edit Order"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </Link>
                                                <button 
                                                    type="button"
                                                    onClick={() => handleDelete(p._id)} 
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredPurchases.length === 0 && (
                    <div className="p-12 text-center text-slate-400 font-medium italic text-sm">
                        No purchase records matching this criteria.
                    </div>
                )}

                {/* Pagination Controls */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <span className="text-slate-500 font-medium">
                        Showing {totalRecords === 0 ? 0 : (page - 1) * limit + 1} to {Math.min(page * limit, totalRecords)} of {totalRecords} records
                    </span>

                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                            disabled={page <= 1}
                            className="p-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        {/* Page Pills */}
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                            .map((pNum, index, arr) => (
                                <React.Fragment key={pNum}>
                                    {index > 0 && arr[index - 1] !== pNum - 1 && (
                                        <span className="px-1 text-slate-400">...</span>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setPage(pNum)}
                                        className={`w-7 h-7 rounded-lg font-bold transition ${
                                            page === pNum
                                                ? 'bg-blue-600 text-white'
                                                : 'text-slate-600 hover:bg-white border border-slate-200'
                                        }`}
                                    >
                                        {pNum}
                                    </button>
                                </React.Fragment>
                            ))}

                        <button
                            type="button"
                            onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={page >= totalPages}
                            className="p-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Settle Payment Modal */}
            {showPaymentModal && selectedPurchase && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200">
                        <h2 className="text-lg font-bold text-slate-900 mb-1">Record Supplier Payment</h2>
                        <p className="text-xs text-slate-400 mb-4">
                            Settling debt for Purchase #{selectedPurchase._id.slice(-6)}
                        </p>

                        <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs mb-4">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Total Purchase:</span>
                                <span className="font-bold text-slate-800">৳{Number(selectedPurchase.total_amount).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Outstanding Due:</span>
                                <span className="font-bold text-rose-600 font-mono">৳{remainingDueOnSelected.toFixed(2)}</span>
                            </div>
                        </div>

                        <label className="text-[11px] font-bold uppercase text-slate-400 mb-1 block">Payment Amount (৳)</label>
                        <input
                            type="number"
                            min="0.01"
                            step="any"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            className="w-full p-2.5 border border-slate-200 rounded-xl mb-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-lg font-bold text-emerald-600"
                            placeholder="0.00"
                        />

                        <label className="text-[11px] font-bold uppercase text-slate-400 mb-1 block">Disbursement Account</label>
                        <div className="grid grid-cols-2 gap-2 mb-6 max-h-36 overflow-y-auto">
                            {accounts.map(acc => (
                                <button
                                    type="button"
                                    key={acc._id}
                                    onClick={() => setSelectedAccountId(acc._id)}
                                    className={`p-2.5 rounded-xl border text-left transition ${
                                        selectedAccountId === acc._id 
                                            ? 'border-blue-500 bg-blue-50 text-blue-900 font-bold' 
                                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                                    }`}
                                >
                                    <p className="text-xs font-bold capitalize">{acc.type}</p>
                                    <p className="text-[10px] text-slate-400 font-mono">Balance: ৳{acc.balance}</p>
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-2.5">
                            <button 
                                type="button" 
                                onClick={() => setShowPaymentModal(false)} 
                                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmitPayment}
                                disabled={!selectedAccountId || !paymentAmount || Number(paymentAmount) > remainingDueOnSelected}
                                className="flex-1 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-40 transition"
                            >
                                Confirm Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Purchase Details Modal */}
            <PurchaseDetailsModal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                purchaseData={purchase}
            />
        </div>
    );
};

export default UniversalPurchaseManager;