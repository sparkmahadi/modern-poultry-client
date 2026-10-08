import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { RotateCcw, Eye, Download, Plus, ArrowLeft, Pencil } from 'lucide-react';
import PurchaseReturnDetailsModal from './PurchaseReturnDetailsModal';
import TruckLoader from '../../../components/Spinner/TruckLoader';

const PurchaseReturnList = ({
    fetchUrl = `${import.meta.env.VITE_API_BASE_URL}/api/purchases/returns`,
    title = "Purchase Return Records",
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
            console.error("Failed to fetch purchase returns:", err);
            toast.error('Failed to load return records.');
        } finally {
            setLoading(false);
        }
    }, [fetchUrl]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Excel Export ---
    const handleExportExcel = () => {
        const data = returns.flatMap((r) => {
            if (!r.products || r.products.length === 0) {
                return [{
                    ReturnID: r._id,
                    Date: r.date ? format(new Date(r.date), "yyyy-MM-dd") : 'N/A',
                    Supplier: r.supplier_name || 'N/A',
                    ProductName: 'No Products',
                    Qty: 0,
                    Unit: 'N/A',
                    Price: 0,
                    Subtotal: 0,
                    Reason: 'N/A',
                    RefundReceived: r.refund_received || 0,
                    TotalReturn: r.total_return_amount || 0,
                    Note: r.note || ''
                }];
            }

            return r.products.map((item) => ({
                ReturnID: r._id,
                Date: r.date ? format(new Date(r.date), "yyyy-MM-dd") : 'N/A',
                Supplier: r.supplier_name || 'N/A',
                ProductName: item.name || 'N/A',
                Qty: item.qty || 0,
                Unit: item.unit || 'pcs',
                Price: item.return_price || item.purchase_price || 0,
                Subtotal: item.subtotal || 0,
                Reason: item.reason || 'N/A',
                RefundReceived: r.refund_received || 0,
                TotalReturn: r.total_return_amount || 0,
                Note: r.note || ''
            }));
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Returns");

        ws['!cols'] = Array(12).fill({ wch: 18 });
        XLSX.writeFile(wb, `${title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
    };

    // --- Filters ---
    const filteredReturns = useMemo(() => {
        if (filter === 'refunded') return returns.filter((r) => Number(r.refund_received || 0) > 0);
        if (filter === 'credit') return returns.filter((r) => Number(r.refund_received || 0) <= 0);
        return returns;
    }, [returns, filter]);

    // --- Summary Stats ---
    const stats = useMemo(() => {
        const total = returns.reduce((sum, r) => sum + (Number(r.total_return_amount) || 0), 0);
        const refund = returns.reduce((sum, r) => sum + (Number(r.refund_received) || 0), 0);
        const creditAdjusted = total - refund;
        return { total, refund, creditAdjusted };
    }, [returns]);

    const handleViewDetails = (record) => {
        setSelectedReturn(record);
        setIsDetailOpen(true);
    };

    if (loading) return <TruckLoader />;

    return (
        <div className="container mx-auto p-6 max-w-7xl font-sans text-slate-700">
            {/* Header with Navigation to /purchase-return/add */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <span className="p-2 bg-rose-100 text-rose-600 rounded-xl">
                            <RotateCcw className="w-6 h-6" />
                        </span>
                        {title}
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Managing {returns.length} returned inventory transactions</p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition shadow-sm"
                    >
                        <Download className="w-4 h-4" /> Export Excel
                    </button>

                    {/* Navigates to /purchase-return/add */}
                    <button
                        onClick={() => navigate("/purchase-return/add")}
                        className="flex items-center gap-2 bg-rose-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:bg-rose-700 transition"
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
                <div className="bg-white p-6 rounded-2xl border-l-4 border-rose-500 shadow-sm border border-slate-100">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Return Value</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">৳{stats.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border-l-4 border-emerald-500 shadow-sm border border-slate-100">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Cash / Bank Refund Recv</p>
                    <p className="text-2xl font-black text-emerald-600 mt-1">৳{stats.refund.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border-l-4 border-blue-500 shadow-sm border border-slate-100">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Adjusted Due Credit</p>
                    <p className="text-2xl font-black text-blue-600 mt-1">৳{stats.creditAdjusted.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-6 w-fit border border-slate-200">
                {[
                    { id: 'all', label: 'All Records' },
                    { id: 'refunded', label: 'Cash Refunded' },
                    { id: 'credit', label: 'On Due Credit' }
                ].map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setFilter(t.id)}
                        className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                            filter === t.id
                                ? 'bg-white text-rose-600 shadow-sm'
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
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Supplier</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Items</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Return Value</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Refund Recv</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Settlement</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredReturns.map((r, idx) => {
                                const isCashRefund = Number(r.refund_received || 0) > 0;
                                return (
                                    <tr key={r._id} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="px-6 py-4 text-sm font-bold text-slate-400">{idx + 1}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-800">
                                            {r.date ? format(new Date(r.date), "dd MMM yyyy, p") : "-"}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                                            {r.supplier_name || 'N/A'}
                                            {r.supplier_phone && <span className="text-xs text-slate-400 block font-normal">{r.supplier_phone}</span>}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-center font-medium text-slate-600">
                                            {r.products?.length || 0}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right font-bold text-rose-600">
                                            ৳{Number(r.total_return_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right font-semibold text-emerald-600">
                                            ৳{Number(r.refund_received || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                                isCashRefund
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                            }`}>
                                                {isCashRefund ? 'Refund Collected' : 'Adjusted In Due'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center space-x-2 whitespace-nowrap">
                                            {/* Link to Edit/View Route /purchase-return/:id */}
                                            <Link
                                                to={`/purchase-return/${r._id}`}
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition"
                                            >
                                                <Pencil className="w-3.5 h-3.5" /> View/Edit
                                            </Link>

                                            {/* Quick Preview Modal */}
                                            <button
                                                type="button"
                                                onClick={() => handleViewDetails(r)}
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                                            >
                                                <Eye className="w-3.5 h-3.5 text-slate-400" /> Voucher
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
                        No purchase return records found.
                    </div>
                )}
            </div>

            {/* Modal for viewing voucher details */}
            <PurchaseReturnDetailsModal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                returnData={selectedReturn}
            />
        </div>
    );
};

export default PurchaseReturnList;