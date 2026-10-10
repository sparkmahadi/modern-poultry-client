import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import {
  FileText,
  Trash2,
  Eye,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Calendar,
  AlertCircle,
  Receipt,
  PackageCheck
} from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL;

const BatchSalesHistory = ({ batchId, onHistoryChange }) => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [expandedSaleId, setExpandedSaleId] = useState(null);
  const navigate = useNavigate();

  // --- Fetch Sales Records Linked to Batch ---
  const fetchSales = useCallback(async () => {
    if (!batchId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/batches/${batchId}/sales`);
      const list = res.data?.sales || res.data?.data || [];
      setSales(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Sales fetch error:", err);
      toast.error(err.response?.data?.message || "Failed to load sales history.");
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  // --- Complete Sale Deletion ---
  const handleDeleteFullSale = async (memoId) => {
    const confirmed = window.confirm(
      "Are you sure you want to completely DELETE this sale memo?\n\nThis will restore product stock to inventory, revert ledger balances, and remove this memo from the batch."
    );
    if (!confirmed) return;

    setDeletingId(memoId);
    try {
      const res = await axios.delete(`${API}/api/sales/${memoId}`);
      if (res.data?.success) {
        toast.success(res.data.message || "Sale memo deleted successfully.");
        setSales((prev) => prev.filter((s) => s._id !== memoId));
        if (typeof onHistoryChange === "function") {
          onHistoryChange();
        }
      } else {
        toast.error(res.data?.message || "Failed to delete sale.");
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error(err.response?.data?.message || "Server error while deleting sale.");
    } finally {
      setDeletingId(null);
    }
  };

  // --- Calculations ---
  const { totalAmount, totalPaid, totalDue } = useMemo(() => {
    return sales.reduce(
      (acc, s) => {
        const amt = Number(s.total_amount || s.total || 0);
        const paid = Number(s.paid_amount || s.paid || 0);
        const due = Number(s.due_amount || s.due || Math.max(0, amt - paid));
        return {
          totalAmount: acc.totalAmount + amt,
          totalPaid: acc.totalPaid + paid,
          totalDue: acc.totalDue + due,
        };
      },
      { totalAmount: 0, totalPaid: 0, totalDue: 0 }
    );
  }, [sales]);

  const toggleExpand = (id) => {
    setExpandedSaleId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-5 font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Batch Billing & Invoices
            </h2>
            <p className="text-xs text-slate-400">
              {sales.length} {sales.length === 1 ? "invoice" : "invoices"} recorded for this production run
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchSales}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Total Billed to Batch
          </span>
          <span className="text-xl font-black font-mono text-slate-900">
            ৳{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="bg-emerald-50/50 border border-emerald-200/70 p-4 rounded-xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
            Total Collected
          </span>
          <span className="text-xl font-black font-mono text-emerald-700">
            ৳{totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="bg-rose-50/50 border border-rose-200/70 p-4 rounded-xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 block mb-1">
            Outstanding Due
          </span>
          <span className="text-xl font-black font-mono text-rose-600">
            ৳{totalDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Content Area */}
      {loading && sales.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
          Loading invoices...
        </div>
      ) : sales.length === 0 ? (
        <div className="p-10 border border-dashed border-slate-200 rounded-xl text-center space-y-2">
          <PackageCheck className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-600">No sales recorded yet.</p>
          <p className="text-xs text-slate-400">
            Use the "Direct Billing" form above to issue feed and medicine memos to this batch.
          </p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Memo No</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Total (৳)</th>
                  <th className="px-4 py-3 text-right">Paid (৳)</th>
                  <th className="px-4 py-3 text-right">Due (৳)</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.map((sale) => {
                  const saleDue = Number(sale.due_amount || sale.due || 0);
                  const isExpanded = expandedSaleId === sale._id;
                  const hasProducts = Array.isArray(sale.products) && sale.products.length > 0;

                  return (
                    <React.Fragment key={sale._id}>
                      <tr className="hover:bg-slate-50/70 transition">
                        <td className="px-4 py-3 font-bold text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                            <span>{sale.memoNo || "N/A"}</span>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-xs text-slate-600">
                          {sale.date
                            ? new Date(sale.date).toLocaleDateString()
                            : "N/A"}
                        </td>

                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          ৳{Number(sale.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>

                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">
                          ৳{Number(sale.paid_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>

                        <td className="px-4 py-3 text-right font-mono font-bold text-rose-600">
                          ৳{saleDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              saleDue <= 0
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {saleDue <= 0 ? "Paid" : "Due"}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {hasProducts && (
                              <button
                                type="button"
                                onClick={() => toggleExpand(sale._id)}
                                title={isExpanded ? "Hide items" : "View items"}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => navigate(`/sales/${sale._id}`)}
                              title="Open Full Memo"
                              className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              disabled={deletingId === sale._id}
                              onClick={() => handleDeleteFullSale(sale._id)}
                              title="Delete Memo"
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition disabled:opacity-40"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Line Items Preview */}
                      {isExpanded && hasProducts && (
                        <tr className="bg-slate-50/70 border-b border-slate-100">
                          <td colSpan="7" className="px-6 py-3">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                              Billed Products Breakdown
                            </div>
                            <div className="divide-y divide-slate-200/60 bg-white rounded-lg border border-slate-200 p-2 text-xs">
                              {sale.products.map((item, idx) => (
                                <div
                                  key={item._id || item.product_id || idx}
                                  className="py-1.5 px-2 flex justify-between items-center"
                                >
                                  <span className="font-semibold text-slate-800">
                                    {item.name || item.item_name || "Item"}{" "}
                                    <span className="text-slate-400 font-normal">
                                      × {item.qty}
                                    </span>
                                  </span>
                                  <span className="font-mono text-slate-700">
                                    ৳{(Number(item.subtotal) || Number(item.sale_price || item.price || 0) * Number(item.qty || 1)).toFixed(2)}
                                  </span>
                                </div>
                              ))}
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
        </div>
      )}
    </div>
  );
};

export default BatchSalesHistory;