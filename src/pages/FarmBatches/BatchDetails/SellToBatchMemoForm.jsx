// SellToBatchMemoForm.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
    Search,
    Trash2,
    CreditCard,
    Save,
    AlertTriangle,
    CheckCircle2,
    Layers,
    User,
    Calendar,
    FileText,
    Check
} from "lucide-react";
import PaymentModal from "../../Purchase/PaymentModal";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const SellToBatchMemoForm = ({ batchData, selectedCustomer, onSaleSuccess, onClose }) => {
    // --- Memo Metadata ---
    const [memoNo, setMemoNo] = useState(`INV-${Date.now().toString().slice(-6)}`);
    const [dateTime, setDateTime] = useState(() => {
        const now = new Date();
        return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    });
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Product Selection ---
    const [products, setProducts] = useState([]);
    const [productSearch, setProductSearch] = useState("");
    const [productResults, setProductResults] = useState([]);
    const [productLoading, setProductLoading] = useState(false);
    const [showProductResults, setShowProductResults] = useState(false);
    const productRef = useRef(null);

    // --- Payment & Accounting ---
    const [accountList, setAccountList] = useState([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentForm, setPaymentForm] = useState({
        payment_method: "cash",
        account_id: "",
        paid_amount: 0,
    });

    // 1. Load Payment Accounts and set default
    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/payment_accounts`);
                const accs = res.data?.data || [];
                setAccountList(accs);
                const defaultCash = accs.find((a) => a.type === "cash" && a.is_default);
                if (defaultCash) {
                    setPaymentForm((prev) => ({ ...prev, account_id: defaultCash._id }));
                }
            } catch (err) {
                console.error("Accounts fetch failed", err);
            }
        };
        fetchAccounts();
    }, []);

    // Close product dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (productRef.current && !productRef.current.contains(e.target)) {
                setShowProductResults(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // 2. Debounced Product Search
    useEffect(() => {
        const delay = setTimeout(async () => {
            const q = productSearch.trim();
            if (!q) return setProductResults([]);
            setProductLoading(true);
            try {
                const res = await axios.get(`${API_BASE_URL}/api/products/search?q=${encodeURIComponent(q)}`);
                setProductResults(res.data?.data || []);
                setShowProductResults(true);
            } catch {
                setProductResults([]);
            } finally {
                setProductLoading(false);
            }
        }, 300);
        return () => clearTimeout(delay);
    }, [productSearch]);

    // Product Line Items Management
    const addProduct = async (product) => {
        if (products.find((p) => p._id === product._id)) {
            return toast.warn("Product is already added.");
        }

        let stock = 0;
        try {
            const res = await axios.get(`${API_BASE_URL}/api/inventory/stock/${product._id}`);
            stock = res.data?.stock || 0;
        } catch (err) {
            console.warn("Stock fetch error", err);
        }

        if (stock < 1 && !window.confirm("Stock is 0. Proceed anyway?")) return;

        const price = Number(product.price || product.sale_price || 0);
        setProducts((prev) => [
            ...prev,
            {
                _id: product._id,
                item_name: product.item_name || product.name,
                qty: 1,
                price,
                subtotal: price,
                availableStock: stock,
            },
        ]);
        setProductSearch("");
        setShowProductResults(false);
    };

    const updateQty = (id, val) => {
        const qty = Number(val) || 0;
        setProducts((prev) =>
            prev.map((p) => (p._id === id ? { ...p, qty, subtotal: +(qty * p.price).toFixed(2) } : p))
        );
    };

    const updatePrice = (id, val) => {
        const price = Number(val) || 0;
        setProducts((prev) =>
            prev.map((p) => (p._id === id ? { ...p, price, subtotal: +(p.qty * price).toFixed(2) } : p))
        );
    };

    const updateSubtotal = (id, val) => {
        const subtotal = Number(val) || 0;
        setProducts((prev) =>
            prev.map((p) =>
                p._id === id ? { ...p, subtotal, price: p.qty > 0 ? +(subtotal / p.qty).toFixed(2) : 0 } : p
            )
        );
    };

    const removeProduct = (id) => setProducts((prev) => prev.filter((p) => p._id !== id));

    // Calculations
    const totalAmount = useMemo(
        () => products.reduce((acc, p) => acc + Number(p.subtotal || 0), 0),
        [products]
    );
    const remainingDue = useMemo(
        () => Math.max(0, Number(totalAmount.toFixed(2)) - Number(paymentForm.paid_amount || 0)),
        [totalAmount, paymentForm.paid_amount]
    );

    // 3. Save Memo Handler
    const handleSave = async (e) => {
        e.preventDefault();
        if (!memoNo.trim()) return toast.error("Enter memo number.");
        if (!selectedCustomer?._id && !batchData?.farmerId) return toast.error("Farmer account is missing.");
        if (products.length === 0) return toast.error("Please add at least one product.");
        if (paymentForm.paid_amount > 0 && !paymentForm.account_id) {
            return toast.error("Please select an account for the collected amount.");
        }

        const customerId = selectedCustomer?._id || batchData?.farmerId;

        const payload = {
            memoNo,
            date: dateTime ? new Date(dateTime).toISOString() : new Date().toISOString(),
            customer_id: customerId,
            batch_id: batchData?._id || null,
            products: products.map((p) => ({
                product_id: p._id,
                name: p.item_name,
                qty: p.qty,
                sale_price: p.price,
                subtotal: p.subtotal,
            })),
            total_amount: totalAmount,
            paid_amount: Number(paymentForm.paid_amount.toFixed(2)),
            payment_method: paymentForm.payment_method,
            account_id: paymentForm.account_id,
            due_amount: Number(remainingDue.toFixed(2)),
            notes,
        };

        setIsSubmitting(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/api/sales/create`, payload);
            if (res.data?.success) {
                toast.success("Batch direct sale memo created!");
                setProducts([]);
                setNotes("");
                setMemoNo(`INV-${Date.now().toString().slice(-6)}`);
                setPaymentForm((prev) => ({ ...prev, paid_amount: 0 }));

                if (typeof onSaleSuccess === "function") {
                    onSaleSuccess(res.data.data || res.data.sale);
                }
                if (typeof onClose === "function") {
                    onClose();
                }
            } else {
                toast.info(res.data?.message || "Operation completed.");
            }
        } catch (error) {
            console.error("Save failed:", error);
            toast.error(error.response?.data?.message || "Failed to record sale memo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-5 font-sans">
            {/* Context Header: Pre-linked Farmer & Batch Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs">
                <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <div>
                        <span className="text-slate-400 font-semibold block uppercase text-[10px]">Customer / Farmer</span>
                        <span className="text-slate-800 font-bold text-sm">
                            {selectedCustomer?.name || batchData?.farmer || "Unknown Farmer"}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <div>
                        <span className="text-slate-400 font-semibold block uppercase text-[10px]">Assigned Batch</span>
                        <span className="text-slate-800 font-bold text-sm">
                            {batchData?.chicksBreed || "Batch"} ({batchData?.chicksQuantity || 0} Birds)
                        </span>
                    </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-3">
                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <input
                            type="text"
                            value={memoNo}
                            onChange={(e) => setMemoNo(e.target.value)}
                            className="bg-transparent font-bold text-slate-800 focus:outline-none w-24 text-right"
                        />
                    </div>
                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <input
                            type="datetime-local"
                            value={dateTime}
                            onChange={(e) => setDateTime(e.target.value)}
                            className="bg-transparent text-[11px] font-semibold text-slate-700 focus:outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Product Autocomplete Input */}
            <div className="relative" ref={productRef}>
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                    type="text"
                    value={productSearch}
                    onFocus={() => setShowProductResults(true)}
                    onChange={(e) => {
                        setProductSearch(e.target.value);
                        setShowProductResults(true);
                    }}
                    placeholder="Search Feed (Starter, Grower), Vaccine or Medicine..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-24 py-2.5 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                />
                {productLoading && (
                    <span className="absolute right-3.5 top-3 text-xs text-blue-600 font-semibold animate-pulse">
                        Searching...
                    </span>
                )}

                {showProductResults && productResults.length > 0 && (
                    <ul className="absolute z-50 left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100">
                        {productResults.map((p) => (
                            <li
                                key={p._id}
                                onClick={() => addProduct(p)}
                                className="p-3 hover:bg-blue-50/70 cursor-pointer flex justify-between items-center transition"
                            >
                                <div>
                                    <span className="font-bold text-slate-800 text-sm block">{p.item_name || p.name}</span>
                                    {p.category && <span className="text-xs text-slate-400">{p.category}</span>}
                                </div>
                                <span className="text-sm font-bold text-blue-600">
                                    ৳{Number(p.price || p.sale_price || 0).toFixed(2)}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Product Line Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100/70 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                        <tr>
                            <th className="px-3 py-2.5">Item Description</th>
                            <th className="px-3 py-2.5 text-center w-28">Stock</th>
                            <th className="px-3 py-2.5 text-right w-24">Qty</th>
                            <th className="px-3 py-2.5 text-right w-28">Rate (৳)</th>
                            <th className="px-3 py-2.5 text-right w-32">Subtotal (৳)</th>
                            <th className="px-3 py-2.5 text-center w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                        {products.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-slate-400 italic text-xs">
                                    No items added. Search feed or medicine above to bill to this batch.
                                </td>
                            </tr>
                        ) : (
                            products.map((p) => {
                                const remaining = p.availableStock - p.qty;
                                return (
                                    <tr key={p._id} className="hover:bg-slate-50/60 transition">
                                        <td className="px-3 py-2.5 font-semibold text-slate-800">{p.item_name}</td>
                                        <td className="px-3 py-2.5 text-center">
                                            <span
                                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                                    remaining < 0
                                                        ? "bg-rose-50 text-rose-600"
                                                        : "bg-emerald-50 text-emerald-700"
                                                }`}
                                            >
                                                {remaining < 0 ? (
                                                    <AlertTriangle className="w-3 h-3" />
                                                ) : (
                                                    <CheckCircle2 className="w-3 h-3" />
                                                )}
                                                {remaining}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5 text-right">
                                            <input
                                                type="number"
                                                min="1"
                                                value={p.qty}
                                                onChange={(e) => updateQty(p._id, e.target.value)}
                                                className="w-16 text-right bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-800 focus:bg-white outline-none"
                                            />
                                        </td>
                                        <td className="px-3 py-2.5 text-right">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={p.price}
                                                onChange={(e) => updatePrice(p._id, e.target.value)}
                                                className="w-20 text-right bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-700 focus:bg-white outline-none"
                                            />
                                        </td>
                                        <td className="px-3 py-2.5 text-right">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={p.subtotal}
                                                onChange={(e) => updateSubtotal(p._id, e.target.value)}
                                                className="w-24 text-right bg-blue-50/40 border border-blue-200 rounded-lg px-2 py-1 font-bold text-blue-900 focus:bg-white outline-none"
                                            />
                                        </td>
                                        <td className="px-3 py-2.5 text-center">
                                            <button
                                                type="button"
                                                onClick={() => removeProduct(p._id)}
                                                className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Bottom Checkout & Accounting Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                <div className="md:col-span-5 space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                        Batch Memo Remarks
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g., Assigned 5 sacks of Starter feed & Vitamin AD3E..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none h-24 resize-none transition"
                    />
                </div>

                <div className="md:col-span-7 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                        <span className="text-xs font-bold uppercase text-slate-500">Total Memo Amount</span>
                        <span className="text-2xl font-black font-mono text-slate-900">
                            ৳{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                                Receiving Channel
                            </span>
                            <button
                                type="button"
                                onClick={() => setShowPaymentModal(true)}
                                className="w-full flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 transition"
                            >
                                <span className="flex items-center gap-1.5 uppercase">
                                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                                    {paymentForm.payment_method || "Cash"}
                                </span>
                                <span className="text-blue-600">Change</span>
                            </button>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[11px] font-bold uppercase text-slate-400">
                                    Collected Amount (৳)
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setPaymentForm((prev) => ({ ...prev, paid_amount: totalAmount }))}
                                    className="text-[10px] text-blue-600 font-bold hover:underline"
                                >
                                    Full Paid
                                </button>
                            </div>
                            <input
                                type="number"
                                min="0"
                                step="any"
                                value={paymentForm.paid_amount || ""}
                                onChange={(e) =>
                                    setPaymentForm((prev) => ({
                                        ...prev,
                                        paid_amount: Number(e.target.value) || 0,
                                    }))
                                }
                                placeholder="0.00"
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-emerald-600 outline-none text-right"
                            />
                        </div>
                    </div>

                    <div
                        className={`p-2.5 rounded-lg border flex items-center justify-between text-xs font-bold ${
                            remainingDue > 0
                                ? "bg-rose-50 border-rose-100 text-rose-800"
                                : "bg-emerald-50 border-emerald-100 text-emerald-800"
                        }`}
                    >
                        <span>{remainingDue > 0 ? "Remaining Due on Memo" : "Fully Paid"}</span>
                        <span className="font-mono text-sm">
                            ৳{remainingDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSubmitting || products.length === 0}
                        className="w-full py-3 bg-slate-900 hover:bg-black disabled:bg-slate-300 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {isSubmitting ? "Processing..." : "Confirm & Save Memo to Batch"}
                    </button>
                </div>
            </div>

            {/* Payment Modal */}
            <PaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                onSelectPayment={({ paymentMethod, accountId }) =>
                    setPaymentForm((prev) => ({ ...prev, payment_method: paymentMethod, account_id: accountId }))
                }
                defaultPaymentMethod={paymentForm.payment_method}
                defaultSelectedAccount={paymentForm.account_id}
            />
        </div>
    );
};

export default SellToBatchMemoForm;