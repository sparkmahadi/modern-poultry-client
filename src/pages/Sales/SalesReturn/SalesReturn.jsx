import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Calendar, Trash2, CreditCard, Search, MapPin, Phone, X, CornerUpLeft, ArrowLeft, Printer } from 'lucide-react';
import PaymentModal from '../../Purchase/PaymentModal';
import TruckLoader from '../../../components/Spinner/TruckLoader';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const RETURN_REASONS = [
    "Quality / Mortality",
    "Customer Cancelled",
    "Damaged Goods",
    "Wrong Item Delivered",
    "Weight Discrepancy",
    "Other"
];

const initialFormState = {
    customer_name: "",
    address: "",
    phone: "",
    due: 0,
    customerId: null,
    refund_amount: 0,
    payment_method: "",
    account_id: "",
    original_memo_no: "",
    notes: ""
};

const SalesReturn = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = Boolean(id && id !== 'add');

    // --- State Management ---
    const [form, setForm] = useState(initialFormState);
    const [products, setProducts] = useState([]);
    const [dateTime, setDateTime] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEditMode);

    // --- Customer Search State ---
    const [customerSearchQuery, setCustomerSearchQuery] = useState("");
    const [customerSearchResults, setCustomerSearchResults] = useState([]);
    const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
    const [showCustomerResults, setShowCustomerResults] = useState(false);

    // --- Product Search State ---
    const [productSearch, setProductSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [productSearchLoading, setProductSearchLoading] = useState(false);
    const [showProductResults, setShowProductResults] = useState(false);

    // --- Payment State ---
    const [accountList, setAccountList] = useState([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    // --- Refs ---
    const customerRef = useRef(null);
    const productRef = useRef(null);

    // --- Initial Setup & Accounts ---
    useEffect(() => {
        if (!isEditMode) {
            const now = new Date();
            const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 16);
            setDateTime(local);
        }

        const fetchAccounts = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/payment_accounts`);
                setAccountList(res.data?.data || []);
            } catch (err) {
                console.error("Failed to fetch accounts:", err);
            }
        };
        fetchAccounts();
    }, [isEditMode]);

    // --- Fetch Existing Return Record when in :id mode ---
    useEffect(() => {
        if (!isEditMode) return;

        const fetchReturnRecord = async () => {
            setInitialLoading(true);
            try {
                const res = await axios.get(`${API_BASE_URL}/api/sales/returns/${id}`);
                const data = res.data?.data;

                if (!data) throw new Error("Record not found");

                setForm({
                    customer_name: data.customer_name || "",
                    address: data.address || "",
                    phone: data.customer_phone || data.phone || "",
                    due: Number(data.customer_due ?? data.due ?? 0),
                    customerId: data.customer_id?._id || data.customer_id || null,
                    refund_amount: Number(data.refund_amount || 0),
                    payment_method: data.payment_method || "",
                    account_id: data.account_id || "",
                    original_memo_no: data.original_memo_no || "",
                    notes: data.notes || ""
                });

                setProducts(
                    (data.products || []).map((p) => ({
                        _id: p.product_id?._id || p.product_id || p._id,
                        item_name: p.name || p.item_name,
                        unit: p.unit || "pcs",
                        qty: Number(p.qty) || 1,
                        price: Number(p.return_price ?? p.sale_price ?? p.price ?? 0),
                        subtotal: Number(p.subtotal || 0),
                        availableStock: Number(p.availableStock || 0),
                        reason: p.reason || RETURN_REASONS[0]
                    }))
                );

                if (data.date) {
                    const parsed = new Date(data.date);
                    const local = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000)
                        .toISOString()
                        .slice(0, 16);
                    setDateTime(local);
                }
            } catch (err) {
                console.error("Error loading return record:", err);
                toast.error("Failed to load return record.");
                navigate("/sales-returns");
            } finally {
                setInitialLoading(false);
            }
        };

        fetchReturnRecord();
    }, [id, isEditMode, navigate]);

    // --- Outside Click Detection ---
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (customerRef.current && !customerRef.current.contains(event.target)) {
                setShowCustomerResults(false);
            }
            if (productRef.current && !productRef.current.contains(event.target)) {
                setShowProductResults(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- Debounced Customer Search ---
    useEffect(() => {
        if (isEditMode) return;

        const timer = setTimeout(async () => {
            const query = customerSearchQuery.trim();
            if (!query) {
                setCustomerSearchResults([]);
                return;
            }

            setCustomerSearchLoading(true);
            try {
                const res = await axios.get(`${API_BASE_URL}/api/customers/search?q=${encodeURIComponent(query)}`);
                setCustomerSearchResults(res.data?.data || []);
            } catch (err) {
                console.error("Customer search failed:", err);
                setCustomerSearchResults([]);
            } finally {
                setCustomerSearchLoading(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [customerSearchQuery, isEditMode]);

    const handleSelectCustomer = (c) => {
        setForm((prev) => ({
            ...prev,
            customerId: c._id,
            customer_name: c.name,
            address: c.address || "",
            phone: c.phone || "",
            due: Number(c.due || 0)
        }));
        setShowCustomerResults(false);
    };

    const clearCustomerSearch = () => {
        setForm((prev) => ({ ...prev, customer_name: "", customerId: null, due: 0 }));
        setCustomerSearchQuery("");
        setShowCustomerResults(false);
    };

    // --- Product Search ---
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

    const clearProductSearch = () => {
        setProductSearch("");
        setSearchResults([]);
        setShowProductResults(false);
    };

    // Add Product with Live Stock Check
    const addProduct = async (p) => {
        const exists = products.find((item) => item._id === p._id);
        if (exists) {
            toast.warn("Product is already added in return table.");
            return;
        }

        let stock = 0;
        try {
            const res = await axios.get(`${API_BASE_URL}/api/inventory/stock/${p._id}`);
            stock = res.data?.stock || 0;
        } catch (err) {
            console.warn("Could not fetch current stock:", err);
        }

        const initialPrice = Number(p.sale_price ?? p.price ?? 0);
        setProducts((prev) => [
            ...prev,
            {
                _id: p._id,
                item_name: p.item_name || p.name,
                unit: p.unit || "pcs",
                qty: 1,
                price: initialPrice,
                subtotal: initialPrice,
                availableStock: stock,
                reason: RETURN_REASONS[0]
            }
        ]);
        clearProductSearch();
    };

    const updateQty = (index, qty) => {
        const updated = [...products];
        const numeric = Number(qty) || 0;
        updated[index].qty = numeric;
        updated[index].subtotal = +(numeric * updated[index].price).toFixed(2);
        setProducts(updated);
    };

    const updatePrice = (index, price) => {
        const updated = [...products];
        const numeric = Number(price) || 0;
        updated[index].price = numeric;
        updated[index].subtotal = +(updated[index].qty * numeric).toFixed(2);
        setProducts(updated);
    };

    // Bidirectional Subtotal Calculation matching MemoForm
    const updateSubtotal = (index, subtotal) => {
        const updated = [...products];
        const subtotalVal = Number(subtotal) || 0;
        updated[index].subtotal = subtotalVal;
        updated[index].price = updated[index].qty > 0 ? +(subtotalVal / updated[index].qty).toFixed(2) : 0;
        setProducts(updated);
    };

    const updateReason = (index, reason) => {
        const updated = [...products];
        updated[index].reason = reason;
        setProducts(updated);
    };

    const removeProduct = (index) => {
        setProducts((prev) => prev.filter((_, i) => i !== index));
    };

    // --- Calculations ---
    const totalReturn = useMemo(() => {
        return products.reduce((sum, p) => sum + (Number(p.subtotal || 0)), 0);
    }, [products]);

    // Customer receivable due decreases by return value, but refunded cash negates that decrease
    const adjustedCustomerDue = useMemo(() => {
        const currentDue = Number(form.due || 0);
        const refundPaid = Number(form.refund_amount || 0);
        return Math.max(0, currentDue - totalReturn + refundPaid);
    }, [form.due, totalReturn, form.refund_amount]);

    const handlePaymentSelect = ({ paymentMethod, accountId }) => {
        setForm((prev) => ({
            ...prev,
            payment_method: paymentMethod,
            account_id: accountId
        }));
    };

    // --- Form Submission ---
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.customerId) return toast.warning("Please search and select a customer.");
        if (products.length === 0) return toast.warning("Add at least one product to return.");

        if (Number(form.refund_amount) > 0) {
            if (!form.payment_method) return toast.warning("Select refund payment method.");
            if (!form.account_id) return toast.warning("Select account to disburse refund.");
        }

        setIsSubmitting(true);
        try {
            const payload = {
                customer_id: form.customerId,
                original_memo_no: form.original_memo_no,
                date: new Date(dateTime).toISOString(),
                total_return_amount: totalReturn,
                refund_amount: Number(form.refund_amount) || 0,
                payment_method: form.payment_method || null,
                account_id: form.account_id || null,
                notes: form.notes,
                products: products.map((p) => ({
                    product_id: p._id,
                    name: p.item_name,
                    unit: p.unit,
                    qty: Number(p.qty),
                    return_price: Number(p.price),
                    subtotal: Number(p.subtotal),
                    reason: p.reason
                }))
            };

            if (isEditMode) {
                await axios.put(`${API_BASE_URL}/api/sales/returns/${id}`, payload);
                toast.success("Sales return voucher updated successfully!");
            } else {
                await axios.post(`${API_BASE_URL}/api/sales/return`, payload);
                toast.success("Sales return recorded successfully!");
            }

            navigate("/sales-returns");
        } catch (err) {
            console.error("Submission failed:", err);
            toast.error(err.response?.data?.message || "Operation failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (initialLoading) return <TruckLoader />;

    return (
        <div className="min-h-screen bg-[#f8fafc] p-5 font-sans antialiased text-slate-700">
            {/* Header */}
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <CornerUpLeft className="w-6 h-6 text-amber-600" />
                        {isEditMode ? `Sales Return #${id?.slice(-6)}` : 'New Sales Return Voucher'}
                    </h1>
                    <p className="text-slate-500 text-sm">
                        {isEditMode ? "Review and adjust customer return details" : "Process customer return, restock items & adjust balance due"}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate("/sales-returns")}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>

                    {isEditMode && (
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                        >
                            <Printer className="w-4 h-4" /> Print
                        </button>
                    )}

                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <input
                            type="datetime-local"
                            value={dateTime}
                            onChange={(e) => setDateTime(e.target.value)}
                            className="bg-transparent text-sm font-medium text-slate-600 focus:outline-none"
                        />
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column */}
                    <div className="lg:col-span-4 space-y-5">
                        {/* Customer Search Card */}
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 relative" ref={customerRef}>
                            <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 rounded-t-lg">
                                <h2 className="text-slate-800 text-base font-bold flex items-center gap-2">
                                    <Search className="w-4 h-4 text-slate-400" /> Customer Information
                                </h2>
                            </div>

                            <div className="p-5 space-y-4">
                                {!isEditMode ? (
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={form.customer_name}
                                            onFocus={() => setShowCustomerResults(true)}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setForm((prev) => ({ ...prev, customer_name: val, customerId: null }));
                                                setCustomerSearchQuery(val);
                                                setShowCustomerResults(true);
                                            }}
                                            placeholder="Search customer by name or phone..."
                                            className="w-full pl-4 pr-12 py-2.5 text-base bg-white border border-slate-300 rounded focus:ring-1 focus:ring-slate-400 outline-none transition"
                                        />
                                        <div className="absolute right-3 top-3 flex items-center gap-2">
                                            {form.customer_name && (
                                                <button type="button" onClick={clearCustomerSearch} className="text-slate-400 hover:text-slate-600">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                            {customerSearchLoading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-400 border-t-transparent"></div>}
                                        </div>

                                        {showCustomerResults && customerSearchResults.length > 0 && (
                                            <ul className="absolute left-0 right-0 z-[100] bg-white border border-slate-300 rounded-md shadow-2xl mt-1 max-h-80 overflow-y-auto divide-y divide-slate-100">
                                                {customerSearchResults.map((c) => (
                                                    <li key={c._id} onClick={() => handleSelectCustomer(c)} className="p-4 hover:bg-amber-50/50 cursor-pointer transition-colors">
                                                        <p className="text-base font-semibold text-slate-900">{c.name}</p>
                                                        <p className="text-sm text-slate-500">{c.phone}</p>
                                                        <span className="text-xs font-semibold text-rose-600">Receivable: ৳{Number(c.due || 0).toFixed(2)}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
                                        Customer on Record
                                    </div>
                                )}

                                <div className={`p-4 rounded border ${form.customerId ? 'bg-amber-50/30 border-amber-100' : 'bg-slate-50 border-slate-200'}`}>
                                    {form.customerId ? (
                                        <div className="space-y-2">
                                            <p className="text-base font-bold text-slate-800">{form.customer_name}</p>
                                            <div className="flex items-center gap-2 text-sm text-slate-500"><Phone className="w-4 h-4" /> {form.phone || 'N/A'}</div>
                                            <div className="flex items-center gap-2 text-sm text-slate-500"><MapPin className="w-4 h-4" /> {form.address || 'N/A'}</div>
                                            {!isEditMode && (
                                                <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-semibold text-slate-700">
                                                    <span>Previous Due Balance:</span>
                                                    <span className="text-rose-600 font-bold">৳{Number(form.due || 0).toFixed(2)}</span>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-3 text-slate-400 text-sm italic">Customer selection required</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Refund & Memo Ref Card */}
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 space-y-4">
                            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-slate-400" /> Cash Refund Paid (Optional)
                            </h2>

                            <button
                                type="button"
                                onClick={() => setShowPaymentModal(true)}
                                className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded text-base font-medium text-slate-700 hover:bg-slate-100 transition flex justify-between items-center"
                            >
                                <span className="text-xs uppercase text-slate-500 font-bold tracking-tight">Paid From</span>
                                <span className="text-base text-slate-900 font-semibold">{form.payment_method ? form.payment_method.toUpperCase() : 'None / Deduct Due'}</span>
                            </button>

                            <div className="flex flex-col">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Refund Disbursed (৳)</label>
                                <input
                                    type="number"
                                    name="refund_amount"
                                    value={form.refund_amount || ""}
                                    onChange={(e) => setForm((prev) => ({ ...prev, refund_amount: Number(e.target.value) }))}
                                    placeholder="0.00"
                                    className="bg-white border border-slate-300 rounded py-2.5 px-4 text-base w-full focus:ring-1 focus:ring-slate-400 outline-none"
                                />
                            </div>

                            <div className="flex flex-col">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Original Memo # (Optional)</label>
                                <input
                                    type="text"
                                    name="original_memo_no"
                                    value={form.original_memo_no || ""}
                                    onChange={(e) => setForm((prev) => ({ ...prev, original_memo_no: e.target.value }))}
                                    placeholder="e.g. INV-10492"
                                    className="bg-white border border-slate-300 rounded py-2.5 px-4 text-base w-full focus:ring-1 focus:ring-slate-400 outline-none"
                                />
                            </div>

                            <div className="flex flex-col">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Remarks / Driver Notes</label>
                                <input
                                    type="text"
                                    name="notes"
                                    value={form.notes || ""}
                                    onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Voucher reason, vehicle #, etc..."
                                    className="bg-white border border-slate-300 rounded py-2.5 px-4 text-base w-full focus:ring-1 focus:ring-slate-400 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Returned Line Items */}
                    <div className="lg:col-span-8 space-y-5">
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
                            <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight mb-5">Returned Stock Items</h2>

                            <div className="relative mb-6" ref={productRef}>
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Quick Search SKU / Product</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={productSearch}
                                        onFocus={() => setShowProductResults(true)}
                                        onChange={(e) => {
                                            handleProductSearch(e);
                                            setShowProductResults(true);
                                        }}
                                        placeholder="Enter item name or SKU..."
                                        className="bg-white border border-slate-300 rounded py-2.5 pl-4 pr-12 text-base w-full focus:ring-1 focus:ring-slate-400 outline-none transition"
                                    />
                                    <div className="absolute right-3 top-3 flex items-center gap-2">
                                        {productSearch && (
                                            <button type="button" onClick={clearProductSearch} className="text-slate-400 hover:text-slate-600">
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                        {productSearchLoading && <div className="animate-spin h-4 w-4 border-2 border-amber-500 border-t-transparent rounded-full"></div>}
                                    </div>
                                </div>

                                {showProductResults && searchResults.length > 0 && (
                                    <ul className="absolute left-0 right-0 z-[100] bg-white border border-slate-300 rounded-md shadow-2xl mt-1 max-h-80 overflow-y-auto divide-y divide-slate-100">
                                        {searchResults.map((p) => (
                                            <li key={p._id} onClick={() => addProduct(p)} className="p-4 hover:bg-slate-50 cursor-pointer flex justify-between items-center transition-colors">
                                                <div>
                                                    <span className="text-base font-semibold text-slate-800 block">{p.item_name}</span>
                                                    <span className="text-xs text-slate-500 uppercase">Unit: {p.unit || 'pcs'}</span>
                                                </div>
                                                <span className="text-lg font-bold text-amber-600">৳{Number(p.sale_price ?? p.price ?? 0).toFixed(2)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="border border-slate-200 rounded overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-widest font-bold">
                                        <tr>
                                            <th className="px-4 py-3.5">Product</th>
                                            <th className="px-4 py-3.5 text-center w-28">Stock After</th>
                                            <th className="px-4 py-3.5 text-center w-28">Return Qty</th>
                                            <th className="px-4 py-3.5 text-right w-32">Return Rate (৳)</th>
                                            <th className="px-4 py-3.5 text-left w-44">Reason</th>
                                            <th className="px-4 py-3.5 text-right w-32">Subtotal</th>
                                            <th className="px-2 py-3.5 text-center w-12"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {products.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="text-center py-8 text-slate-400 text-sm italic">
                                                    No products added to return voucher yet. Search above to add items.
                                                </td>
                                            </tr>
                                        ) : (
                                            products.map((p, index) => {
                                                const stockAfterReturn = Number(p.availableStock || 0) + Number(p.qty || 0);

                                                return (
                                                    <tr key={index} className="hover:bg-slate-50/50">
                                                        <td className="px-4 py-3 text-base font-medium text-slate-800">
                                                            {p.item_name}
                                                            <span className="text-xs text-slate-400 block font-normal">Unit: {p.unit}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-sm font-bold text-emerald-600">
                                                            +{stockAfterReturn}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="number"
                                                                min="0.01"
                                                                step="any"
                                                                value={p.qty}
                                                                onChange={(e) => updateQty(index, e.target.value)}
                                                                className="w-full bg-white border border-slate-200 rounded py-1.5 text-center text-base focus:border-slate-400 outline-none"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="any"
                                                                value={p.price}
                                                                onChange={(e) => updatePrice(index, e.target.value)}
                                                                className="w-full bg-white border border-slate-200 rounded py-1.5 text-right text-base focus:border-slate-400 outline-none"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <select
                                                                value={p.reason || RETURN_REASONS[0]}
                                                                onChange={(e) => updateReason(index, e.target.value)}
                                                                className="w-full bg-white border border-slate-200 rounded py-1.5 px-2 text-xs focus:border-slate-400 outline-none"
                                                            >
                                                                {RETURN_REASONS.map((r) => (
                                                                    <option key={r} value={r}>{r}</option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="any"
                                                                value={p.subtotal || ""}
                                                                onChange={(e) => updateSubtotal(index, e.target.value)}
                                                                className="w-full bg-white border border-slate-200 rounded py-1.5 text-right text-base font-bold text-slate-900 focus:border-slate-400 outline-none"
                                                            />
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
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Totals Bar */}
                        <div className="bg-slate-800 rounded-lg p-6 text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-inner">
                            <div className="flex gap-12">
                                <div>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Return Credit</p>
                                    <p className="text-3xl font-bold tracking-tight text-amber-400">
                                        ৳{totalReturn.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                {!isEditMode && (
                                    <div className="border-l border-slate-700 pl-12">
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Updated Customer Due</p>
                                        <p className="text-xl font-semibold text-slate-200">
                                            ৳{Number(adjustedCustomerDue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                )}
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting || products.length === 0 || !form.customerId}
                                className="w-full md:w-auto px-10 bg-amber-500 hover:bg-amber-600 text-slate-950 disabled:bg-slate-700 disabled:text-slate-500 py-4 rounded text-base font-bold transition-all uppercase tracking-widest shadow-lg"
                            >
                                {isSubmitting ? 'Saving...' : isEditMode ? 'Update Return Voucher' : 'Confirm Return'}
                            </button>
                        </div>
                    </div>
                </div>
            </form>

            <PaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                onSelectPayment={handlePaymentSelect}
                defaultPaymentMethod={form.payment_method}
            />
        </div>
    );
};

export default SalesReturn;