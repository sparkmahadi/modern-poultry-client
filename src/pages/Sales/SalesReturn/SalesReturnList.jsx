import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { CornerUpLeft, Eye, Download, Plus, ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import SalesReturnDetailsModal from './SalesReturnDetailsModal';
import TruckLoader from '../../../components/Spinner/TruckLoader';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const SalesReturnList = ({
    fetchUrl = `${API_BASE_URL}/api/sales/returns`,
    title = "Sales Return Records",
    context = "main"
}) => {
    const [returns, setReturns] = useState([]);
    const [selectedReturn, setSelectedReturn] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    const navigate = useNavigate();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get(fetchUrl);
            setReturns(res.data?.data || []);
        } catch (err) {
            console.error("Failed to fetch sales returns:", err);
            toast.error('Failed to load sales return records.');
        } finally {
            setLoading(false);
        }
    }, [fetchUrl]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Delete / Cancel Return Record ---
    const handleDelete = async (id) => {
        if (!window.confirm("Cancel and delete this sales return record? This will revert inventory stock and restore customer balances.")) {
            return;
        }

        try {
            const res = await axios.delete(`${API_BASE_URL}/api/sales/returns/${id}`);
            if (res.data?.success) {
                toast.success(res.data.message || "Sales return deleted successfully");
                setReturns((prev) => prev.filter((r) => r._id !== id));
            } else {
                toast.info(res.data?.message || "Could not delete record");
            }
        } catch (err) {
            console.error("Delete sales return failed:", err);
            toast.error(err.response?.data?.message || "Failed to delete return record");
        }
    };

    // --- Excel Export ---
    const handleExportExcel = () => {
        const data = returns.flatMap((r) => {
            if (!r.products || r.products.length === 0) {
                return [{
                    ReturnID: r._id,
                    Date: r.date ? format(new Date(r.date), "yyyy-MM-dd") : 'N/A',
                    Customer: r.customer_name || 'Walk-in',
                    OriginalMemo: r.original_memo_no || 'N/A',
                    ProductName: 'No Products',
                    Qty: 0,
                    Price: 0,
                    Subtotal: 0,
                    Reason: 'N/A',
                    RefundPaid: r.refund_amount || 0,
                    TotalReturn: r.total_return_amount || 0,
                    Notes: r.notes || ''
                }];
            }

            return r.products.map((item) => ({
                ReturnID: r._id,
                Date: r.date ? format(new Date(r.date), "yyyy-MM-dd") : 'N/A',
                Customer: r.customer_name || 'Walk-in',
                OriginalMemo: r.original_memo_no || 'N/A',
                ProductName: item.name || 'N/A',
                Qty: item.qty || 0,
                Price: item.return_price || item.sale_price || 0,
                Subtotal: item.subtotal || 0,
                Reason: item.reason || 'N/A',
                RefundPaid: r.refund_amount || 0,
                TotalReturn: r.total_return_amount || 0,
                Notes: r.notes || ''
            }));
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sales Returns");

        ws['!cols'] = Array(12).fill({ wch: 18 });
        XLSX.writeFile(wb, `${title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
    };

    const filteredReturns = useMemo(() => {
        if (filter === 'refunded') return returns.filter((r) => Number(r.refund_amount || 0) > 0);
        if (filter === 'due_adjusted') return returns.filter((r) => Number(r.refund_amount || 0) <= 0);
        return returns;
    }, [returns, filter]);

    const stats = useMemo(() => {
        const total = returns.reduce((sum, r) => sum + (Number(r.total_return_amount) || 0), 0);
        const refundPaid = returns.reduce((sum, r) => sum + (Number(r.refund_amount) || 0), 0);
        const dueAdjusted = total - refundPaid;
        return { total, refundPaid, dueAdjusted };
    }, [returns]);

    const handleViewDetails = (record) => {
        setSelectedReturn(record);
        setIsDetailOpen(true);
    };

    if (loading) return <TruckLoader />;

    return (
        <div className="container mx-auto p-6 max-w-7xl font-sans text-slate-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <span className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                            <CornerUpLeft className="w-6 h-6" />
                        </span>
                        {title}
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Managing {returns.length} customer return vouchers</p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition shadow-sm"
                    >
                        <Download className="w-4 h-4" /> Export Excel
                    </button>

                    <button
                        onClick={() => navigate("/sales-return/add")}
                        className="flex items-center gap-2 bg-amber-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:bg-amber-700 transition"
                    >
                        <Plus className="w-4 h-4" /> New Return Note
                    </button>

                    {context !== "main" && (
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-200 transition"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl border-l-4 border-amber-500 shadow-sm border border-slate-100">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Return Value</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">৳{stats.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border-l-4 border-red-500 shadow-sm border border-slate-100">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Cash Refund Disbursed</p>
                    <p className="text-2xl font-black text-red-600 mt-1">৳{stats.refundPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border-l-4 border-emerald-500 shadow-sm border border-slate-100">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Receivable Due Deducted</p>
                    <p className="text-2xl font-black text-emerald-600 mt-1">৳{stats.dueAdjusted.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-6 w-fit border border-slate-200">
                {[
                    { id: 'all', label: 'All Records' },
                    { id: 'refunded', label: 'Refund Disbursed' },
                    { id: 'due_adjusted', label: 'Deducted from Due' }
                ].map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setFilter(t.id)}
                        className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                            filter === t.id
                                ? 'bg-white text-amber-700 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">SL</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Items</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Return Value</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Refund Paid</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Settlement</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredReturns.map((r, idx) => {
                                const isRefundPaid = Number(r.refund_amount || 0) > 0;
                                return (
                                    <tr key={r._id} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="px-6 py-4 text-sm font-bold text-slate-400">{idx + 1}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-800">
                                            {r.date ? format(new Date(r.date), "dd MMM yyyy, p") : "-"}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                                            {r.customer_name || 'Walk-in'}
                                            {r.customer_phone && <span className="text-xs text-slate-400 block font-normal">{r.customer_phone}</span>}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-center font-medium text-slate-600">
                                            {r.products?.length || 0}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right font-bold text-amber-600">
                                            ৳{Number(r.total_return_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right font-semibold text-red-600">
                                            ৳{Number(r.refund_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                                isRefundPaid
                                                    ? 'bg-red-50 text-red-700 border-red-200'
                                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            }`}>
                                                {isRefundPaid ? 'Cash Refunded' : 'Deducted From Due'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center space-x-2 whitespace-nowrap">
                                            <Link
                                                to={`/sales-return/${r._id}`}
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition"
                                            >
                                                <Pencil className="w-3.5 h-3.5" /> Edit
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => handleViewDetails(r)}
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                                            >
                                                <Eye className="w-3.5 h-3.5 text-slate-400" /> Voucher
                                            </button>
                                            {/* Delete Button */}
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(r._id)}
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:text-red-800 hover:bg-red-50 transition"
                                                title="Cancel & Delete Return"
                                            >
                                                <Trash2 className="w-3.5 h-3.5 text-red-500" /> Delete
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredReturns.length === 0 && (
                    <div className="p-16 text-center text-slate-400 font-medium italic">
                        No sales return records found.
                    </div>
                )}
            </div>

            <SalesReturnDetailsModal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                returnData={selectedReturn}
            />
        </div>
    );
};

export default SalesReturnList; 