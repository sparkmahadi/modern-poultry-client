import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router";
import {
    Package,
    Download,
    ArrowLeft,
    Search,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    Calendar,
    Edit3,
    DollarSign,
    Layers,
    Receipt
} from "lucide-react";
import TruckLoader from "../../components/Spinner/TruckLoader";

const ProductWisePurchases = ({
    fetchUrl = `${import.meta.env.VITE_API_BASE_URL}/api/purchases/product-purchases`,
    title = "Product Purchase Analytics"
}) => {
    const navigate = useNavigate();

    // Data States
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [expanded, setExpanded] = useState(null);

    // Server-Side Pagination States
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    // Fetch Product Purchase Records
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const urlObj = new URL(fetchUrl, window.location.origin);
            urlObj.searchParams.set("page", page);
            urlObj.searchParams.set("limit", limit);

            const res = await axios.get(urlObj.toString());
            const resData = res.data;

            setProducts(resData.data || []);

            if (resData.pagination) {
                setTotalPages(resData.pagination.totalPages || 1);
                setTotalRecords(resData.pagination.total || 0);
            } else {
                setTotalRecords((resData.data || []).length);
                setTotalPages(1);
            }
        } catch (err) {
            console.error("Product purchases sync error:", err);
            toast.error("Failed to sync product purchase records.");
        } finally {
            setLoading(false);
        }
    }, [fetchUrl, page, limit]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleLimitChange = (e) => {
        setLimit(Number(e.target.value));
        setPage(1);
        setExpanded(null);
    };

    // Excel Export
    const handleExportExcel = () => {
        const rows = products.flatMap((product) =>
            (product.purchases || []).map((purchase) => ({
                Product: product.product_name || "N/A",
                ProductID: product.product_id || "N/A",
                Supplier: purchase.supplier_name || "Walk-in Vendor",
                Qty: purchase.qty || 0,
                PurchasePrice: purchase.purchase_price || 0,
                Subtotal: purchase.subtotal || 0,
                PaymentMethod: purchase.payment_method || "N/A",
                Paid: purchase.paid_amount || 0,
                Due: purchase.payment_due || 0,
                Date: purchase.date
                    ? format(new Date(purchase.date), "yyyy-MM-dd HH:mm")
                    : "N/A"
            }))
        );

        if (rows.length === 0) {
            return toast.info("No records available to export.");
        }

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Product Purchases");

        ws["!cols"] = Array(10).fill({ wch: 18 });
        XLSX.writeFile(wb, `${title.replace(/\s+/g, "_")}_Page_${page}.xlsx`);
    };

    // Client-side quick search filtering on currently loaded page
    const filteredProducts = useMemo(() => {
        if (!search.trim()) return products;
        const query = search.toLowerCase();
        return products.filter((p) =>
            p.product_name?.toLowerCase().includes(query)
        );
    }, [products, search]);

    // Financial KPI stats
    const stats = useMemo(() => {
        return {
            totalProducts: totalRecords,
            pageQty: products.reduce((sum, p) => sum + (Number(p.total_qty) || 0), 0),
            pageAmount: products.reduce((sum, p) => sum + (Number(p.total_purchase_amount) || 0), 0)
        };
    }, [products, totalRecords]);

    if (loading && products.length === 0) return <TruckLoader />;

    return (
        <div className="container mx-auto p-4 md:p-6 max-w-7xl font-sans text-slate-700 space-y-6">
            {/* Top Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white p-5 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition text-slate-300 hover:text-white"
                        title="Back"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="p-3 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl">
                        <Package className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-white">{title}</h1>
                        <p className="text-xs text-slate-400 mt-0.5">
                            SKU-wise inventory procurement breakdown across {totalRecords.toLocaleString()} catalog products
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <button
                        type="button"
                        onClick={handleExportExcel}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    >
                        <Download className="w-3.5 h-3.5" /> Export Excel
                    </button>
                </div>
            </div>

            {/* KPI Metric Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-blue-600" /> Catalog SKUs Tracked
                    </span>
                    <div className="mt-2">
                        <span className="text-2xl font-black font-mono text-slate-900">
                            {stats.totalProducts.toLocaleString()}
                        </span>
                    </div>
                </div>

                <div className="bg-blue-50/50 border border-blue-200/70 p-5 rounded-2xl flex flex-col justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-blue-600" /> Page Units Sourced
                    </span>
                    <div className="mt-2">
                        <span className="text-2xl font-black font-mono text-blue-700">
                            {stats.pageQty.toLocaleString()}
                        </span>
                    </div>
                </div>

                <div className="bg-emerald-50/50 border border-emerald-200/70 p-5 rounded-2xl flex flex-col justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-emerald-600" /> Page Sourcing Outflow
                    </span>
                    <div className="mt-2">
                        <span className="text-2xl font-black font-mono text-emerald-700">
                            ৳{stats.pageAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Search and Row-Count Selector */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="relative w-full sm:w-96">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                        type="text"
                        placeholder="Search product on this page..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                    />
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <span>Products per page:</span>
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

            {/* Main Product Analytics Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-4 py-3.5">Product SKU</th>
                                <th className="px-4 py-3.5 text-center">Invoices</th>
                                <th className="px-4 py-3.5 text-center">Total Qty</th>
                                <th className="px-4 py-3.5 text-right">Avg Unit Rate (৳)</th>
                                <th className="px-4 py-3.5 text-right">Total Expense (৳)</th>
                                <th className="px-4 py-3.5 text-center">Last Purchase</th>
                                <th className="px-4 py-3.5 text-center w-28">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredProducts.map((product, idx) => {
                                const isExpanded = expanded === idx;
                                return (
                                    <React.Fragment key={product.product_id || idx}>
                                        <tr className="hover:bg-slate-50/70 transition-colors">
                                            <td className="px-4 py-3.5 font-bold text-slate-900">
                                                <div className="flex items-center gap-2">
                                                    <Package className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                                    <span>{product.product_name || "Unnamed Product"}</span>
                                                </div>
                                            </td>

                                            <td className="px-4 py-3.5 text-center">
                                                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                                                    {product.total_purchase_count || 0}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3.5 text-center font-mono font-bold text-blue-600">
                                                {Number(product.total_qty || 0).toLocaleString()}
                                            </td>

                                            <td className="px-4 py-3.5 text-right font-mono font-semibold text-slate-700">
                                                ৳{Number(product.avg_purchase_price || 0).toFixed(2)}
                                            </td>

                                            <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">
                                                ৳{Number(product.total_purchase_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>

                                            <td className="px-4 py-3.5 text-center text-xs text-slate-500 font-medium">
                                                {product.last_purchase_date
                                                    ? format(new Date(product.last_purchase_date), "dd MMM yyyy, hh:mm a")
                                                    : "-"}
                                            </td>

                                            <td className="px-4 py-3.5 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => setExpanded(isExpanded ? null : idx)}
                                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 mx-auto ${
                                                        isExpanded
                                                            ? "bg-slate-800 text-white"
                                                            : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                                                    }`}
                                                >
                                                    <span>{isExpanded ? "Hide" : "Details"}</span>
                                                    {isExpanded ? (
                                                        <ChevronUp className="w-3.5 h-3.5" />
                                                    ) : (
                                                        <ChevronDown className="w-3.5 h-3.5" />
                                                    )}
                                                </button>
                                            </td>
                                        </tr>

                                        {/* Collapsible Invoice Breakdown Sub-row */}
                                        {isExpanded && (
                                            <tr className="bg-slate-50/70 border-b border-slate-200">
                                                <td colSpan={7} className="p-4 md:p-6">
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                                                <Receipt className="w-4 h-4 text-blue-600" /> Sourcing Transactions for {product.product_name}
                                                            </span>
                                                            <span className="text-xs text-slate-400 font-medium">
                                                                {product.purchases?.length || 0} Purchase Orders
                                                            </span>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            {(product.purchases || []).map((p) => (
                                                                <div
                                                                    key={p._id}
                                                                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition flex flex-col justify-between space-y-3"
                                                                >
                                                                    <div className="flex justify-between items-start">
                                                                        <div>
                                                                            <p className="font-bold text-slate-900 text-sm">
                                                                                {p.supplier_name || "Walk-in Supplier"}
                                                                            </p>
                                                                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                                                                <Calendar className="w-3.5 h-3.5" />
                                                                                {p.date
                                                                                    ? format(new Date(p.date), "dd MMM yyyy, hh:mm a")
                                                                                    : "N/A"}
                                                                            </p>
                                                                        </div>

                                                                        <span
                                                                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                                                (p.payment_due || 0) > 0
                                                                                    ? "bg-rose-50 text-rose-600 border border-rose-100"
                                                                                    : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                                                            }`}
                                                                        >
                                                                            {(p.payment_due || 0) > 0 ? "Due" : "Settled"}
                                                                        </span>
                                                                    </div>

                                                                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-xs">
                                                                        <div>
                                                                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Qty</span>
                                                                            <span className="font-bold text-slate-800 font-mono">{p.qty}</span>
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Rate</span>
                                                                            <span className="font-bold text-slate-800 font-mono">৳{Number(p.purchase_price || 0).toFixed(2)}</span>
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Subtotal</span>
                                                                            <span className="font-bold text-slate-900 font-mono">৳{Number(p.subtotal || 0).toFixed(2)}</span>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex justify-between items-center pt-1">
                                                                        <span className="text-xs text-slate-500">
                                                                            Method: <strong className="uppercase">{p.payment_method || "Cash"}</strong>
                                                                        </span>

                                                                        <Link
                                                                            to={`/purchases/edit/${p._id}`}
                                                                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                                                                        >
                                                                            <Edit3 className="w-3 h-3 text-blue-600" /> Edit Order
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredProducts.length === 0 && (
                    <div className="p-12 text-center text-slate-400 font-medium italic text-sm">
                        No product purchasing records matching this criteria.
                    </div>
                )}

                {/* Pagination Controls */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <span className="text-slate-500 font-medium">
                        Showing {totalRecords === 0 ? 0 : (page - 1) * limit + 1} to{" "}
                        {Math.min(page * limit, totalRecords)} of {totalRecords} products
                    </span>

                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => {
                                setPage((prev) => Math.max(prev - 1, 1));
                                setExpanded(null);
                            }}
                            disabled={page <= 1}
                            className="p-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        {/* Page Numbers */}
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter((pNum) => pNum === 1 || pNum === totalPages || Math.abs(pNum - page) <= 1)
                            .map((pNum, index, arr) => (
                                <React.Fragment key={pNum}>
                                    {index > 0 && arr[index - 1] !== pNum - 1 && (
                                        <span className="px-1 text-slate-400">...</span>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPage(pNum);
                                            setExpanded(null);
                                        }}
                                        className={`w-7 h-7 rounded-lg font-bold transition ${
                                            page === pNum
                                                ? "bg-blue-600 text-white"
                                                : "text-slate-600 hover:bg-white border border-slate-200"
                                        }`}
                                    >
                                        {pNum}
                                    </button>
                                </React.Fragment>
                            ))}

                        <button
                            type="button"
                            onClick={() => {
                                setPage((prev) => Math.min(prev + 1, totalPages));
                                setExpanded(null);
                            }}
                            disabled={page >= totalPages}
                            className="p-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductWisePurchases;