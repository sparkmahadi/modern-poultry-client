import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import {
    AlertTriangle,
    Trash2,
    Search,
    Calendar,
    Download,
    Plus,
    X,
    Eye,
    Layers,
    FileText,
    Printer
} from 'lucide-react';
import TruckLoader from '../../components/Spinner/TruckLoader';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const DISPOSAL_REASONS = [
    "Mortality (Death)",
    "Expired Feed / Medicine",
    "Damaged Goods / Broken",
    "Egg Breakage",
    "Disease Culling",
    "Substandard / Growth Failure",
    "Other"
];

const DisposeProducts = () => {
    // --- Data Lists ---
    const [disposals, setDisposals] = useState([]);
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- Modal States ---
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedDisposal, setSelectedDisposal] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    // --- Create Form States ---
    const [selectedBatchId, setSelectedBatchId] = useState("");
    const [dateTime, setDateTime] = useState("");
    const [notes, setNotes] = useState("");
    const [products, setProducts] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Product Search Inside Modal ---
    const [productSearch, setProductSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [productSearchLoading, setProductSearchLoading] = useState(false);
    const [showProductResults, setShowProductResults] = useState(false);
    const productRef = useRef(null);

    // Fetch records and batches on mount
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [dispRes, batchRes] = await Promise.allSettled([
                axios.get(`${API_BASE_URL}/api/dispose-products`),
                axios.get(`${API_BASE_URL}/api/farming-batches`)
            ]);

            if (dispRes.status === "fulfilled") {
                setDisposals(dispRes.value.data?.data || []);
            }
            if (batchRes.status === "fulfilled") {
                setBatches(batchRes.value.data?.data || []);
            }
        } catch (err) {
            console.error("Error loading disposal data:", err);
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
        setDateTime(local);
    }, [fetchData]);

    // Close product search dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (productRef.current && !productRef.current.contains(e.target)) {
                setShowProductResults(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Product search inside creation modal
    const handleProductSearch = async (e) => {
        const query = e.target.value;
        setProductSearch(query);

        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setProductSearchLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/products/search?q=${encodeURIComponent(query)}`);
            setSearchResults(res.data?.data || []);
        } catch (err) {
            console.error("Product search failed:", err);
            setSearchResults([]);
        } finally {
            setProductSearchLoading(false);
        }
    };

    const addProductToDisposal = async (p) => {
        const exists = products.find((item) => item._id === p._id);
        if (exists) {
            toast.warn("Product is already added.");
            return;
        }

        let currentStock = 0;
        try {
            const res = await axios.get(`${API_BASE_URL}/api/inventory/stock/${p._id}`);
            currentStock = res.data?.stock || 0;
        } catch (err) {
            console.warn("Stock fetch failed:", err);
        }

        const cost = Number(p.purchase_price || p.price || 0);
        setProducts((prev) => [
            ...prev,
            {
                _id: p._id,
                item_name: p.item_name || p.name,
                unit: p.unit || "pcs",
                qty: 1,
                cost_price: cost,
                subtotal: cost,
                availableStock: currentStock,
                reason: DISPOSAL_REASONS[0]
            }
        ]);

        setProductSearch("");
        setSearchResults([]);
        setShowProductResults(false);
    };

    const updateProductField = (index, field, value) => {
        const updated = [...products];
        const numeric = (field === "qty" || field === "cost_price") ? Number(value || 0) : value;
        updated[index][field] = numeric;
        if (field === "qty" || field === "cost_price") {
            updated[index].subtotal = Number((updated[index].qty * updated[index].cost_price).toFixed(2));
        }
        setProducts(updated);
    };

    const removeProduct = (index) => {
        setProducts((prev) => prev.filter((_, i) => i !== index));
    };

    // Summary calculations
    const totalEstimatedLoss = useMemo(() => {
        return products.reduce((sum, p) => sum + (Number(p.subtotal || 0)), 0);
    }, [products]);

    const stats = useMemo(() => {
        const totalLoss = disposals.reduce((sum, d) => sum + Number(d.total_loss_amount || 0), 0);
        const totalItems = disposals.reduce((sum, d) => sum + Number(d.total_qty || 0), 0);
        return { totalLoss, totalItems, count: disposals.length };
    }, [disposals]);

    // Handle Create Submission
    const handleCreateSubmit = async (e) => {
        e.preventDefault();

        if (products.length === 0) {
            return toast.warning("Add at least one item to write off.");
        }

        setIsSubmitting(true);
        try {
            const payload = {
                batch_id: selectedBatchId || null,
                date: new Date(dateTime).toISOString(),
                total_loss_amount: totalEstimatedLoss,
                notes,
                products: products.map((p) => ({
                    product_id: p._id,
                    name: p.item_name,
                    unit: p.unit,
                    qty: Number(p.qty),
                    cost_price: Number(p.cost_price),
                    subtotal: Number(p.subtotal),
                    reason: p.reason
                }))
            };

            const res = await axios.post(`${API_BASE_URL}/api/dispose-products`, payload);
            if (res.data?.success) {
                toast.success("Disposal recorded & stock deducted successfully!");
                setShowCreateModal(false);
                setProducts([]);
                setNotes("");
                setSelectedBatchId("");
                fetchData();
            } else {
                toast.info(res.data?.message || "Operation completed.");
            }
        } catch (err) {
            console.error("Disposal failed:", err);
            toast.error(err.response?.data?.message || "Failed to record disposal.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle Delete / Cancel
    const handleDelete = async (id) => {
        if (!window.confirm("Cancel this disposal record? This will restore the deducted inventory items.")) {
            return;
        }

        try {
            const res = await axios.delete(`${API_BASE_URL}/api/dispose-products/${id}`);
            if (res.data?.success) {
                toast.success(res.data.message || "Disposal cancelled & stock restored.");
                setDisposals((prev) => prev.filter((d) => d._id !== id));
            }
        } catch (err) {
            console.error("Delete failed:", err);
            toast.error(err.response?.data?.message || "Failed to cancel disposal.");
        }
    };

    // Excel Export
    const handleExportExcel = () => {
        const data = disposals.flatMap((d) => {
            if (!d.products || d.products.length === 0) {
                return [{
                    DisposalID: d._id,
                    Date: d.date ? format(new Date(d.date), "yyyy-MM-dd") : "N/A",
                    Batch: d.batch_name || "General Stock",
                    Product: "No Items",
                    Qty: 0,
                    Unit: "N/A",
                    Cost: 0,
                    LossAmount: 0,
                    Reason: "N/A",
                    Notes: d.notes || ""
                }];
            }
            return d.products.map((item) => ({
                DisposalID: d._id,
                Date: d.date ? format(new Date(d.date), "yyyy-MM-dd") : "N/A",
                Batch: d.batch_name || "General Stock",
                Product: item.name || "N/A",
                Qty: item.qty || 0,
                Unit: item.unit || "pcs",
                Cost: item.cost_price || 0,
                LossAmount: item.subtotal || 0,
                Reason: item.reason || "N/A",
                Notes: d.notes || ""
            }));
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Disposals");
        XLSX.writeFile(wb, `Disposed_Products_${format(new Date(), "yyyyMMdd")}.xlsx`);
    };

    if (loading) return <TruckLoader />;

    return (
        <div className="container mx-auto p-6 max-w-7xl font-sans text-slate-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <span className="p-2 bg-red-100 text-red-600 rounded-xl">
                            <AlertTriangle className="w-6 h-6" />
                        </span>
                        Inventory Disposal & Mortality
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Track bird mortality, broken eggs, damaged goods & stock write-offs
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
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:bg-red-700 transition text-sm"
                    >
                        <Plus className="w-4 h-4" /> Record New Disposal
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl border-l-4 border-red-500 shadow-sm border border-slate-100">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Loss Value</p>
                    <p className="text-2xl font-black text-red-600 mt-1">
                        ৳{stats.totalLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-2xl border-l-4 border-amber-500 shadow-sm border border-slate-100">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Units Disposed</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">
                        {stats.totalItems.toLocaleString()} units
                    </p>
                </div>
                <div className="bg-white p-6 rounded-2xl border-l-4 border-slate-500 shadow-sm border border-slate-100">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Incidents Recorded</p>
                    <p className="text-2xl font-black text-slate-700 mt-1">
                        {stats.count} records
                    </p>
                </div>
            </div>

            {/* Disposals Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">SL</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Farm Batch</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Items Count</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Loss Value</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Notes</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {disposals.map((d, idx) => (
                                <tr key={d._id} className="hover:bg-slate-50/70 transition-colors">
                                    <td className="px-6 py-4 text-sm font-bold text-slate-400">{idx + 1}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-800">
                                        {d.date ? format(new Date(d.date), "dd MMM yyyy, p") : "-"}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                                        {d.batch_name ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                                <Layers className="w-3 h-3" /> {d.batch_name}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 text-xs italic">General Inventory</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-center font-bold text-slate-700">
                                        {d.products?.length || 0}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-right font-bold text-red-600">
                                        ৳{Number(d.total_loss_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">
                                        {d.notes || "—"}
                                    </td>
                                    <td className="px-6 py-4 text-center space-x-2 whitespace-nowrap">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedDisposal(d);
                                                setShowDetailsModal(true);
                                            }}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                                        >
                                            <Eye className="w-3.5 h-3.5 text-slate-400" /> Voucher
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(d._id)}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:text-red-800 hover:bg-red-50 transition"
                                        >
                                            <Trash2 className="w-3.5 h-3.5 text-red-500" /> Cancel
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {disposals.length === 0 && (
                    <div className="p-16 text-center text-slate-400 font-medium italic">
                        No disposal records found. Click "Record New Disposal" to add.
                    </div>
                )}
            </div>

            {/* --- CREATE DISPOSAL MODAL --- */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
                        <div className="bg-slate-900 text-white px-8 py-5 flex justify-between items-center">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-500" /> New Disposal / Mortality Entry
                            </h2>
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(false)}
                                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
                            {/* Meta Options */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">
                                        Incident Date & Time
                                    </label>
                                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-300">
                                        <Calendar className="w-4 h-4 text-slate-400" />
                                        <input
                                            type="datetime-local"
                                            value={dateTime}
                                            onChange={(e) => setDateTime(e.target.value)}
                                            className="bg-transparent text-sm w-full focus:outline-none"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">
                                        Assign to Farm Batch (Optional)
                                    </label>
                                    <select
                                        value={selectedBatchId}
                                        onChange={(e) => setSelectedBatchId(e.target.value)}
                                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    >
                                        <option value="">-- General Stock (No Batch) --</option>
                                        {batches.map((b) => (
                                            <option key={b._id} value={b._id}>
                                                {b.batch_name || b.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Product Search */}
                            <div className="relative" ref={productRef}>
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">
                                    Search Product From Inventory
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={productSearch}
                                        onFocus={() => setShowProductResults(true)}
                                        onChange={(e) => {
                                            handleProductSearch(e);
                                            setShowProductResults(true);
                                        }}
                                        placeholder="Type item name to dispose (e.g. Broiler Chick, Feed 50kg)..."
                                        className="w-full bg-white border border-slate-300 rounded-lg py-2.5 pl-4 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-red-400"
                                    />
                                    <div className="absolute right-3 top-3">
                                        {productSearchLoading ? (
                                            <div className="animate-spin h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full" />
                                        ) : (
                                            <Search className="w-4 h-4 text-slate-400" />
                                        )}
                                    </div>
                                </div>

                                {showProductResults && searchResults.length > 0 && (
                                    <ul className="absolute left-0 right-0 z-50 bg-white border border-slate-300 rounded-lg shadow-xl mt-1 max-h-60 overflow-y-auto divide-y divide-slate-100">
                                        {searchResults.map((p) => (
                                            <li
                                                key={p._id}
                                                onClick={() => addProductToDisposal(p)}
                                                className="p-3.5 hover:bg-red-50/50 cursor-pointer flex justify-between items-center transition"
                                            >
                                                <div>
                                                    <p className="font-semibold text-slate-800 text-sm">{p.item_name}</p>
                                                    <p className="text-xs text-slate-400">Unit: {p.unit || 'pcs'}</p>
                                                </div>
                                                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">
                                                    Cost: ৳{Number(p.purchase_price || p.price || 0).toFixed(2)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* Line Items Table */}
                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase">
                                        <tr>
                                            <th className="px-4 py-3">Product</th>
                                            <th className="px-4 py-3 text-center w-24">Curr Stock</th>
                                            <th className="px-4 py-3 text-center w-28">Disposed Qty</th>
                                            <th className="px-4 py-3 text-right w-28">Unit Cost (৳)</th>
                                            <th className="px-4 py-3 text-left w-44">Disposal Reason</th>
                                            <th className="px-4 py-3 text-right w-28">Subtotal</th>
                                            <th className="px-2 py-3 text-center w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {products.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="text-center py-8 text-slate-400 italic">
                                                    No products added. Search above to add items to write off.
                                                </td>
                                            </tr>
                                        ) : (
                                            products.map((p, index) => (
                                                <tr key={index} className="hover:bg-slate-50/50">
                                                    <td className="px-4 py-3 font-medium text-slate-800">
                                                        {p.item_name}
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-bold text-slate-500">
                                                        {p.availableStock}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="number"
                                                            min="0.01"
                                                            step="any"
                                                            value={p.qty}
                                                            onChange={(e) => updateProductField(index, "qty", e.target.value)}
                                                            className="w-full border border-slate-200 rounded py-1 px-2 text-center text-sm focus:outline-none focus:border-red-400"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="any"
                                                            value={p.cost_price}
                                                            onChange={(e) => updateProductField(index, "cost_price", e.target.value)}
                                                            className="w-full border border-slate-200 rounded py-1 px-2 text-right text-sm focus:outline-none focus:border-red-400"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <select
                                                            value={p.reason}
                                                            onChange={(e) => updateProductField(index, "reason", e.target.value)}
                                                            className="w-full border border-slate-200 rounded py-1 px-2 text-xs focus:outline-none"
                                                        >
                                                            {DISPOSAL_REASONS.map((r) => (
                                                                <option key={r} value={r}>{r}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-bold text-red-600">
                                                        ৳{Number(p.subtotal || 0).toFixed(2)}
                                                    </td>
                                                    <td className="px-2 py-3 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeProduct(index)}
                                                            className="text-slate-300 hover:text-red-600 transition"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Remarks */}
                            <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">
                                    Incident Notes / Veterinary Remarks
                                </label>
                                <textarea
                                    rows="2"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Explain death cause, culling reasons, or attach inspection notes..."
                                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
                                />
                            </div>

                            {/* Summary & Submit */}
                            <div className="bg-slate-900 rounded-2xl p-5 text-white flex justify-between items-center">
                                <div>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Loss Value</p>
                                    <p className="text-2xl font-black text-red-400">
                                        ৳{totalEstimatedLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || products.length === 0}
                                    className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-wider text-sm hover:bg-red-700 disabled:bg-slate-700 disabled:text-slate-500 transition shadow-lg"
                                >
                                    {isSubmitting ? "Writing Off..." : "Confirm & Write Off"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- DETAILS & PRINT VOUCHER MODAL --- */}
            {showDetailsModal && selectedDisposal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
                        <div className="bg-slate-900 text-white px-8 py-5 flex justify-between items-center no-print">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <FileText className="w-5 h-5 text-red-400" /> Disposal Voucher #{String(selectedDisposal._id).slice(-8)}
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => window.print()}
                                    className="p-2 text-slate-300 hover:text-white rounded-lg transition"
                                    title="Print"
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

                        <div className="p-8 space-y-6 overflow-y-auto print:p-0">
                            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm">
                                <div>
                                    <span className="text-xs font-bold text-slate-400 uppercase">Farm Batch</span>
                                    <p className="font-bold text-slate-800">{selectedDisposal.batch_name || "General Stock"}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-bold text-slate-400 uppercase">Date</span>
                                    <p className="font-bold text-slate-800">
                                        {selectedDisposal.date ? format(new Date(selectedDisposal.date), "dd MMMM yyyy, p") : "N/A"}
                                    </p>
                                </div>
                            </div>

                            <div className="border border-slate-200 rounded-xl overflow-hidden text-sm">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs uppercase">
                                        <tr>
                                            <th className="px-4 py-2.5">Item</th>
                                            <th className="px-4 py-2.5 text-center w-24">Qty</th>
                                            <th className="px-4 py-2.5 text-right w-28">Cost</th>
                                            <th className="px-4 py-2.5 text-left w-36">Reason</th>
                                            <th className="px-4 py-2.5 text-right w-28">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {(selectedDisposal.products || []).map((p, i) => (
                                            <tr key={i}>
                                                <td className="px-4 py-2.5 font-semibold text-slate-800">{p.name}</td>
                                                <td className="px-4 py-2.5 text-center">{p.qty} {p.unit}</td>
                                                <td className="px-4 py-2.5 text-right">৳{Number(p.cost_price || 0).toFixed(2)}</td>
                                                <td className="px-4 py-2.5 text-xs text-red-600 font-medium">{p.reason}</td>
                                                <td className="px-4 py-2.5 text-right font-bold text-slate-900">৳{Number(p.subtotal || 0).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm">
                                <div>
                                    <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Remarks</span>
                                    <p className="text-slate-600 italic">{selectedDisposal.notes || "None"}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Total Loss</span>
                                    <p className="text-xl font-black text-red-600">৳{Number(selectedDisposal.total_loss_amount || 0).toFixed(2)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 px-8 py-4 border-t border-slate-200 flex justify-end gap-3 no-print">
                            <button
                                type="button"
                                onClick={() => setShowDetailsModal(false)}
                                className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-sm transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DisposeProducts;